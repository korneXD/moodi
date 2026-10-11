import { Buddy, type BuddyState } from './core/buddy';
import { DEFAULTS, isMood, isShape, type Mood, type MoodChangeDetail, type Shape } from './core/constants';

const ATTRS = [
  'shape',
  'mood',
  'color',
  'face-color',
  'cheek-color',
  'size',
  'speed',
  'follow-cursor',
  'interactive',
  'shadow',
  'sound',
  'settle',
  'settle-mood',
] as const;

const bool = (v: string | null, d: boolean) => (v === null ? d : v !== 'false' && v !== '0');
const cssSize = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === '') return `${DEFAULTS.size}px`;
  return typeof v === 'number' || /^\d+(\.\d+)?$/.test(String(v)) ? `${v}px` : String(v);
};

const STYLE = `:host{display:inline-block;position:relative;cursor:pointer;vertical-align:middle;contain:layout paint style;-webkit-tap-highlight-color:transparent}
:host([interactive="false"]){pointer-events:none}
canvas{position:absolute;inset:0;display:block;width:100%;height:100%}
slot{display:block;width:100%;height:100%}
::slotted(img){display:block;width:100%;height:100%;object-fit:contain}
:host([ready]) slot{display:none}`;

// SSR-safe: on the server there is no HTMLElement, so extend a dummy class.
const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

export class MoodiBuddyElement extends Base {
  static observedAttributes = ATTRS;

