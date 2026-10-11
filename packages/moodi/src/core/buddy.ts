import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  Group,
  HemisphereLight,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { DEFAULTS, type Mood, type MoodChangeDetail, type Shape } from './constants';
import { autoCheek, autoFace, luminance, mix, parseColor, toCss, type RGB } from './color';
import { cloneFace, drawFace, FACE_KEYS, FOLLOW_WEIGHT, heart, MOOD_FACE, type FaceParams } from './face';
import { MOOD_OVERLAY, mixPose, moodPose, zeroPose, type OverlayKind, type Pose } from './motion';
import {
  bufferHeight,
  env,
  pointer,
  programReady,
  register,
  sharedRenderer,
  unregister,
  wake,
  type Tickable,
} from './runtime';
import { createBase, SHAPE_META, shapePoint } from './shapes';
import { playMood } from './sound';

export interface BuddyState {
  shape: Shape;
  mood: Mood;
  color?: string;
  faceColor?: string;
  cheekColor?: string;
  speed: number;
  followCursor: boolean;
  interactive: boolean;
  shadow: boolean;
  sound: boolean;
  /** ms after which the body calms down; 0 = never */
  settle: number;
}

const PIVOT = -0.85;
const BASES = new Map<number, { dirs: Float32Array; index: Uint32Array }>();

function base(segments: number) {
  let b = BASES.get(segments);
  if (!b) {
    const { geometry, dirs } = createBase(segments);
    b = { dirs, index: new Uint32Array(geometry.getIndex()!.array) };
    geometry.dispose();
    BASES.set(segments, b);
  }
  return b;
}

const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);

export class Buddy implements Tickable {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scene = new Scene();
  private camera = new PerspectiveCamera(30, 1, 0.1, 50);
  private group = new Group();
  private v = new Vector3();
  private mesh!: Mesh;
  private geometry = new BufferGeometry();
  private dirs!: Float32Array;
  private material: MeshStandardMaterial;
  private faceCanvas = document.createElement('canvas');
  private faceCtx: CanvasRenderingContext2D;
  private faceTex: CanvasTexture;
  private uniforms = {
    uFace: { value: null as unknown as CanvasTexture },
    uFaceY: { value: 0 },
    uFaceScale: { value: 1.5 },
  };

  state: BuddyState = { ...DEFAULTS };
  onMoodChange?: (d: MoodChangeDetail) => void;
  /** fires once, after the first frame is on the canvas */
  onReady?: () => void;

  private visible = false;
  private connected = false;
  get active() {
    return this.visible && this.connected && this.w > 0;
  }

  private w = 0;
  private h = 0;
  private t = Math.random() * 100;

  // shape morph
  private shapeFrom: Shape = DEFAULTS.shape;
  private shapeTo: Shape = DEFAULTS.shape;
  private morph = 1;
  private shapeDirty = true;

  // mood
  private shown: Mood = DEFAULTS.mood;
  private prevShown: Mood = DEFAULTS.mood;
  private tau = 10;
  private prevTau = 10;
  private blend = 1;
  private reaction: { mood: Mood; left: number } | null = null;
  private pose = zeroPose();
  private poseIdle = zeroPose();
  /** real seconds since the current mood was shown (for `settle`) */
  private moodTime = 0;
  private poseA = zeroPose();
  private poseB = zeroPose();

  // face
  private face: FaceParams = cloneFace(MOOD_FACE.idle);
  private target: FaceParams = cloneFace(MOOD_FACE.idle);
  private drawn = new Float32Array(FACE_KEYS.length + 7).fill(NaN);
  private blink = 1;
  private blinkT = -1;
  private nextBlink = 2 + Math.random() * 3;

  // colors (sRGB)
  private body: RGB = parseColor(DEFAULTS.color, [0.95, 0.63, 0.48]);
  private bodyT: RGB = this.body;
  private faceC: RGB = autoFace(this.body);
  private faceCT: RGB = this.faceC;
  private cheek: RGB = autoCheek(this.body);
  private cheekT: RGB = this.cheek;

