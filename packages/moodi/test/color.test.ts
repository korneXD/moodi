import { describe, expect, it } from 'vitest';
import { autoCheek, autoFace, luminance, mix, parseColor, toCss } from '../src/core/color';
import { DEFAULTS, isMood, isShape, MOODS, PALETTES, SHAPES } from '../src/core/constants';

describe('color', () => {
  it('parses hex without a browser', () => {
    expect(parseColor('#2b15d1', [0, 0, 0])).toEqual([0x2b / 255, 0x15 / 255, 0xd1 / 255]);
    expect(parseColor('fff', [0, 0, 0])).toEqual([1, 1, 1]);
    expect(parseColor(undefined, [0.1, 0.2, 0.3])).toEqual([0.1, 0.2, 0.3]);
  });

  it('round-trips to CSS', () => {
    expect(toCss(parseColor('#d1bead', [0, 0, 0]))).toBe('rgb(209,190,173)');
  });

  it('mixes linearly', () => {
    expect(mix([0, 0, 0], [1, 1, 1], 0.25)).toEqual([0.25, 0.25, 0.25]);
  });

  it('gives a dark face to every palette except Ink, which gets latte', () => {
    for (const [name, hex] of Object.entries(PALETTES)) {
      const face = autoFace(parseColor(hex, [0, 0, 0]));
      if (name === 'Ink') expect(toCss(face)).toBe('rgb(209,190,173)');
      else expect(luminance(face)).toBeLessThan(0.02);
    }
  });

  it('derives a blush that leans pink', () => {
    const [r, , b] = autoCheek(parseColor(DEFAULTS.color, [0, 0, 0]));
    expect(r).toBeGreaterThan(b);
  });
});

describe('constants', () => {
  it('validates shapes and moods', () => {
    expect(SHAPES).toContain(DEFAULTS.shape);
    expect(MOODS).toContain(DEFAULTS.mood);
    expect(isShape('ghost')).toBe(true);
    expect(isShape('dragon')).toBe(false);
    expect(isMood('settle')).toBe(false);
  });

  it('keeps sound off and settle disabled by default', () => {
    expect(DEFAULTS.sound).toBe(false);
    expect(DEFAULTS.settle).toBe(0);
  });
});
