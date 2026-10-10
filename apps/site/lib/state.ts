import { DEFAULTS, type Mood, type Shape } from 'moodi/react';

export interface PlaygroundState {
  shape: Shape;
  mood: Mood;
  color: string;
  faceColor?: string;
  cheekColor?: string;
  size: number;
  speed: number;
  followCursor: boolean;
  /** the playground plays sounds by default; the package itself is silent unless asked */
  sound: boolean;
}

export const INITIAL: PlaygroundState = {
  shape: DEFAULTS.shape,
  mood: DEFAULTS.mood,
  color: DEFAULTS.color,
  size: DEFAULTS.size as number,
  speed: DEFAULTS.speed,
  followCursor: DEFAULTS.followCursor,
  sound: true,
};

export const SPEEDS = [0.5, 1, 1.5, 2, 0] as const;
export const SIZE_MIN = 48;
export const SIZE_MAX = 400;