  // motion
  private look = { x: 0, y: 0 };
  private wander = { x: 0, y: 0, next: 0 };
  private squash = 0;
  private squashV = 0;
  private pop = 0.6;
  private popV = 0;
  private hover = 0;
  hovering = false;
  private overlay: Record<OverlayKind, number> = { dots: 0, zz: 0, hearts: 0, waves: 0, bang: 0 };
  private needsFrame = true;
  private ready = false;
  // adaptive resolution: drop pixel density when frames are expensive (software GL, weak GPUs)
  private css: [number, number] = [0, 0];
  private quality = 1;
  private lowPowerApplied = false;
  private cost = 0;
  private costFrames = 0;
  private lastFrame: number[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.faceCtx = this.faceCanvas.getContext('2d')!;
    this.faceCanvas.width = this.faceCanvas.height = 256;
    this.faceTex = new CanvasTexture(this.faceCanvas);
    this.faceTex.colorSpace = SRGBColorSpace;
    this.faceTex.minFilter = LinearMipmapLinearFilter;
    this.faceTex.anisotropy = 4;
    this.uniforms.uFace.value = this.faceTex;

    this.setSegments(24);
    this.material = this.createMaterial();
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.position.y = -PIVOT;
    this.group.add(this.mesh);
    this.scene.add(this.group);

    this.scene.add(new HemisphereLight(0xfff3e8, 0x6e625c, 1.7));
    const key = new DirectionalLight(0xffffff, 1.9);
    key.position.set(2.5, 3.5, 4);
    const rim = new DirectionalLight(0xffe6d2, 1.4);
    rim.position.set(-3.5, 2, -3);
    const fill = new DirectionalLight(0xfff0e6, 0.45);
    fill.position.set(-2, -1, 3);
    this.scene.add(key, rim, fill);

    this.camera.position.set(0, 0.3, 6.6);
    this.camera.lookAt(0, 0.12, 0);
  }

