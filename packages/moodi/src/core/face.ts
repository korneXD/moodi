import type { Mood } from './constants';

export interface FaceParams {
  eyeOpen: number;
  eyeSize: number;
  lookX: number;
  lookY: number;
  lidCover: number;
  lidTilt: number;
  happyEye: number;
  closedEye: number;
  xEye: number;
  heartEye: number;
  mouthW: number;
  mouthCurve: number;
  mouthOpen: number;
  mouthRound: number;
  mouthSkew: number;
  mouthWave: number;
  blush: number;
}

export const FACE_KEYS = [
  'eyeOpen',
  'eyeSize',
  'lookX',
  'lookY',
  'lidCover',
  'lidTilt',
  'happyEye',
  'closedEye',
  'xEye',
  'heartEye',
  'mouthW',
  'mouthCurve',
  'mouthOpen',
  'mouthRound',
  'mouthSkew',
  'mouthWave',
  'blush',
] as const satisfies readonly (keyof FaceParams)[];

const BASE: FaceParams = {
  eyeOpen: 1,
  eyeSize: 1,
  lookX: 0,
  lookY: 0,
  lidCover: 0,
  lidTilt: 0,
  happyEye: 0,
  closedEye: 0,
  xEye: 0,
  heartEye: 0,
  mouthW: 0.1,
  mouthCurve: 0.35,
  mouthOpen: 0,
  mouthRound: 0,
  mouthSkew: 0,
  mouthWave: 0,
  blush: 0.45,
};

export const MOOD_FACE: Record<Mood, FaceParams> = {
  idle: { ...BASE },
  thinking: {
    ...BASE,
    eyeOpen: 0.92,
    lookX: 0.7,
    lookY: -0.8,
    lidCover: 0.12,
    mouthW: 0.065,
    mouthCurve: 0,
    mouthSkew: 0.8,
    blush: 0.3,
  },
  loading: { ...BASE, lidCover: 0.48, mouthW: 0.06, mouthCurve: 0.12, blush: 0.3 },
  listening: { ...BASE, eyeOpen: 1.12, eyeSize: 1.16, mouthW: 0.06, mouthCurve: 0.2, mouthOpen: 0.02 },
  speaking: { ...BASE, mouthW: 0.09, mouthCurve: 0.25 },
  happy: { ...BASE, happyEye: 1, mouthW: 0.13, mouthCurve: 1, mouthOpen: 0.08, blush: 1 },
  surprised: {
    ...BASE,
    eyeOpen: 1.25,
    eyeSize: 1.22,
    mouthW: 0.06,
    mouthCurve: 0,
    mouthOpen: 0.12,
    mouthRound: 1,
    blush: 0.35,
  },
  sad: {
    ...BASE,
    eyeOpen: 0.95,
    lidCover: 0.32,
    lidTilt: 0.5,
    lookY: 0.45,
    mouthW: 0.08,
    mouthCurve: -0.75,
    blush: 0.2,
  },
  error: { ...BASE, xEye: 1, mouthW: 0.1, mouthCurve: -0.2, mouthWave: 1, blush: 0.15 },
  sleeping: {
    ...BASE,
    closedEye: 1,
    mouthW: 0.04,
    mouthCurve: 0,
    mouthOpen: 0.035,
    mouthRound: 0.7,
    blush: 0.55,
  },
  love: { ...BASE, heartEye: 1, mouthW: 0.11, mouthCurve: 0.9, mouthOpen: 0.03, blush: 1 },
};

/** How much the pointer steers the gaze in each mood. */
export const FOLLOW_WEIGHT: Record<Mood, number> = {
  idle: 1,
  thinking: 0.15,
  loading: 0,
  listening: 1,
  speaking: 0.9,
  happy: 0.6,
  surprised: 0.8,
  sad: 0.3,
  error: 0.3,
  sleeping: 0,
  love: 0.7,
};

export const cloneFace = (f: FaceParams): FaceParams => ({ ...f });

const EYE_X = 0.31;
const EYE_Y = -0.04;
const EYE_RX = 0.098;
const EYE_RY = 0.128;
const MOUTH_Y = 0.2;
const LINE = 0.05;

/**
 * Paints the face into a square canvas. Face space is [-1, 1] on both axes,
 * y pointing down. Colors are CSS strings.
 */
