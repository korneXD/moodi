import { WebGLRenderer, type Camera, type Scene } from 'three';

/** Anything the shared loop drives. */
export interface Tickable {
  /** on-screen and connected */
  active: boolean;
  tick(dt: number, now: number): void;
}

const items = new Set<Tickable>();
let renderer: WebGLRenderer | null = null;
let bufW = 0;
let bufH = 0;
let raf = 0;
let disposeTimer: ReturnType<typeof setTimeout> | undefined;
let listening = false;
let program: 'idle' | 'compiling' | 'ready' = 'idle';

export const pointer = { x: 0, y: 0, lastMove: -1e9, known: false };
export const env = { reducedMotion: false };

function listen() {
  if (listening) return;
  listening = true;
  addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.lastMove = performance.now();
      pointer.known = true;
    },
    { passive: true },
  );
  document.addEventListener('visibilitychange', wake);
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  env.reducedMotion = mq.matches;
  mq.addEventListener?.('change', (e) => (env.reducedMotion = e.matches));
}

/**
 * One WebGL context for every instance on the page. Each buddy renders into the
 * bottom-left corner of it and copies the pixels to its own 2D canvas.
 */
export function sharedRenderer(w: number, h: number): WebGLRenderer {
  if (!renderer) {
    // preserveDrawingBuffer: drawImage() must see this frame, not the last composited one
    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    renderer.setScissorTest(true);
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      renderer?.dispose();
      renderer = null;
      bufW = bufH = 0;
      program = 'idle';
    });
  }
  if (w > bufW || h > bufH) {
    bufW = Math.max(bufW, w);
    bufH = Math.max(bufH, h);
    renderer.setSize(bufW, bufH, false);
  }
  return renderer;
}

export const bufferHeight = () => bufH;

/**
 * Every buddy shares one shader program. Compile it once, off the main thread
 * where KHR_parallel_shader_compile is available, before anyone renders.
 */
export function programReady(scene: Scene, camera: Camera): boolean {
  if (program === 'ready') return true;
  if (program === 'idle' && renderer) {
    program = 'compiling';
    const r = renderer;
    r.compileAsync(scene, camera)
      .catch(() => {})
      .then(() => {
        if (r === renderer) program = 'ready';
        wake();
      });
  }
  return false;
}

export function register(item: Tickable) {
  listen();
  clearTimeout(disposeTimer);
  items.add(item);
  wake();
}

export function unregister(item: Tickable) {
  items.delete(item);
  if (items.size === 0) {
    clearTimeout(disposeTimer);
    disposeTimer = setTimeout(() => {
      if (items.size || !renderer) return;
      renderer.dispose();
      renderer.forceContextLoss();
      renderer = null;
      bufW = bufH = 0;
      program = 'idle';
    }, 1500);
  }
}

/**
 * Start the loop if anything needs frames. Hidden tabs are covered by rAF itself,
 * which browsers pause in background tabs.
 */
export function wake() {
  if (raf) return;
  for (const it of items) {
    if (it.active) {
      raf = requestAnimationFrame(frame);
      return;
    }
  }
}

const BUDGET_MS = 10;
const lastTick = new WeakMap<Tickable, number>();
let cursor = 0;

/**
 * Ticks buddies round-robin within a time budget, so a page full of them never
 * produces one long task; whoever doesn't fit goes first next frame.
 */
function frame(now: number) {
  raf = 0;
  const list = [...items].filter((it) => it.active);
  if (!list.length) return;
  const start = performance.now();
  const n = list.length;
  let done = 0;
  for (; done < n; done++) {
    const it = list[(cursor + done) % n];
    const prev = lastTick.get(it) ?? now - 16;
    lastTick.set(it, now);
    it.tick(Math.min(0.05, Math.max(0, (now - prev) / 1000)), now);
    if (performance.now() - start > BUDGET_MS) {
      done++;
      break;
    }
  }
  cursor = (cursor + done) % n;
  raf = requestAnimationFrame(frame);
}
