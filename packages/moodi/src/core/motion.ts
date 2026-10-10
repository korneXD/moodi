import type { Mood } from './constants';

export interface Pose {
  y: number;
  rx: number;
  ry: number;
  rz: number;
  /** vertical stretch, 0 = none, -0.1 = squash */
  st: number;
  /** additive face channels */
  mouth: number;
  lookX: number;
  lookY: number;
}

export const zeroPose = (): Pose => ({ y: 0, rx: 0, ry: 0, rz: 0, st: 0, mouth: 0, lookX: 0, lookY: 0 });

const { sin, cos, abs, max, exp, PI } = Math;

/**
 * Body animation for a mood.
 * @param t   animation clock (s)
 * @param tau time since the mood was entered (s)
 */
export function moodPose(mood: Mood, t: number, tau: number, p: Pose): Pose {
  p.y = p.rx = p.ry = p.rz = p.st = p.mouth = p.lookX = p.lookY = 0;
  switch (mood) {
    case 'idle': {
      const b = sin(t * 1.6);
      p.y = 0.015 * b;
      p.st = 0.018 * b;
      break;
    }
    case 'thinking': {
      p.rz = 0.07 * sin(t * 1.1);
      p.y = 0.02 * sin(t * 2.2);
      p.ry = 0.15;
      p.rx = -0.06;
      break;
    }
    case 'loading': {
      const w = t * 2.4;
      p.rx = 0.12 * sin(w);
      p.rz = 0.12 * cos(w);
      p.ry = 0.22 * sin(w);
      p.y = 0.02 * sin(w * 2);
      p.lookX = 0.55 * sin(w);
      break;
    }
    case 'listening': {
      const nod = max(0, sin(t * 3.2));
      p.rx = 0.09 * nod * nod;
      const s = abs(sin(t * 7.1) * 0.5 + sin(t * 11.3) * 0.3 + sin(t * 3.7) * 0.2);
      p.st = 0.03 * s;
      break;
    }
    case 'speaking': {
      const s = max(0, sin(t * 9) * 0.6 + sin(t * 14.3) * 0.4) * (0.65 + 0.35 * sin(t * 1.7));
      p.mouth = 0.11 * s;
      p.st = 0.04 * s;
      p.rz = 0.03 * sin(t * 2.1);
      break;
    }
    case 'happy': {
      const ph = (t * 1.35) % 1;
      p.y = 0.2 * sin(PI * ph);
      const land = max(0, 1 - ph / 0.14) + max(0, (ph - 0.9) / 0.1);
      p.st = 0.08 * sin(PI * ph) - 0.14 * land;
      p.rz = 0.05 * sin(t * 1.35 * PI);
      break;
    }
    case 'surprised': {
      if (tau < 0.45) {
        const k = sin((PI * tau) / 0.45);
        p.y = 0.16 * k;
        p.st = 0.12 * k;
      }
      p.rz = 0.01 * sin(t * 38) * exp(-tau * 2);
      p.rx = -0.06;
      break;
    }
    case 'sad': {
      const b = sin(t * 1.1);
      p.y = -0.06;
      p.rx = 0.2;
      p.st = -0.04 + 0.015 * b;
      p.rz = -0.04;
      break;
    }
    case 'error': {
      const k = tau % 2.8;
      if (k < 0.55) {
        const d = 1 - k / 0.55;
        p.ry = 0.26 * sin(k * 42) * d;
        p.rz = 0.05 * sin(k * 42 + 1) * d;
      }
      p.st = -0.02;
      break;
    }
    case 'sleeping': {
      const b = sin(t * 1.0);
      p.st = 0.04 * b;
      p.y = -0.03;
      p.rz = 0.1;
      p.rx = 0.1;
      break;
    }
    case 'love': {
      p.y = 0.07 + 0.06 * sin(t * 1.6);
      p.rz = 0.05 * sin(t * 0.8);
      p.st = 0.015 * sin(t * 1.6 + 1);
      break;
    }
  }
  return p;
}

export function mixPose(a: Pose, b: Pose, k: number, out: Pose): Pose {
  for (const key of Object.keys(out) as (keyof Pose)[]) out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
}

/** Decorations drawn in 2D around the head. */
export type OverlayKind = 'dots' | 'zz' | 'hearts' | 'waves' | 'bang';

export const MOOD_OVERLAY: Partial<Record<Mood, OverlayKind>> = {
  thinking: 'dots',
  sleeping: 'zz',
  love: 'hearts',
  listening: 'waves',
  surprised: 'bang',
};