  private createMaterial() {
    // standard (not physical) material: far cheaper to compile; the soft sheen is
    // faked with a rim term below
    const m = new MeshStandardMaterial({ roughness: 0.62, metalness: 0 });
    m.color.setRGB(...this.body, SRGBColorSpace);
    m.customProgramCacheKey = () => 'moodi-1';
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vFaceP;\nvarying vec3 vFaceN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFaceP = position;\nvFaceN = objectNormal;');
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
varying vec3 vFaceP;
varying vec3 vFaceN;
uniform sampler2D uFace;
uniform float uFaceY;
uniform float uFaceScale;`,
        )
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
vec2 fuv = vec2(vFaceP.x, vFaceP.y - uFaceY) / uFaceScale + 0.5;
float inb = step(0.0, fuv.x) * step(fuv.x, 1.0) * step(0.0, fuv.y) * step(fuv.y, 1.0);
vec4 fc = texture2D(uFace, fuv);
float faceMask = fc.a * inb * smoothstep(0.12, 0.45, normalize(vFaceN).z);
diffuseColor.rgb = mix(diffuseColor.rgb, fc.rgb, faceMask);`,
        )
        .replace(
          '#include <roughnessmap_fragment>',
          '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.35, faceMask * 0.7);',
        )
        .replace(
          '#include <opaque_fragment>',
          `float rimK = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
outgoingLight += diffuseColor.rgb * 0.24 * rimK * rimK + vec3(0.05) * pow(rimK, 4.0);
// soft contact shading on the underside
outgoingLight *= mix(0.62, 1.0, smoothstep(-0.95, 0.35, normalize(vFaceN).y));
// eyes and mouth glow a little: mostly unlit, so they read as light, not paint
float emis = smoothstep(0.75, 1.0, fc.a) * inb * smoothstep(0.12, 0.45, normalize(vFaceN).z);
outgoingLight = mix(outgoingLight, diffuseColor.rgb * 1.12, emis * 0.65);
#include <opaque_fragment>`,
        );
    };
    return m;
  }

  private setSegments(seg: number) {
    const b = base(seg);
    if (this.dirs === b.dirs) return;
    this.dirs = b.dirs;
    this.geometry.dispose();
    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(new Float32Array(b.dirs.length), 3));
    this.geometry.setIndex(new BufferAttribute(b.index, 1));
    if (this.mesh) this.mesh.geometry = this.geometry;
    this.shapeDirty = true;
  }

  // ---------- public API ----------

  connect() {
    this.connected = true;
    register(this);
  }

  disconnect() {
    this.connected = false;
    unregister(this);
  }

  setVisible(v: boolean) {
    this.visible = v;
    if (v) wake();
  }

  resize(cssW: number, cssH: number) {
    this.css = [cssW, cssH];
    const dpr = (env.lowPower ? 1 : Math.min(2, devicePixelRatio || 1)) * this.quality;
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (w === this.w && h === this.h) return;
    this.w = this.canvas.width = w;
    this.h = this.canvas.height = h;
    const px = Math.min(w, h);
    // tiny thumbnails have no room for decorations, so frame them tighter
    const css = Math.min(cssW, cssH);
    this.camera.position.set(0, 0.3, css < 90 ? 5.1 : 6.1);
    this.camera.lookAt(0, css < 90 ? 0.02 : 0.12, 0);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.setSegments(px < 160 ? 16 : px < 400 ? 24 : 32);
    const fs = px < 220 ? 256 : 512;
    if (this.faceCanvas.width !== fs) {
      this.faceCanvas.width = this.faceCanvas.height = fs;
      this.faceTex.dispose();
      this.drawn.fill(NaN);
    }
    this.needsFrame = true;
    wake();
  }

  update(next: Partial<BuddyState>) {
    const prev = this.state;
    this.state = { ...prev, ...next };
    const s = this.state;
    if (s.shape !== this.shapeTo) {
      this.shapeFrom = this.shapeTo;
      this.shapeTo = s.shape;
      this.morph = 0;
      if (!env.reducedMotion) this.squashV -= 2.2;
    }
    if (s.color !== prev.color || s.faceColor !== prev.faceColor || s.cheekColor !== prev.cheekColor) {
      this.bodyT = parseColor(s.color, parseColor(DEFAULTS.color, this.bodyT));
      this.faceCT = s.faceColor ? parseColor(s.faceColor, autoFace(this.bodyT)) : autoFace(this.bodyT);
      this.cheekT = s.cheekColor ? parseColor(s.cheekColor, autoCheek(this.bodyT)) : autoCheek(this.bodyT);
    }
    if (s.mood !== prev.mood && !this.reaction) this.show(s.mood);
    // switching sound on plays the current mood, so the toggle is audible
    if (s.sound && !prev.sound && this.ready) playMood(this.shown);
    this.needsFrame = true;
    wake();
  }

  /** A quick squash-and-stretch, e.g. when the element is resized. */
  bump(strength = 1) {
    if (env.reducedMotion) return;
    this.squashV -= 1.6 * strength;
    this.needsFrame = true;
    wake();
  }

  /** Temporary reaction, then back to the current mood. */
  react(mood: Mood, duration = 1200) {
    this.reaction = { mood, left: duration / 1000 };
    this.show(mood);
  }

  get currentMood() {
    return this.shown;
  }

  dispose() {
    this.disconnect();
    this.geometry.dispose();
    this.material.dispose();
    this.faceTex.dispose();
    this.onMoodChange = undefined;
  }

  // ---------- internals ----------

  private show(mood: Mood, audible = true) {
    if (mood === this.shown) return;
    if (audible && this.state.sound && this.ready) playMood(mood);
    const previous = this.shown;
    this.prevShown = previous;
    this.prevTau = this.tau;
    this.shown = mood;
    this.tau = 0;
    this.moodTime = 0;
    this.blend = 0;
    if (!env.reducedMotion) this.squashV -= 1.1;
    this.onMoodChange?.({ mood, previous, reaction: !!this.reaction });
  }

  tick(dt: number, now: number) {
    const s = this.state;
    const reduced = env.reducedMotion;
    // software WebGL can't keep up with continuous animation: only transitions render there
    const da = env.lowPower ? 0 : dt * Math.max(0, s.speed);
    this.t += da;
    this.tau += da;
    this.prevTau += da;

    if (this.reaction) {
      this.reaction.left -= dt;
      if (this.reaction.left <= 0) {
        this.reaction = null;
        // back from a reaction is not a new state: stay quiet
        this.show(s.mood, false);
      }
    }

    // ---- settle: after `settle` ms in a mood, the body eases back to calm idle breathing
    // and the extras fade out; the face keeps its expression
    this.moodTime += dt;
    const calm =
      s.settle > 0 && this.shown !== 'idle' ? ease(Math.min(1, Math.max(0, (this.moodTime - s.settle / 1000) / 0.7))) : 0;

    // ---- body pose
    moodPose(this.shown, this.t, this.tau, this.poseB);
    if (calm > 0) mixPose(this.poseB, moodPose('idle', this.t, this.tau, this.poseIdle), calm, this.poseB);
    if (this.blend < 1) {
      this.blend = Math.min(1, this.blend + dt / 0.45);
      moodPose(this.prevShown, this.t, this.prevTau, this.poseA);
      mixPose(this.poseA, this.poseB, ease(this.blend), this.pose);
    } else Object.assign(this.pose, this.poseB);
    const p: Pose = this.pose;
    if (reduced) p.y = p.rx = p.ry = p.rz = p.st = p.lookX = 0;

    // ---- gaze
    const follow = s.followCursor && !reduced && s.speed > 0 ? FOLLOW_WEIGHT[this.shown] : 0;
    let gx = 0, gy = 0;
    if (follow > 0 && pointer.known) {
      const r = this.canvas.getBoundingClientRect();
      const span = Math.max(200, r.width * 0.85);
      gx = Math.max(-1, Math.min(1, (pointer.x - (r.left + r.width / 2)) / span));
      gy = Math.max(-1, Math.min(1, (pointer.y - (r.top + r.height * 0.45)) / span));
      gx *= follow;
      gy *= follow;
    } else if (this.shown === 'idle' && !reduced && s.speed > 0) {
      if (this.t > this.wander.next) {
        const calm = Math.random() < 0.4;
        this.wander.x = calm ? 0 : (Math.random() * 2 - 1) * 0.6;
        this.wander.y = calm ? 0 : (Math.random() * 2 - 1) * 0.35;
        this.wander.next = this.t + 1.8 + Math.random() * 2.6;
      }
      gx = this.wander.x;
      gy = this.wander.y;
    }
    const kl = damp(7, dt);
    this.look.x += (gx - this.look.x) * kl;
    this.look.y += (gy - this.look.y) * kl;

    // ---- face params
    const mf = MOOD_FACE[this.shown];
    const tg = this.target;
    for (const k of FACE_KEYS) tg[k] = mf[k];
    tg.lookX += this.look.x + p.lookX;
    tg.lookY += this.look.y + p.lookY;
    tg.mouthOpen += p.mouth;
    tg.eyeOpen += this.hover * 0.08;
    const kf = damp(11, dt);
    for (const k of FACE_KEYS) this.face[k] += (tg[k] - this.face[k]) * kf;
    // the gaze reads snappier than the expression
    const kg = damp(16, dt);
    this.face.lookX += (tg.lookX - this.face.lookX) * kg;
    this.face.lookY += (tg.lookY - this.face.lookY) * kg;
    this.face.mouthOpen += (tg.mouthOpen - this.face.mouthOpen) * kg;

    // ---- blink
    this.nextBlink -= da;
    if (this.nextBlink <= 0 && this.blinkT < 0) {
      this.blinkT = 0;
      this.nextBlink = Math.random() < 0.2 ? 0.25 : 2.2 + Math.random() * 3.8;
    }
    if (this.blinkT >= 0) {
      this.blinkT += da;
      const k = this.blinkT / 0.16;
      this.blink = k >= 1 ? 1 : 1 - Math.sin(Math.PI * k);
      if (k >= 1) this.blinkT = -1;
    }

    // ---- springs
    const sub = Math.min(dt, 1 / 30);
    this.squashV += (-170 * this.squash - 11 * this.squashV) * sub;
    this.squash += this.squashV * sub;
    if (reduced) this.squash = this.squashV = 0;
    if (reduced) this.pop = 1;
    else {
      this.popV += (-140 * (this.pop - 1) - 13 * this.popV) * sub;
      this.pop += this.popV * sub;
    }
    this.hover += ((this.hovering && s.interactive ? 1 : 0) - this.hover) * damp(12, dt);

    // ---- colors
    const kc = damp(9, dt);
    this.body = mix(this.body, this.bodyT, kc);
    this.faceC = mix(this.faceC, this.faceCT, kc);
    this.cheek = mix(this.cheek, this.cheekT, kc);
    this.material.color.setRGB(this.body[0], this.body[1], this.body[2], SRGBColorSpace);

    // ---- overlays
    const ov = MOOD_OVERLAY[this.shown];
    const ko = damp(6, dt);
    for (const k of Object.keys(this.overlay) as OverlayKind[])
      this.overlay[k] += ((ov === k ? 1 - calm : 0) - this.overlay[k]) * ko;

    // ---- geometry
    if (this.morph < 1) {
      this.morph = Math.min(1, this.morph + dt / (reduced ? 0.2 : 0.38));
      this.shapeDirty = true;
    }
    const animated = SHAPE_META[this.shapeTo].animated || (this.morph < 1 && SHAPE_META[this.shapeFrom].animated);
    if (this.shapeDirty || (animated && da > 0)) this.rebuild();

    // ---- transform
    const g = this.group;
    const sy = (1 + p.st + this.squash) * (1 + this.hover * 0.04);
    const sx = (1 / Math.sqrt(Math.max(0.3, 1 + p.st + this.squash))) * (1 + this.hover * 0.04);
    g.position.y = PIVOT + p.y;
    g.rotation.set(p.rx + this.look.y * 0.22 * (follow > 0 ? 1 : 0), p.ry + this.look.x * 0.42, p.rz);
    g.scale.set(sx * this.pop, sy * this.pop, sx * this.pop);

    const faceChanged = this.drawFaceIfNeeded();
    // paused and nothing moved: keep the last frame
    if ((s.speed === 0 || env.lowPower) && !faceChanged && !this.needsFrame && this.settled()) return;
    const t0 = performance.now();
    if (this.render(p)) {
      this.needsFrame = false;
      if (!this.ready) {
        this.ready = true;
        if (this.state.sound) playMood(this.shown, true);
        this.onReady?.();
        this.onReady = undefined;
      }
      this.adapt(performance.now() - t0);
    }
  }

  private adapt(ms: number) {
    this.cost = this.costFrames ? this.cost * 0.9 + ms * 0.1 : ms;
    if (++this.costFrames < 20 || this.cost < 9 || this.quality <= 0.5) return;
    this.quality = Math.max(0.5, this.quality - 0.25);
    this.costFrames = 0;
    this.resize(this.css[0], this.css[1]);
  }

  /** Snapshot of everything visible; true when it matches the last rendered frame. */
  private settled() {
    const g = this.group;
    const o = this.overlay;
    const now = [o.bang,
      g.position.y, g.rotation.x, g.rotation.y, g.rotation.z, g.scale.x, g.scale.y,
      ...this.body, this.morph, o.dots, o.zz, o.hearts, o.waves,
    ];
    const last = this.lastFrame;
    let same = last.length === now.length;
    for (let i = 0; same && i < now.length; i++) same = Math.abs(now[i] - last[i]) < 1e-4;
    this.lastFrame = now;
    return same;
  }

  private rebuild() {
    const pos = this.geometry.getAttribute('position') as BufferAttribute;
    const arr = pos.array as Float32Array;
    const d = this.dirs;
    const k = ease(this.morph);
    const from = this.shapeFrom;
    const to = this.shapeTo;
    const a = new Float32Array(3);
    for (let i = 0; i < d.length; i += 3) {
      shapePoint(to, d[i], d[i + 1], d[i + 2], this.t, arr, i);
      if (k < 1) {
        shapePoint(from, d[i], d[i + 1], d[i + 2], this.t, a, 0);
        arr[i] = a[0] + (arr[i] - a[0]) * k;
        arr[i + 1] = a[1] + (arr[i + 1] - a[1]) * k;
        arr[i + 2] = a[2] + (arr[i + 2] - a[2]) * k;
      }
    }
    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
    const mf = SHAPE_META[from], mt = SHAPE_META[to];
    this.uniforms.uFaceY.value = mf.faceY + (mt.faceY - mf.faceY) * k;
    this.uniforms.uFaceScale.value = mf.faceScale + (mt.faceScale - mf.faceScale) * k;
    this.shapeDirty = false;
  }

  private drawFaceIfNeeded(): boolean {
    const f = this.face;
    const d = this.drawn;
    let changed = false;
    let i = 0;
    for (const k of FACE_KEYS) {
      if (!(Math.abs(d[i] - f[k]) < 0.002)) {
        changed = true;
        d[i] = f[k];
      }
      i++;
    }
    const extra = [this.blink, ...this.faceC, ...this.cheek];
    for (const v of extra) {
      if (!(Math.abs(d[i] - v) < 0.002)) {
        changed = true;
        d[i] = v;
      }
      i++;
    }
    if (!changed) return false;
    const light = luminance(this.faceC) > 0.45;
    drawFace(
      this.faceCtx,
      f,
      this.blink,
      toCss(this.faceC),
      toCss(this.cheek),
      light ? 1 : 0.3,
      toCss(mix(this.faceC, [1, 1, 1], light ? 0.6 : 0.16)),
      light ? toCss(mix(this.body, [0.04, 0.03, 0.06], 0.86)) : '#fff',
      toCss(light ? mix(this.body, [0.03, 0.02, 0.05], 0.78) : mix(this.faceC, [0, 0, 0], 0.35)),
      toCss(this.faceC),
    );
    this.faceTex.needsUpdate = true;
    return true;
  }

  private project(x: number, y: number, z: number) {
    const v = this.v.set(x, y, z).applyMatrix4(this.group.matrixWorld).project(this.camera);
    return [(v.x * 0.5 + 0.5) * this.w, (-v.y * 0.5 + 0.5) * this.h] as const;
  }

  private render(p: Pose): boolean {
    const { w, h, ctx } = this;
    const r = sharedRenderer(w, h);
    if (env.lowPower && !this.lowPowerApplied) {
      // detected on renderer creation: drop to 1x pixels before the first real frame
      this.lowPowerApplied = true;
      const [cw, ch] = this.css;
      this.w = this.h = 0;
      this.resize(cw, ch);
      return false;
    }
    if (!programReady(this.scene, this.camera)) return false;
    ctx.clearRect(0, 0, w, h);
    this.group.updateMatrixWorld();

    if (this.state.shadow) {
      const v = this.v.set(0, PIVOT - 0.08, 0).project(this.camera);
      const sx = (v.x * 0.5 + 0.5) * w;
      const sy = (-v.y * 0.5 + 0.5) * h;
      const lift = Math.max(0, p.y) * 3;
      const rw = Math.min(w, h) * 0.26 * (1 - lift * 0.25) * this.pop;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rw);
      const c = mix(this.body, [0.05, 0.03, 0.02], 0.75);
      g.addColorStop(0, `rgba(${(c[0] * 255) | 0},${(c[1] * 255) | 0},${(c[2] * 255) | 0},${0.42 * (1 - lift * 0.4)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(1, 0.22);
      ctx.translate(-sx, -sy);
      ctx.beginPath();
      ctx.arc(sx, sy, rw, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    r.setViewport(0, 0, w, h);
    r.setScissor(0, 0, w, h);
    r.render(this.scene, this.camera);
    ctx.drawImage(r.domElement, 0, bufferHeight() - h, w, h, 0, 0, w, h);

    this.drawOverlays();
    return true;
  }

  private drawOverlays() {
    const o = this.overlay;
    if (o.dots + o.zz + o.hearts + o.waves + o.bang < 0.01) return;
    const { ctx } = this;
    const t = this.t;
    const reduced = env.reducedMotion;
    const W = Math.min(this.w, this.h);
    const tint = mix(this.body, [1, 1, 1], 0.22);
    const fill = toCss(tint);
    ctx.save();

    // thinking: a trail of bubbles that pop in one by one, the last one "typing"
    if (o.dots > 0.01) {
      const [ax, ay] = this.project(0.6, 0.92, 0.2);
      const cyc = reduced ? 2 : (t * 0.55) % 1.6;
      const sizes = [0.014, 0.022, 0.052];
      for (let i = 0; i < 3; i++) {
        const k = reduced ? 1 : backOut(clamp01((cyc - i * 0.18) / 0.32));
        const bob = reduced ? 0 : Math.sin(t * 2.2 + i) * W * 0.006;
        const x = ax + [0, 0.05, 0.12][i] * W;
        const y = ay - [0, 0.05, 0.12][i] * W + bob;
        const r = sizes[i] * W * k;
        if (r <= 0.2) continue;
        ctx.globalAlpha = o.dots * 0.95;
        ctx.fillStyle = fill;
        ctx.beginPath();
        if (i < 2) ctx.arc(x, y, r, 0, Math.PI * 2);
        else cloud(ctx, x, y, r);
        ctx.fill();
        if (i === 2 && k > 0.6) {
          ctx.fillStyle = toCss(mix(this.body, [0, 0, 0], 0.35));
          for (let j = 0; j < 3; j++) {
            const hop = reduced ? 0 : Math.max(0, Math.sin(t * 7 - j * 0.9)) * r * 0.16;
            ctx.beginPath();
            ctx.arc(x + (j - 1) * r * 0.34, y - hop, r * 0.1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // sleeping: Z's drift up, sway and grow
    if (o.zz > 0.01) {
      const [ax, ay] = this.project(0.45, 0.85, 0.2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = fill;
      for (let i = 0; i < 3; i++) {
        const l = reduced ? 0.25 + i * 0.25 : (t * 0.33 + i / 3) % 1;
        const x = ax + l * W * 0.17 + Math.sin(l * 7 + i) * W * 0.018;
        const y = ay - easeOut(l) * W * 0.26;
        ctx.globalAlpha = o.zz * Math.min(1, l * 5) * (1 - l) * 1.3;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.25 + Math.sin(l * 5 + i) * 0.22);
        ctx.font = `800 ${Math.round(W * (0.05 + 0.06 * l))}px ui-rounded, system-ui, sans-serif`;
        ctx.fillText('z', 0, 0);
        ctx.restore();
      }
    }

    // love: hearts pop, wobble and float away
    if (o.hearts > 0.01) {
      const [ax, ay] = this.project(0, 0.8, 0.2);
      const rose = mix(this.cheek, [1, 0.3, 0.45], 0.55);
      for (let i = 0; i < 4; i++) {
        const l = reduced ? 0.4 : (t * 0.3 + i / 4) % 1;
        const side = i % 2 ? 1 : -1;
        const x = ax + side * W * (0.16 + 0.07 * (i >> 1)) + Math.sin(l * 6 + i) * W * 0.025;
        const y = ay - W * 0.02 - easeOut(l) * W * 0.28;
        const k = reduced ? 1 : backOut(clamp01(l / 0.22));
        const s = W * (0.026 + 0.008 * (i % 3)) * k;
        ctx.globalAlpha = o.hearts * (1 - Math.max(0, (l - 0.6) / 0.4));
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(t * 3 + i) * 0.25);
        const g = ctx.createLinearGradient(0, -s, 0, s);
        g.addColorStop(0, toCss(mix(rose, [1, 1, 1], 0.35)));
        g.addColorStop(1, toCss(rose));
        ctx.fillStyle = g;
        heart(ctx, 0, 0, s);
        ctx.fill();
        ctx.restore();
      }
    }

    // listening: sound arcs ripple in on both sides
    if (o.waves > 0.01) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = fill;
      for (const side of [-1, 1]) {
        const [ax, ay] = this.project(side * 1.0, 0.12, 0);
        for (let i = 0; i < 3; i++) {
          const l = reduced ? 0.3 + i * 0.2 : (t * 0.8 + i / 3) % 1;
          const e = easeOut(l);
          ctx.globalAlpha = o.waves * Math.sin(Math.PI * l) * 0.9;
          ctx.lineWidth = W * (0.016 - 0.008 * l);
          ctx.beginPath();
          const rad = W * (0.03 + 0.11 * e);
          if (side > 0) ctx.arc(ax - W * 0.03, ay, rad, -0.55, 0.55);
          else ctx.arc(ax + W * 0.03, ay, rad, Math.PI - 0.55, Math.PI + 0.55);
          ctx.stroke();
        }
      }
    }

    // surprised: a quick "!" pops above the head
    if (o.bang > 0.01) {
      const [ax, ay] = this.project(0.55, 1.0, 0.2);
      const k = reduced ? 1 : backOut(clamp01(this.tau / 0.35));
      ctx.globalAlpha = o.bang;
      ctx.fillStyle = fill;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(0.18);
      ctx.scale(k, k);
      ctx.beginPath();
      ctx.roundRect(-W * 0.016, -W * 0.1, W * 0.032, W * 0.07, W * 0.016);
      ctx.arc(0, W * 0.005, W * 0.018, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (x: number) => 1 - (1 - x) * (1 - x);
const backOut = (x: number) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.ellipse(x, y, r, r * 0.72, 0, 0, Math.PI * 2);
  ctx.moveTo(x - r * 0.35 + r * 0.45, y - r * 0.38);
  ctx.arc(x - r * 0.35, y - r * 0.38, r * 0.45, 0, Math.PI * 2);
  ctx.moveTo(x + r * 0.3 + r * 0.5, y - r * 0.32);
  ctx.arc(x + r * 0.3, y - r * 0.32, r * 0.5, 0, Math.PI * 2);
}
