import { BufferAttribute, BufferGeometry, SphereGeometry } from 'three';
import type { Shape } from './constants';

export interface ShapeMeta {
  /** face projection center (object space y) */
  faceY: number;
  /** object-space width covered by the face texture */
  faceScale: number;
  /** body re-animates every frame */
  animated: boolean;
}

export const SHAPE_META: Record<Shape, ShapeMeta> = {
  pebble: { faceY: 0.02, faceScale: 1.3, animated: false },
  blob: { faceY: 0.02, faceScale: 1.28, animated: true },
  drop: { faceY: -0.24, faceScale: 1.22, animated: false },
  bean: { faceY: 0.14, faceScale: 0.92, animated: false },
  cube: { faceY: 0, faceScale: 1.22, animated: false },
  ghost: { faceY: 0.22, faceScale: 1.24, animated: true },
};

/**
 * Welded latitude/longitude sphere: same vertex count for every shape, so shapes
 * morph by lerping positions. Rings of latitude keep round silhouettes (the ghost
 * hem) clean, unlike a cube-sphere's square grid.
 */
export function createBase(segments: number): { geometry: BufferGeometry; dirs: Float32Array } {
  const sphere = new SphereGeometry(1, segments * 2, Math.round(segments * 1.5));
  const src = sphere.getAttribute('position');
  const srcIndex = sphere.getIndex()!;
  const map = new Map<string, number>();
  const dirs: number[] = [];
  const remap = new Uint32Array(src.count);
  for (let i = 0; i < src.count; i++) {
    const x = src.getX(i), y = src.getY(i), z = src.getZ(i);
    const key = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;
    let idx = map.get(key);
    if (idx === undefined) {
      idx = dirs.length / 3;
      map.set(key, idx);
      const l = Math.hypot(x, y, z) || 1;
      dirs.push(x / l, y / l, z / l);
    }
    remap[i] = idx;
  }
  const index: number[] = [];
  for (let i = 0; i < srcIndex.count; i += 3) {
    const a = remap[srcIndex.getX(i)], b = remap[srcIndex.getX(i + 1)], c = remap[srcIndex.getX(i + 2)];
    if (a !== b && b !== c && a !== c) index.push(a, b, c); // drop pole slivers
  }
  sphere.dispose();

  const geometry = new BufferGeometry();
  const d = new Float32Array(dirs);
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(d), 3));
  geometry.setIndex(index);
  return { geometry, dirs: d };
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Maps a unit direction to a point on the given shape. Writes into out[o..o+2]. */
export function shapePoint(
  shape: Shape,
  x: number,
  y: number,
  z: number,
  t: number,
  out: Float32Array,
  o: number,
) {
  let px = x, py = y, pz = z;
  switch (shape) {
    case 'pebble': {
      px = x * 1.1 + 0.04 * y;
      py = y * 0.92 * (0.95 + 0.05 * Math.tanh(3 * y)) + 0.03 * x;
      pz = z * 0.94;
      break;
    }
    case 'blob': {
      const r =
        0.97 +
        0.045 * Math.sin(2.1 * x + 1.3 * t) * Math.sin(2.4 * y + 1.7 * t + 1) +
        0.035 * Math.sin(2.7 * z + 2.3 * x + 1.1 * t);
      px = x * r;
      py = y * r;
      pz = z * r;
      break;
    }
    case 'drop': {
      const up = Math.max(y, 0);
      const s = 1 - 0.8 * Math.pow(up, 1.6);
      px = x * s * 0.98 + 0.1 * up * up * up;
      py = (y < 0 ? y * 0.9 : y * 1.32) - 0.12;
      pz = z * s * 0.98;
      break;
    }
    case 'bean': {
      const yy = y * 0.78 + 0.42 * Math.tanh(y * 3);
      px = (x * 0.8 + 0.14 * ((yy * yy) / 1.44) - 0.07) * 0.9;
      py = yy * 0.88;
      pz = z * 0.8 * 0.9;
      break;
    }
    case 'cube': {
      const k = 4.5;
      const r = Math.pow(
        Math.pow(Math.abs(x), k) + Math.pow(Math.abs(y), k) + Math.pow(Math.abs(z), k),
        -1 / k,
      );
      px = x * r * 0.84;
      py = y * r * 0.82;
      pz = z * r * 0.84;
      break;
    }
    case 'ghost': {
      if (y >= 0) {
        px = x;
        py = y;
        pz = z;
      } else {
        const phi = Math.acos(Math.max(-1, y));
        const u = (phi - Math.PI / 2) / (Math.PI / 2);
        const len = Math.hypot(x, z) || 1;
        const dx = x / len, dz = z / len;
        const theta = Math.atan2(z, x);
        const wave = 0.085 * Math.sin(5 * theta + 2.2 * t);
        // skirt → rounded hem (quarter circle) → slightly domed underside
        const R = 1.04, rho = 0.13, rimY = -1.05 + wave;
        let radius: number;
        // more latitude rings go to the hem than to the straight skirt
        if (u < 0.45) {
          const k = u / 0.45;
          radius = 1 + 0.04 * k;
          py = -k * (1.05 - rho) + wave * smooth(0.45, 1, k);
        } else if (u < 0.75) {
          const a = ((u - 0.45) / 0.3) * (Math.PI / 2);
          radius = R - rho + rho * Math.cos(a);
          py = rimY + rho - rho * Math.sin(a);
        } else {
          const w = (u - 0.75) / 0.25;
          radius = (R - rho) * (1 - w);
          py = rimY + 0.22 * w * w * (3 - 2 * w);
        }
        px = dx * radius;
        pz = dz * radius;
      }
      px *= 0.9;
      py = (py + 0.1) * 0.9;
      pz *= 0.9;
      break;
    }
  }
  out[o] = px;
  out[o + 1] = py;
  out[o + 2] = pz;
}
