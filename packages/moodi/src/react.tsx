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

export interface MoodiReactProps
  extends MoodiProps,
    Omit<HTMLAttributes<HTMLElement>, keyof MoodiProps | 'children'> {
  onMoodChange?: (detail: MoodChangeDetail) => void;
}

let loading: Promise<unknown> | null = null;
const idle = () =>
  new Promise<void>((resolve) => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => resolve(), { timeout: 1200 });
    else setTimeout(resolve, 1);
  });
/**
 * Loads three.js and registers the element, in the browser only. Waits for an idle
 * moment first so the page paints and hydrates before the 3D work starts.
 */
export const loadMoodi = () => (loading ??= idle().then(() => import('moodi')).then((m) => m.defineMoodi()));

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
    onMoodChange,
    className,
    style,
    ...rest
  },
  ref,
) {
  const el = useRef<MoodiBuddyElement | null>(null);
  useImperativeHandle(ref, () => el.current!, []);

  useEffect(() => {
    loadMoodi();
  }, []);

  useEffect(() => {
    const node = el.current;
    if (!node || !onMoodChange) return;
    const h = (e: Event) => onMoodChange((e as CustomEvent<MoodChangeDetail>).detail);
    node.addEventListener('moodchange', h);
    return () => node.removeEventListener('moodchange', h);
  }, [onMoodChange]);

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
    // sized before the element upgrades, so nothing shifts while three.js loads
    style: { display: 'inline-block', width: cssSize(size), height: cssSize(size), verticalAlign: 'middle', ...style },
    suppressHydrationWarning: true,
    ...rest,
  });
});
