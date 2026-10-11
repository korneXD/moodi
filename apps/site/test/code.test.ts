import { describe, expect, it } from 'vitest';
import { codeText } from '../lib/code';
import { INITIAL } from '../lib/state';

const quiet = { ...INITIAL, sound: false };

describe('generated code', () => {
  it('is minimal for the defaults', () => {
    expect(codeText(quiet, 'react')).toBe("import { Moodi } from 'moodi/react';\n\n<Moodi />");
    expect(codeText(quiet, 'wc')).toContain('<moodi-buddy></moodi-buddy>');
  });

  it('only lists props that differ from the defaults', () => {
    const s = { ...quiet, shape: 'blob' as const, mood: 'happy' as const, settle: 3000 };
    const react = codeText(s, 'react');
    expect(react).toContain('shape="blob"');
    expect(react).toContain('mood="happy"');
    expect(react).toContain('settle={3000}');
    expect(react).not.toContain('color=');
  });

  it('uses attribute names and string booleans on the Web Component', () => {
    const s = { ...quiet, followCursor: false, sound: true, faceColor: '#121014' };
    const wc = codeText(s, 'wc');
    expect(wc).toContain('follow-cursor="false"');
    expect(wc).toContain('sound="true"');
    expect(wc).toContain('face-color="#121014"');
  });

  it('writes sound as a boolean shorthand in React', () => {
    expect(codeText({ ...quiet, sound: true }, 'react')).toMatch(/\n {2}sound\n\/>/);
  });

  it('points the CDN tab at esm.sh', () => {
    expect(codeText(quiet, 'cdn')).toContain('https://esm.sh/moodi');
  });
});