export function drawFace(
  ctx: CanvasRenderingContext2D,
  f: FaceParams,
  blink: number,
  faceColor: string,
  cheekColor: string,
  /** 0..1, light eyes glow more than dark ones */
  glow: number,
  glowCenter: string,
  /** catchlight dot: white in dark eyes, dark in light eyes */
  dot: string,
  /** inside of an open mouth */
  inner: string,
  /** ends of the mouth gradient */
  mouthEdge: string,
  /** features only (eyes + mouth, no cheeks or highlights): the bump/height map */
  mask = false,
) {
  const S = ctx.canvas.width;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, S, S);
  ctx.setTransform(S / 2, 0, 0, S / 2, S / 2, S / 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const lx = f.lookX * 0.075;
  const ly = f.lookY * 0.06;

  // cheeks: soft, blurred blush; little "///" strokes when flushed
  if (f.blush > 0.01 && !mask) {
    const blur = S * 0.018;
    ctx.save();
    if ('filter' in ctx) ctx.filter = `blur(${blur}px)`;
    for (const side of [-1, 1]) {
      const cx = side * 0.52 + lx;
      const cy = 0.16 + ly;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 0.16);
      g.addColorStop(0, cheekColor);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = Math.min(1, f.blush) * 0.62;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 0.17, 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    const lines = Math.min(1, Math.max(0, (f.blush - 0.6) / 0.4));
    if (lines > 0.01) {
      ctx.save();
      ctx.globalAlpha = lines * 0.55;
      ctx.strokeStyle = cheekColor;
      ctx.lineWidth = 0.016;
      ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        const cx = side * 0.52 + lx;
        const cy = 0.16 + ly;
        for (let i = -1; i <= 1; i++) {
          const x = cx + i * 0.045;
          ctx.beginPath();
          ctx.moveTo(x + 0.018, cy - 0.035);
          ctx.lineTo(x - 0.018, cy + 0.035);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  ctx.fillStyle = faceColor;
  ctx.strokeStyle = faceColor;
  ctx.lineWidth = LINE;

  const special = Math.min(1, f.happyEye + f.closedEye + f.xEye + f.heartEye);
  const normal = 1 - special;

  for (const side of [-1, 1]) {
    const cx = side * EYE_X + lx;
    const cy = EYE_Y + ly;
    const rx = EYE_RX * f.eyeSize;

    if (normal > 0.01) {
      ctx.globalAlpha = normal;
      const open = Math.max(0.06, f.eyeOpen * blink);
      const ry = EYE_RY * f.eyeSize * open;
      ctx.save();
      if (f.lidCover > 0.01 || f.lidTilt > 0.01) {
        const top = cy - EYE_RY * f.eyeSize;
        const lidY = top + 2 * EYE_RY * f.eyeSize * f.lidCover;
        ctx.translate(cx, lidY);
        ctx.rotate(side * f.lidTilt * 0.6);
        ctx.beginPath();
        ctx.rect(-1, 0, 2, 2);
        ctx.clip();
        ctx.rotate(-side * f.lidTilt * 0.6);
        ctx.translate(-cx, -lidY);
      }
      // soft halo (a drawn gradient, not shadowBlur: WebKit misplaces canvas shadows
      // under a scaled transform) + an eye that is a touch brighter in the middle
      if (glow > 0.5 && !mask) halo(ctx, cx, cy, rx * 2.1, ry * 1.9, faceColor, 0.35 * normal);
      const eg = ctx.createRadialGradient(cx, cy - ry * 0.2, 0, cx, cy, Math.max(rx, ry));
      eg.addColorStop(0, glowCenter);
      eg.addColorStop(1, faceColor);
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = faceColor;
      if (open > 0.35 && !mask) {
        // one dot that rolls toward the gaze (and the cursor)
        const gx = Math.max(-1, Math.min(1, f.lookX));
        const gy = Math.max(-1, Math.min(1, f.lookY));
        const d = dot === '#fff' ? 0.3 : 0.34;
        ctx.globalAlpha = normal * Math.min(1, (open - 0.35) * 3);
        ctx.fillStyle = dot;
        ctx.beginPath();
        ctx.arc(cx - rx * 0.1 + gx * rx * 0.5, cy - ry * 0.16 + gy * ry * 0.42, rx * d, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = faceColor;
      }
      ctx.restore();
    }

    if (glow > 0.5 && !mask && special > 0.01) halo(ctx, cx, cy, rx * 2, rx * 1.8, faceColor, 0.3 * special);
    ctx.fillStyle = faceColor;
    if (f.happyEye > 0.01) {
      const s = 0.6 + 0.4 * f.happyEye;
      ctx.globalAlpha = Math.min(1, f.happyEye);
      ctx.beginPath();
      ctx.arc(cx, cy + 0.045, rx * 1.15 * s, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
    }
    if (f.closedEye > 0.01) {
      const s = 0.6 + 0.4 * f.closedEye;
      ctx.globalAlpha = Math.min(1, f.closedEye);
      ctx.beginPath();
      ctx.moveTo(cx - rx * 1.15 * s, cy + 0.01);
      ctx.quadraticCurveTo(cx, cy + 0.07 * s, cx + rx * 1.15 * s, cy + 0.01);
      ctx.stroke();
    }
    if (f.xEye > 0.01) {
      const s = rx * 0.95 * (0.6 + 0.4 * f.xEye);
      ctx.globalAlpha = Math.min(1, f.xEye);
      ctx.beginPath();
      ctx.moveTo(cx - s, cy - s);
      ctx.lineTo(cx + s, cy + s);
      ctx.moveTo(cx + s, cy - s);
      ctx.lineTo(cx - s, cy + s);
      ctx.stroke();
    }
    if (f.heartEye > 0.01) {
      ctx.globalAlpha = Math.min(1, f.heartEye);
      heart(ctx, cx, cy, rx * 1.35 * (0.5 + 0.5 * f.heartEye));
      ctx.fill();
    }
  }

  // mouth: face-color line with a brighter middle; dark inside with a tongue when open
  // the face moves as one piece; only the eye dots roll inside the eyes
  const mx = lx + f.mouthSkew * 0.07;
  const my = MOUTH_Y + ly;
  const round = Math.min(1, Math.max(0, f.mouthRound));
  const w = f.mouthW;
  const mg = ctx.createLinearGradient(mx - w - 0.02, my, mx + w + 0.02, my);
  mg.addColorStop(0, mouthEdge);
  mg.addColorStop(0.5, glowCenter);
  mg.addColorStop(1, mouthEdge);
  // plain beginPath() paths, traced again for each pass (fill, clip, stroke)
  const openShape = (trace: () => void, open: number, tongueY: number, tongueW: number) => {
    ctx.fillStyle = inner;
    trace();
    ctx.fill();
    if (open > 0.02 && !mask) {
      ctx.save();
      trace();
      ctx.clip();
      ctx.fillStyle = cheekColor;
      ctx.globalAlpha *= Math.min(1, (open - 0.02) * 12);
      ctx.beginPath();
      ctx.ellipse(mx, tongueY, tongueW, open * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = mg;
    const lw = ctx.lineWidth;
    ctx.lineWidth = lw * 0.6;
    trace();
    ctx.stroke();
    ctx.lineWidth = lw;
  };

  if (round < 0.99) {
    ctx.globalAlpha = 1 - round;
    const N = 18;
    const curveAt = (u: number) => f.mouthCurve * 0.075 * (1 - u * u);
    const pt = (i: number, open: number) => {
      const u = (i / N) * 2 - 1;
      const x = mx + u * w;
      const y =
        my +
        curveAt(u) +
        f.mouthSkew * u * 0.03 +
        f.mouthWave * 0.018 * Math.sin((u + 1) * Math.PI * 2) +
        open * (1 - u * u);
      return [x, y] as const;
    };
    const open = Math.max(0, f.mouthOpen);
    const top = () => {
      for (let i = 0; i <= N; i++) {
        const [x, y] = pt(i, -open * 0.15);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
    };
    if (open > 0.003) {
      const trace = () => {
        ctx.beginPath();
        top();
        for (let i = N; i >= 0; i--) {
          const [x, y] = pt(i, open);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
      };
      openShape(trace, open, pt(N / 2, open)[1], w * 0.55);
    } else {
      ctx.strokeStyle = mg;
      ctx.beginPath();
      top();
      ctx.stroke();
    }
  }
  if (round > 0.01) {
    ctx.globalAlpha = round;
    const r = Math.max(0.02, f.mouthOpen * 0.55 + 0.01);
    const trace = () => {
      ctx.beginPath();
      ctx.ellipse(mx, my + 0.01, r * 0.85, r, 0, 0, Math.PI * 2);
    };
    ctx.lineWidth = LINE * 0.8;
    openShape(trace, f.mouthOpen, my + 0.01 + r * 0.8, r * 0.6);
    ctx.lineWidth = LINE;
  }
  ctx.globalAlpha = 1;
}

function halo(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, 1);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  ctx.translate(-x, -y);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.85);
  ctx.bezierCurveTo(x - s * 1.25, y + s * 0.05, x - s * 0.75, y - s * 0.95, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.75, y - s * 0.95, x + s * 1.25, y + s * 0.05, x, y + s * 0.85);
  ctx.closePath();
}
