export type Shape = 'pebble' | 'blob' | 'drop' | 'bean' | 'cube' | 'ghost';
export type Mood =
  | 'idle'
  | 'thinking'
  | 'loading'
  | 'listening'
  | 'speaking'
  | 'happy'
  | 'surprised'
  | 'sad'
  | 'error'
  | 'sleeping'
  | 'love';

export interface MoodiProps {
  /** Body shape. Default `'ghost'`. */
  shape?: Shape;
  /** Current mood / state. Default `'idle'`. */
  mood?: Mood;
  /** Body color, any CSS color. Default `'#6c5ce7'`. */
  color?: string;
  /** Eyes / mouth color. Auto-contrast by default. */
  faceColor?: string;
  /** Blush color. Derived from the body color by default. */
  cheekColor?: string;
  /** px number or any CSS length. Default `160`. */
  size?: number | string;
  /** Animation speed multiplier, `0` pauses. Default `1`. */
  speed?: number;
  /** Eyes (and slightly the body) follow the pointer. Default `true`. */
  followCursor?: boolean;
  /** Reacts to hover and click. Default `true`. */
  interactive?: boolean;
  /** Soft ground shadow. Default `true`. */
  shadow?: boolean;
  /** A short sound effect on every mood change (and when it first appears). Default `false`. */
  sound?: boolean;
  /**
   * Milliseconds after a mood change when the body calms down to gentle idle breathing
   * (hopping, shaking, hearts… stop; the facial expression stays). `0` = never. Default `0`.
   */
  settle?: number;
}

export interface MoodChangeDetail {
  mood: Mood;
  previous: Mood;
  /** true while a temporary `react()` reaction is showing */
  reaction: boolean;
}

export const SHAPES: readonly Shape[] = ['ghost', 'pebble', 'blob', 'drop', 'bean', 'cube'];

export const MOODS: readonly Mood[] = [
  'idle',
  'thinking',
  'loading',
  'listening',
  'speaking',
  'happy',
  'surprised',
  'sad',
  'error',
  'sleeping',
  'love',
];

export const DEFAULTS = {
  shape: 'ghost' as Shape,
  mood: 'idle' as Mood,
  color: '#6c5ce7',
  size: 160 as number | string,
  speed: 1,
  followCursor: true,
  interactive: true,
  shadow: true,
  sound: false,
  settle: 0,
};

export const PALETTES: Readonly<Record<string, string>> = {
  Iris: '#6c5ce7',
  Peach: '#f2a07b',
  Sage: '#8fb996',
  Sky: '#8ec5e8',
  Lilac: '#b9a3e3',
  Butter: '#f3d36b',
  Coral: '#f07167',
  Ink: '#2b2d42',
  Cloud: '#ecebe8',
};

export const MOOD_INFO: Readonly<Record<Mood, { label: string; description: string }>> = {
  idle: { label: 'Idle', description: 'Breathing softly. Blinks now and then.' },
  thinking: { label: 'Thinking', description: 'Eyes drift up. Little thoughts pop.' },
  loading: { label: 'Loading', description: 'Half-lidded, wobbling patiently.' },
  listening: { label: 'Listening', description: 'All eyes. Nods along to every word.' },
  speaking: { label: 'Speaking', description: 'Chatty mouth, bouncing to the rhythm.' },
  happy: { label: 'Happy', description: 'Bounces with joy. Cheeks glow.' },
  surprised: { label: 'Surprised', description: 'Wide eyes, tiny o. Did not see that coming.' },
  sad: { label: 'Sad', description: 'Slumps a little. Needs a minute.' },
  error: { label: 'Error', description: 'Something broke. Shakes it off.' },
  sleeping: { label: 'Sleeping', description: 'Deep, slow breaths. Do not disturb.' },
  love: { label: 'Love', description: 'Heart eyes, floating on air.' },
};

export const SHAPE_LABELS: Readonly<Record<Shape, string>> = {
  pebble: 'Pebble',
  blob: 'Blob',
  drop: 'Drop',
  bean: 'Bean',
  cube: 'Cube',
  ghost: 'Ghost',
};

export const isShape = (v: unknown): v is Shape => SHAPES.includes(v as Shape);
export const isMood = (v: unknown): v is Mood => MOODS.includes(v as Mood);
