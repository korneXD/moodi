"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Caveat } from "next/font/google";
import { Moodi, type Mood, type Shape } from "moodi/react";

/*
  Hand-drawn promo (1920×1080, ~18.5 s). Everything is a function of the clock `t`, so a
  frame-by-frame capture in virtual time is exact. Asset generation only (/og is noindex).
*/

const hand = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

const INK = "#1f1a16";
const BRAND = "#2b15d1";
const RED = "#e8424f";
const PAPER = "#f6f1e7";
const DURATION = 18.6;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const back = (x: number) => {
  const c = 1.7;
  x = clamp(x);
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
/** 0..1 progress of t through [a, b] */
const p = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

function useClock() {
  const [t, setT] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    // ?capture waits for window.__go (set by the recorder once three.js is warm)
    const capture = location.search.includes("capture");
    const loop = (now: number) => {
      if (capture && !(window as unknown as { __go?: boolean }).__go) {
        raf = requestAnimationFrame(loop);
        return;
      }
      start.current ??= now;
      const s = (now - start.current) / 1000;
      setT(s);
      (window as unknown as { __t: number }).__t = s;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

/** An SVG stroke that draws itself, with a hand-wobble filter. */
function Stroke({
  d,
  progress,
  width = 5,
  color = INK,
  box,
  style,
}: {
  d: string;
  progress: number;
  width?: number;
  color?: string;
  box: string;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox={box} style={{ position: "absolute", overflow: "visible", ...style }} aria-hidden>
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 1"
        strokeDashoffset={1 - clamp(progress)}
        filter="url(#wobble)"
      />
    </svg>
  );
}

/** Handwriting that reveals left to right. */
function Write({ children, progress, style }: { children: ReactNode; progress: number; style?: CSSProperties }) {
  return (
    <div
      className={hand.className}
      style={{
        position: "absolute",
        color: INK,
        whiteSpace: "nowrap",
        // reveal past the box at the end: Caveat's slanted last letter overhangs it
        clipPath: `inset(-20% ${100 - clamp(progress) * 112}% -20% -5%)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Scene({ t, from, to, children }: { t: number; from: number; to: number; children: ReactNode }) {
  if (t < from - 0.4 || t > to + 0.4) return null; // mount a little early so buddies are ready
  const o = Math.min(p(t, from, from + 0.35), 1 - p(t, to - 0.35, to));
  return <div style={{ position: "absolute", inset: 0, opacity: o }}>{children}</div>;
}

function Buddy({ t, at, x, y, size, mood, shape = "ghost", color = BRAND }: { t: number; at: number; x: number; y: number; size: number; mood: Mood; shape?: Shape; color?: string }) {
  const s = back(p(t, at, at + 0.55));
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, transform: `scale(${s})`, opacity: s > 0.01 ? 1 : 0 }}>
      <Moodi mood={mood} shape={shape} color={color} cheekColor={RED} size={size} loading="eager" followCursor={false} interactive={false} />
    </div>
  );
}

const CIRCLE = "M380 60 C 560 70 640 200 620 330 C 600 470 470 560 320 550 C 160 540 50 430 60 290 C 70 150 190 50 360 64";
const ARROW = (x1: number, y1: number, x2: number, y2: number) => {
  const mx = (x1 + x2) / 2 + (y2 - y1) * 0.25;
  const my = (y1 + y2) / 2 - (x2 - x1) * 0.25;
  const a = Math.atan2(y2 - my, x2 - mx);
  const h = 26;
  return `M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2} M${x2} ${y2} L ${x2 - h * Math.cos(a - 0.5)} ${y2 - h * Math.sin(a - 0.5)} M${x2} ${y2} L ${x2 - h * Math.cos(a + 0.5)} ${y2 - h * Math.sin(a + 0.5)}`;
};

export default function Video() {
  const t = useClock();
  // re-seed the wobble a few times a second: the "boiling line" look of hand animation
  const seed = Math.floor(t * 8) % 5;

  const s2Mood: Mood = t < 5.2 ? "thinking" : t < 6.6 ? "loading" : "happy";
  const shapes: { shape: Shape; color: string }[] = [
    { shape: "ghost", color: BRAND },
    { shape: "pebble", color: "#f2a07b" },
    { shape: "blob", color: "#8fb996" },
    { shape: "drop", color: "#8ec5e8" },
    { shape: "bean", color: "#b9a3e3" },
    { shape: "cube", color: "#f3d36b" },
  ];
  const code = '<Moodi mood="love" />';
  const typed = code.slice(0, Math.floor(p(t, 11.9, 13.3) * code.length));

  return (
    <div
      style={{
        position: "relative",
        width: 1920,
        height: 1080,
        overflow: "hidden",
        background: PAPER,
      }}
    >
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="wobble">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
        <filter id="paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3" />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.09 0" />
        </filter>
      </svg>
      {/* paper grain + faint ruled lines */}
      <svg style={{ position: "absolute", inset: 0 }} width="1920" height="1080" aria-hidden>
        <rect width="1920" height="1080" filter="url(#paper)" />
        {Array.from({ length: 14 }, (_, i) => (
          <line key={i} x1="0" x2="1920" y1={80 + i * 74} y2={80 + i * 74} stroke="#d9cfbf" strokeWidth="1" opacity="0.45" />
        ))}
      </svg>

      {/* 1 · meet moodi */}
      <Scene t={t} from={0} to={3.6}>
        <Stroke box="0 0 680 620" d={CIRCLE} progress={easeOut(p(t, 0.1, 1.3))} width={6} style={{ left: 620, top: 160, width: 680, height: 620 }} />
        <Buddy t={t} at={0.7} x={960} y={460} size={460} mood={t < 2.6 ? "idle" : "happy"} />
        <Write progress={p(t, 1.4, 2.4)} style={{ left: 780, top: 800, fontSize: 120, fontWeight: 700 }}>
          meet moodi
        </Write>
        <Stroke box="0 0 300 40" d="M5 25 C 80 10 160 35 290 12" progress={p(t, 2.3, 2.8)} color={BRAND} width={7} style={{ left: 820, top: 935, width: 300, height: 40 }} />
      </Scene>

      {/* 2 · it shows what your UI is doing */}
      <Scene t={t} from={3.6} to={8.2}>
        <Write progress={p(t, 3.7, 4.6)} style={{ left: 190, top: 70, fontSize: 92, fontWeight: 700 }}>
          it shows what your UI is doing
        </Write>
        <Buddy t={t} at={3.8} x={960} y={600} size={470} mood={s2Mood} />
        {[
          { at: 3.9, label: "thinking…", x: 230, y: 420, rot: -4, to: [520, 470, 760, 560] },
          { at: 5.2, label: "loading…", x: 1420, y: 360, rot: 3, to: [1420, 440, 1180, 540] },
          { at: 6.6, label: "done!", x: 1460, y: 760, rot: -2, to: [1440, 800, 1190, 700] },
        ].map((n) => (
          <div key={n.label}>
            <div
              className={hand.className}
              style={{
                position: "absolute",
                left: n.x,
                top: n.y,
                padding: "14px 30px 18px",
                background: n.label === "done!" ? "#ffe6a8" : "#fff8d8",
                boxShadow: "0 6px 0 rgba(31,26,22,0.08)",
                border: `3px solid ${INK}`,
                borderRadius: "14px 18px 12px 20px",
                fontSize: 64,
                fontWeight: 700,
                color: INK,
                transform: `rotate(${n.rot}deg) scale(${back(p(t, n.at, n.at + 0.45))})`,
              }}
            >
              {n.label}
            </div>
            <Stroke box="0 0 1920 1080" d={ARROW(n.to[0], n.to[1], n.to[2], n.to[3])} progress={p(t, n.at + 0.3, n.at + 0.8)} width={5} style={{ left: 0, top: 0, width: 1920, height: 1080 }} />
          </div>
        ))}
        <Stroke box="0 0 120 100" d="M10 55 L 45 88 L 112 10" progress={p(t, 7.0, 7.4)} color="#2f9e57" width={11} style={{ left: 1675, top: 720, width: 110, height: 92 }} />
      </Scene>

      {/* 3 · pick a shape */}
      <Scene t={t} from={8.2} to={11.8}>
        <Write progress={p(t, 8.3, 9.0)} style={{ left: 700, top: 110, fontSize: 110, fontWeight: 700 }}>
          pick a shape
        </Write>
        {shapes.map((s, i) => (
          <div key={s.shape}>
            <Buddy t={t} at={8.7 + i * 0.22} x={260 + i * 280} y={560} size={290} mood={i % 2 ? "happy" : "idle"} shape={s.shape} color={s.color} />
            <Stroke box="0 0 200 30" d="M5 18 C 60 6 130 26 195 10" progress={p(t, 9.1 + i * 0.22, 9.5 + i * 0.22)} color={s.color} width={8} style={{ left: 160 + i * 280, top: 740, width: 200, height: 30 }} />
            <Write progress={p(t, 9.2 + i * 0.22, 9.6 + i * 0.22)} style={{ left: 200 + i * 280, top: 770, fontSize: 56, fontWeight: 500 }}>
              {s.shape}
            </Write>
          </div>
        ))}
        <Write progress={p(t, 10.4, 11.0)} style={{ left: 760, top: 900, fontSize: 64, fontWeight: 500, color: BRAND }}>
          + any color you like
        </Write>
      </Scene>

      {/* 4 · one line */}
      <Scene t={t} from={11.8} to={15.4}>
        <Write progress={p(t, 11.85, 12.5)} style={{ left: 160, top: 110, fontSize: 100, fontWeight: 700 }}>
          one line of code
        </Write>
        <div
          className={hand.className}
          style={{
            position: "absolute",
            left: 160,
            top: 380,
            width: 820,
            padding: "56px 60px",
            background: "#fffdf7",
            border: `3px solid ${INK}`,
            borderRadius: "22px 16px 26px 18px",
            transform: `rotate(-2deg) translateY(${(1 - back(p(t, 11.9, 12.4))) * 40}px)`,
            opacity: p(t, 11.85, 12.1),
            boxShadow: "8px 10px 0 rgba(31,26,22,0.1)",
            fontSize: 76,
            fontWeight: 700,
            color: INK,
          }}
        >
          <span style={{ color: BRAND }}>{typed}</span>
          <span style={{ opacity: Math.floor(t * 3) % 2 ? 1 : 0 }}>|</span>
        </div>
        <Stroke box="0 0 1920 1080" d={ARROW(1000, 520, 1230, 560)} progress={p(t, 13.3, 13.8)} width={6} style={{ left: 0, top: 0, width: 1920, height: 1080 }} />
        <Buddy t={t} at={13.5} x={1470} y={560} size={480} mood="love" />
      </Scene>

      {/* 5 · end card */}
      <Scene t={t} from={15.4} to={DURATION + 1}>
        <Buddy t={t} at={15.5} x={560} y={540} size={520} mood="happy" />
        <Write progress={p(t, 15.7, 16.4)} style={{ left: 880, top: 280, fontSize: 230, fontWeight: 700, lineHeight: 1 }}>
          moodi
        </Write>
        <Stroke box="0 0 560 40" d="M5 28 C 140 6 300 34 550 12" progress={p(t, 16.3, 16.8)} color={BRAND} width={10} style={{ left: 890, top: 520, width: 560, height: 40 }} />
        <Write progress={p(t, 16.6, 17.3)} style={{ left: 890, top: 580, fontSize: 64, fontWeight: 500 }}>
          tiny 3D mood buddies for your UI
        </Write>
        <Write progress={p(t, 17.2, 17.8)} style={{ left: 890, top: 690, fontSize: 70, fontWeight: 700, color: BRAND }}>
          npm i moodi · getmoodi.dev
        </Write>
      </Scene>
    </div>
  );
}