  private buddy: Buddy | null = null;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private root: ShadowRoot;
  /** host size lives in the shadow stylesheet: never touch the host's own attributes */
  private sizeStyle = document.createElement('style');

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLE;
    // light-DOM children (e.g. a poster <img>) show through the slot until the first 3D frame
    this.root.append(style, document.createElement('slot'));
    // the constructor must not add attributes (createElement throws "must not have
    // attributes"), so size goes into a shadow stylesheet instead of the style attribute
    this.root.append(this.sizeStyle);
    this.applySize(this.getAttribute('size'));
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'img');
    if (!this.buddy) {
      const b = (this.buddy = new Buddy());
      b.onMoodChange = (detail) => {
        this.syncLabel(detail.mood);
        this.dispatchEvent(new CustomEvent<MoodChangeDetail>('moodchange', { detail, bubbles: true }));
      };
      b.onReady = () => {
        this.setAttribute('ready', '');
        this.dispatchEvent(new Event('ready'));
      };
      this.root.append(b.canvas);
      b.update(this.readState());
      this.addEventListener('pointerenter', this.onEnter);
      this.addEventListener('pointerleave', this.onLeave);
      this.addEventListener('click', this.onClick);
    }
    this.syncLabel(this.buddy.currentMood);
    this.buddy.connect();
    this.io = new IntersectionObserver(([e]) => this.buddy?.setVisible(e.isIntersecting), {
      rootMargin: '64px',
    });
    this.io.observe(this);
    this.ro = new ResizeObserver(([e]) => {
      const box = e.contentRect;
      this.buddy?.resize(box.width, box.height);
    });
    this.ro.observe(this);
  }

  disconnectedCallback() {
    this.io?.disconnect();
    this.ro?.disconnect();
    // dispose everything; a re-connect builds a fresh buddy
    if (this.buddy) {
      this.buddy.canvas.remove();
      this.buddy.dispose();
      this.buddy = null;
    }
    this.removeEventListener('pointerenter', this.onEnter);
    this.removeEventListener('pointerleave', this.onLeave);
    this.removeEventListener('click', this.onClick);
  }

  attributeChangedCallback(name: string, old: string | null, val: string | null) {
    if (old === val) return;
    if (name === 'size') {
      this.applySize(val);
      if (old !== null) this.buddy?.bump();
    }
    if (name === 'aria-label') return;
    this.buddy?.update(this.readState());
    if (name === 'mood' && this.buddy) this.syncLabel(this.buddy.currentMood);
  }

  private applySize(val: string | null) {
    const size = cssSize(val);
    this.sizeStyle.textContent = `:host{width:${size};height:${size}}`;
  }

  private readState(): BuddyState {
    const shape = this.getAttribute('shape');
    const mood = this.getAttribute('mood');
    const speed = parseFloat(this.getAttribute('speed') ?? '');
    const settle = parseFloat(this.getAttribute('settle') ?? '');
    const settleMood = this.getAttribute('settle-mood');
    return {
      shape: isShape(shape) ? shape : DEFAULTS.shape,
      mood: isMood(mood) ? mood : DEFAULTS.mood,
      color: this.getAttribute('color') || DEFAULTS.color,
      faceColor: this.getAttribute('face-color') || undefined,
      cheekColor: this.getAttribute('cheek-color') || undefined,
      speed: Number.isFinite(speed) ? Math.max(0, speed) : DEFAULTS.speed,
      followCursor: bool(this.getAttribute('follow-cursor'), DEFAULTS.followCursor),
      interactive: bool(this.getAttribute('interactive'), DEFAULTS.interactive),
      shadow: bool(this.getAttribute('shadow'), DEFAULTS.shadow),
      sound: bool(this.getAttribute('sound'), DEFAULTS.sound),
      settle: Number.isFinite(settle) ? Math.max(0, settle) : DEFAULTS.settle,
      settleMood: isMood(settleMood) ? settleMood : undefined,
    };
  }

  private syncLabel(mood: Mood) {
    const own = this.getAttribute('aria-label');
    if (own && !own.startsWith('moodi: ')) return;
    this.setAttribute('aria-label', `moodi: ${mood}`);
  }

  private onEnter = () => {
    if (this.buddy) this.buddy.hovering = true;
  };
  private onLeave = () => {
    if (this.buddy) this.buddy.hovering = false;
  };
  private onClick = () => {
    if (!this.buddy?.state.interactive) return;
    this.react(Math.random() < 0.5 ? 'happy' : 'surprised', { duration: 1100 });
  };

  /** Show a mood for a moment, then return to the current `mood`. */
  react(mood: Mood, opts: { duration?: number } = {}) {
    this.buddy?.react(mood, opts.duration ?? 1200);
  }

  // ---- reflected properties
  get shape(): Shape {
    const v = this.getAttribute('shape');
    return isShape(v) ? v : DEFAULTS.shape;
  }
  set shape(v: Shape) {
    this.setAttribute('shape', v);
  }
  get mood(): Mood {
    const v = this.getAttribute('mood');
    return isMood(v) ? v : DEFAULTS.mood;
  }
  set mood(v: Mood) {
    this.setAttribute('mood', v);
  }
  get color(): string {
    return this.getAttribute('color') || DEFAULTS.color;
  }
  set color(v: string) {
    this.setAttribute('color', v);
  }
  get faceColor(): string | undefined {
    return this.getAttribute('face-color') || undefined;
  }
  set faceColor(v: string | undefined) {
    v ? this.setAttribute('face-color', v) : this.removeAttribute('face-color');
  }
  get cheekColor(): string | undefined {
    return this.getAttribute('cheek-color') || undefined;
  }
  set cheekColor(v: string | undefined) {
    v ? this.setAttribute('cheek-color', v) : this.removeAttribute('cheek-color');
  }
  get size(): number | string {
    const v = this.getAttribute('size');
    if (!v) return DEFAULTS.size;
    return /^\d+(\.\d+)?$/.test(v) ? Number(v) : v;
  }
  set size(v: number | string) {
    this.setAttribute('size', String(v));
  }
  get speed(): number {
    return this.readState().speed;
  }
  set speed(v: number) {
    this.setAttribute('speed', String(v));
  }
  get followCursor(): boolean {
    return bool(this.getAttribute('follow-cursor'), DEFAULTS.followCursor);
  }
  set followCursor(v: boolean) {
    this.setAttribute('follow-cursor', String(v));
  }
  get interactive(): boolean {
    return bool(this.getAttribute('interactive'), DEFAULTS.interactive);
  }
  set interactive(v: boolean) {
    this.setAttribute('interactive', String(v));
  }
  get shadow(): boolean {
    return bool(this.getAttribute('shadow'), DEFAULTS.shadow);
  }
  set shadow(v: boolean) {
    this.setAttribute('shadow', String(v));
  }
  get settle(): number {
    return this.readState().settle;
  }
  set settle(v: number) {
    this.setAttribute('settle', String(v));
  }
  get settleMood(): Mood | undefined {
    const v = this.getAttribute('settle-mood');
    return isMood(v) ? v : undefined;
  }
  set settleMood(v: Mood | undefined) {
    v ? this.setAttribute('settle-mood', v) : this.removeAttribute('settle-mood');
  }
  get sound(): boolean {
    return bool(this.getAttribute('sound'), DEFAULTS.sound);
  }
  set sound(v: boolean) {
    this.setAttribute('sound', String(v));
  }
}

/** Registers `<moodi-buddy>`. Safe to call more than once, no-op on the server. */
export function defineMoodi(tag = 'moodi-buddy') {
  if (typeof window === 'undefined' || !('customElements' in window)) return;
  if (!customElements.get(tag)) customElements.define(tag, class extends MoodiBuddyElement {});
}
