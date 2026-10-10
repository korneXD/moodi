import type { Mood } from "./constants";

/**
 * One short synthesized effect per mood (Web Audio, no files). Off unless the element
 * has `sound` turned on. Browsers only start audio after a click, tap or key press, so a
 * sound requested before that waits briefly for the first gesture.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  listenForGesture();
  if (!ctx) {
    ctx = new AudioContext();
    // a soft lowpass keeps every effect round and quiet
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3200;
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(lp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface Tone {
  freq: number;
  to?: number;
  at?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  /** vibrato depth in Hz */
  wobble?: number;
}

function tone(c: AudioContext, { freq, to, at = 0, dur = 0.12, type = "sine", gain = 0.1, wobble = 0 }: Tone) {
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  if (wobble) {
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = 7;
    depth.gain.value = wobble;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.05);
  }
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.012, dur / 4));
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env).connect(master!);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SOUNDS: Record<Mood, (c: AudioContext) => void> = {
  // soft pop
  idle: (c) => tone(c, { freq: 520, to: 780, dur: 0.09, gain: 0.08 }),
  // three little thought bubbles
  thinking: (c) =>
    [660, 760, 900].forEach((f, i) => tone(c, { freq: f, to: f * 1.08, at: i * 0.1, dur: 0.07, type: "triangle", gain: 0.06 })),
  // patient ticks
  loading: (c) => [0, 0.14, 0.28].forEach((at) => tone(c, { freq: 940, at, dur: 0.04, gain: 0.05 })),
  // attentive "ding-up"
  listening: (c) => {
    tone(c, { freq: 523, dur: 0.12, type: "triangle", gain: 0.07 });
    tone(c, { freq: 784, at: 0.1, dur: 0.22, type: "triangle", gain: 0.07 });
  },
  // babble
  speaking: (c) =>
    [380, 460, 340, 520, 420].forEach((f, i) =>
      tone(c, { freq: f, to: f * 1.15, at: i * 0.075, dur: 0.06, type: "triangle", gain: 0.06 }),
    ),
  // bright arpeggio
  happy: (c) => [523, 659, 784, 1047].forEach((f, i) => tone(c, { freq: f, at: i * 0.07, dur: 0.14, type: "triangle", gain: 0.07 })),
  // boing
  surprised: (c) => tone(c, { freq: 280, to: 980, dur: 0.18, gain: 0.09, wobble: 30 }),
  // slow sigh down
  sad: (c) => {
    tone(c, { freq: 560, to: 300, dur: 0.5, gain: 0.07 });
    tone(c, { freq: 420, to: 240, at: 0.12, dur: 0.5, gain: 0.04 });
  },
  // two soft buzzes
  error: (c) => [0, 0.14].forEach((at) => tone(c, { freq: 170, to: 150, at, dur: 0.1, type: "sawtooth", gain: 0.045 })),
  // sleepy snore
  sleeping: (c) => {
    tone(c, { freq: 150, to: 115, dur: 0.6, gain: 0.07, wobble: 6 });
    tone(c, { freq: 300, to: 230, at: 0.05, dur: 0.5, gain: 0.02 });
  },
  // sparkles
  love: (c) =>
    [1319, 1568, 2093, 1760].forEach((f, i) => tone(c, { freq: f, at: i * 0.08, dur: 0.22, gain: 0.04 })),
};

let pending: { mood: Mood; until: number } | null = null;
let listening = false;

function listenForGesture() {
  if (listening) return;
  listening = true;
  const unlock = () => {
    if (!ctx) return;
    // resume() inside the gesture handler: Safari needs it there
    void ctx.resume().then(() => {
      if (pending && performance.now() < pending.until) SOUNDS[pending.mood](ctx!);
      pending = null;
    });
  };
  for (const e of ["pointerdown", "touchend", "keydown"]) addEventListener(e, unlock, { passive: true });
}

/**
 * Plays the effect for a mood. If the browser hasn't allowed audio yet, the sound waits
 * for it: briefly for a mood change (it may be the very click that unlocks audio), a few
 * seconds with `wait` (the first appearance on page load).
 */
export function playMood(mood: Mood, wait = false) {
  const c = audio();
  if (!c) return;
  if (c.state === "running") {
    pending = null;
    SOUNDS[mood](c);
    return;
  }
  pending = { mood, until: performance.now() + (wait ? 6000 : 1200) };
  void c.resume().then(() => {
    if (pending && performance.now() < pending.until) SOUNDS[pending.mood](c);
    pending = null;
  });
}
