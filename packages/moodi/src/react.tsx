import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type HTMLAttributes,
} from 'react';
import type { MoodChangeDetail, MoodiProps } from './core/constants';
import type { MoodiBuddyElement } from './element';

export * from './core/constants';
export type { MoodiBuddyElement };

export type MoodiLoading = 'idle' | 'interaction' | 'eager';

export interface MoodiReactProps
  extends MoodiProps,
    Omit<HTMLAttributes<HTMLElement>, keyof MoodiProps | 'children'> {
  onMoodChange?: (detail: MoodChangeDetail) => void;
  /** Fires once the first 3D frame is on screen. */
  onReady?: () => void;
  /**
   * Image shown until the first 3D frame (and while three.js loads). A pre-rendered
   * still of the same buddy makes the swap invisible.
   */
  poster?: string;
  /**
   * When to load three.js: `'idle'` (default) after the page settles, `'interaction'`
   * on the first pointer, touch, key or scroll (pair it with `poster`), `'eager'` now.
   */
  loading?: MoodiLoading;
}

let started: Promise<unknown> | null = null;
let waiting = false;

/** Loads three.js and registers the element. Browser only; safe to call many times. */
export const loadMoodi = () => (started ??= import('moodi').then((m) => m.defineMoodi()));

function schedule(mode: MoodiLoading) {
  if (started || mode === 'eager') return void loadMoodi();
  if (mode === 'idle') {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => loadMoodi(), { timeout: 1200 });
    else setTimeout(loadMoodi, 1);
    return;
  }
  if (waiting) return;
  waiting = true;
  const events = ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'] as const;
  const go = () => {
    events.forEach((e) => removeEventListener(e, go));
    loadMoodi();
  };
  events.forEach((e) => addEventListener(e, go, { passive: true, once: true }));
}

const flag = (v: boolean | undefined) => (v === undefined ? undefined : String(v));
const cssSize = (v: number | string | undefined) =>
  v === undefined ? '160px' : typeof v === 'number' || /^\d+(\.\d+)?$/.test(v) ? `${v}px` : v;

/**
 * `<Moodi />` renders a `<moodi-buddy>` element. three.js is loaded lazily on the
 * client, so this component is safe to render on the server.
 */
export const Moodi = forwardRef<MoodiBuddyElement | null, MoodiReactProps>(function Moodi(
  {
    shape,
    mood,
    color,
    faceColor,
    cheekColor,
    size,
    speed,
    followCursor,
    interactive,
    shadow,
    sound,
    onMoodChange,
    onReady,
    poster,
    loading = 'idle',
    className,
    style,
    ...rest
  },
  ref,
) {
  const el = useRef<MoodiBuddyElement | null>(null);
  useImperativeHandle(ref, () => el.current!, []);

  useEffect(() => {
    schedule(loading);
  }, [loading]);

  useEffect(() => {
    const node = el.current;
    if (!node || !onReady) return;
    if (node.hasAttribute('ready')) return void onReady();
    node.addEventListener('ready', onReady, { once: true });
    return () => node.removeEventListener('ready', onReady);
  }, [onReady]);

  useEffect(() => {
    const node = el.current;
    if (!node || !onMoodChange) return;
    const h = (e: Event) => onMoodChange((e as CustomEvent<MoodChangeDetail>).detail);
    node.addEventListener('moodchange', h);
    return () => node.removeEventListener('moodchange', h);
  }, [onMoodChange]);

  const still = poster
    ? createElement('img', { src: poster, alt: '', 'aria-hidden': true, decoding: 'async', draggable: false, style: { display: 'block', width: '100%', height: '100%', objectFit: 'contain' } })
    : null;

  return createElement('moodi-buddy', {
    ref: el,
    className,
    shape,
    mood,
    color,
    'face-color': faceColor,
    'cheek-color': cheekColor,
    size: size === undefined ? undefined : String(size),
    speed: speed === undefined ? undefined : String(speed),
    'follow-cursor': flag(followCursor),
    interactive: flag(interactive),
    shadow: flag(shadow),
    sound: flag(sound),
    // sized before the element upgrades, so nothing shifts while three.js loads
    style: { display: 'inline-block', width: cssSize(size), height: cssSize(size), verticalAlign: 'middle', ...style },
    suppressHydrationWarning: true,
    ...rest,
  }, still);
});
