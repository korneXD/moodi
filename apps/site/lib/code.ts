import { INITIAL, type PlaygroundState } from './state';

export type Tab = 'react' | 'wc' | 'cdn';
/** [text, kind] — kind drives the (deliberately tiny) syntax palette */
export type Token = [string, 'p' | 'tag' | 'attr' | 'str' | 'kw'];

type Prop = { name: string; attr: string; value: string; literal: boolean };

function props(s: PlaygroundState): Prop[] {
  const out: Prop[] = [];
  const str = (name: string, attr: string, value: string) => out.push({ name, attr, value, literal: false });
  if (s.shape !== INITIAL.shape) str('shape', 'shape', s.shape);
  if (s.mood !== INITIAL.mood) str('mood', 'mood', s.mood);
  if (s.color !== INITIAL.color) str('color', 'color', s.color);
  if (s.faceColor) str('faceColor', 'face-color', s.faceColor);
  if (s.cheekColor) str('cheekColor', 'cheek-color', s.cheekColor);
  if (s.size !== INITIAL.size) out.push({ name: 'size', attr: 'size', value: String(s.size), literal: true });
  if (s.speed !== INITIAL.speed) out.push({ name: 'speed', attr: 'speed', value: String(s.speed), literal: true });
  if (!s.followCursor) out.push({ name: 'followCursor', attr: 'follow-cursor', value: 'false', literal: true });
  return out;
}

function htmlTag(ps: Prop[]): Token[] {
  const t: Token[] = [['<', 'p'], ['moodi-buddy', 'tag']];
  const multi = ps.length > 3;
  for (const p of ps) {
    t.push([multi ? '\n  ' : ' ', 'p'], [p.attr, 'attr'], ['=', 'p'], [`"${p.value}"`, 'str']);
  }
  t.push([multi ? '\n>' : '>', 'p'], ['</', 'p'], ['moodi-buddy', 'tag'], ['>', 'p']);
  return t;
}

export function codeTokens(s: PlaygroundState, tab: Tab): Token[] {
  const ps = props(s);
  if (tab === 'react') {
    const t: Token[] = [
      ['import', 'kw'], [' { Moodi } ', 'p'], ['from', 'kw'], [' ', 'p'], ["'moodi/react'", 'str'], [';\n\n', 'p'],
      ['<', 'p'], ['Moodi', 'tag'],
    ];
    if (!ps.length) t.push([' />', 'p']);
    else {
      for (const p of ps) {
        t.push(['\n  ', 'p'], [p.name, 'attr'], ['=', 'p']);
        t.push(p.literal ? [`{${p.value}}`, 'kw'] : [`"${p.value}"`, 'str']);
      }
      t.push(['\n/>', 'p']);
    }
    return t;
  }
  if (tab === 'wc') {
    return [
      ...htmlTag(ps),
      ['\n\n', 'p'], ['<', 'p'], ['script', 'tag'], [' ', 'p'], ['type', 'attr'], ['=', 'p'], ['"module"', 'str'], ['>', 'p'],
      ['\n  ', 'p'], ['import', 'kw'], [' ', 'p'], ["'moodi'", 'str'], [';', 'p'],
      ['\n</', 'p'], ['script', 'tag'], ['>', 'p'],
    ];
  }
  return [
    ['<', 'p'], ['script', 'tag'], [' ', 'p'], ['type', 'attr'], ['=', 'p'], ['"module"', 'str'], [' ', 'p'],
    ['src', 'attr'], ['=', 'p'], ['"https://esm.sh/moodi"', 'str'], ['></', 'p'], ['script', 'tag'], ['>', 'p'],
    ['\n', 'p'],
    ...htmlTag(ps),
  ];
}

export const codeText = (s: PlaygroundState, tab: Tab) => codeTokens(s, tab).map((t) => t[0]).join('');
