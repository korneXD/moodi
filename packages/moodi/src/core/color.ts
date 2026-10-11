/** sRGB triple, 0..1 */
export type RGB = [number, number, number];

let ctx: CanvasRenderingContext2D | null = null;

/** Parse any CSS color (named, hex, rgb(), hsl(), oklch()…) via the browser. */
export function parseColor(input: string | undefined, fallback: RGB): RGB {
  if (!input) return fallback;
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (hex) return fromHex(hex[1]);
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return fallback;
  ctx.fillStyle = '#010203';
  ctx.fillStyle = input;
  const out = String(ctx.fillStyle);
  if (out === '#010203' && input.trim() !== '#010203') return fallback;
  if (out.startsWith('#')) return fromHex(out.slice(1));
  // non-sRGB or rgba(): rasterize one pixel
  ctx.canvas.width = ctx.canvas.height = 1;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0] / 255, d[1] / 255, d[2] / 255];
}

function fromHex(h: string): RGB {
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const toCss = (c: RGB) =>
  `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;

export const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
export const luminance = (c: RGB) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);

const INK: RGB = [0.07, 0.06, 0.08];
// warm latte (#d1bead), the light face color
const CREAM: RGB = [209 / 255, 190 / 255, 173 / 255];
const ROSE: RGB = [1, 0.42, 0.48];

/** Near-black on most bodies (the default Iris included), latte only on very dark ones like Ink. */
export const autoFace = (body: RGB): RGB => (luminance(body) > 0.06 ? mix(INK, body, 0.06) : CREAM);

/** Blush that sits naturally on the body color. */
export const autoCheek = (body: RGB): RGB => mix(body, ROSE, 0.78);
