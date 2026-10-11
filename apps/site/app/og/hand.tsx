"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Caveat } from "next/font/google";
import { Moodi, type Mood, type Shape } from "moodi/react";

/* Shared kit for the hand-drawn promo videos (/og/video landscape, /og/short vertical). */

export const hand = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

export const INK = "#efe7da"; // light ink on a dark page
export const BRAND = "#2b15d1";
/** the brand, lifted so text and strokes read on the dark page */
export const BRAND_INK = "#8f84ff";
export const RED = "#e8424f";
export const PAPER = "#121116";
export const DURATION = 18.6;

export const clamp = (x: number) => Math.min(1, Math.max(0, x));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const back = (x: number) => {
  const c = 1.7;
  x = clamp(x);
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
/** 0..1 progress of t through [a, b] */
export const p = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

export function useClock() {
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
export function Stroke({
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
export function Write({ children, progress, style }: { children: ReactNode; progress: number; style?: CSSProperties }) {
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

export function Scene({ t, from, to, children }: { t: number; from: number; to: number; children: ReactNode }) {
  if (t < from - 0.4 || t > to + 0.4) return null; // mount a little early so buddies are ready
  const o = Math.min(p(t, from, from + 0.35), 1 - p(t, to - 0.35, to));
  return <div style={{ position: "absolute", inset: 0, opacity: o }}>{children}</div>;
}

export function Buddy({ t, at, x, y, size, mood, shape = "ghost", color = BRAND }: { t: number; at: number; x: number; y: number; size: number; mood: Mood; shape?: Shape; color?: string }) {
  const s = back(p(t, at, at + 0.55));
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, transform: `scale(${s})`, opacity: s > 0.01 ? 1 : 0 }}>
      <Moodi mood={mood} shape={shape} color={color} cheekColor={RED} size={size} loading="eager" followCursor={false} interactive={false} />
    </div>
  );
}

export const CIRCLE = "M380 60 C 560 70 640 200 620 330 C 600 470 470 560 320 550 C 160 540 50 430 60 290 C 70 150 190 50 360 64";
export const ARROW = (x1: number, y1: number, x2: number, y2: number) => {
  const mx = (x1 + x2) / 2 + (y2 - y1) * 0.25;
  const my = (y1 + y2) / 2 - (x2 - x1) * 0.25;
  const a = Math.atan2(y2 - my, x2 - mx);
  const h = 26;
  return `M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2} M${x2} ${y2} L ${x2 - h * Math.cos(a - 0.5)} ${y2 - h * Math.sin(a - 0.5)} M${x2} ${y2} L ${x2 - h * Math.cos(a + 0.5)} ${y2 - h * Math.sin(a + 0.5)}`;
};

/** Wobble + paper filters, the indigo glow and faint ruled lines, sized to the frame. */
export function Backdrop({ t, w, h }: { t: number; w: number; h: number }) {
  // re-seed the wobble a few times a second: the "boiling line" look of hand animation
  const seed = Math.floor(t * 8) % 5;
  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="wobble">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
        <filter id="paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3" />
          <feColorMatrix values="0 0 0 0 0.9  0 0 0 0 0.85  0 0 0 0 0.8  0 0 0 0.05 0" />
        </filter>
      </svg>
      <svg style={{ position: "absolute", inset: 0 }} width={w} height={h} aria-hidden>
        <defs>
          <radialGradient id="glow" cx="50%" cy="52%" r="55%">
            <stop offset="0" stopColor={BRAND} stopOpacity="0.28" />
            <stop offset="1" stopColor={BRAND} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#glow)" />
        <rect width={w} height={h} filter="url(#paper)" />
        {Array.from({ length: Math.ceil((h - 80) / 74) }, (_, i) => (
          <line key={i} x1="0" x2={w} y1={80 + i * 74} y2={80 + i * 74} stroke="#2c2934" strokeWidth="1" opacity="0.8" />
        ))}
      </svg>
    </>
  );
}

export const SHAPE_COLORS: { shape: Shape; color: string }[] = [
  { shape: "ghost", color: BRAND },
  { shape: "pebble", color: "#f2a07b" },
  { shape: "blob", color: "#8fb996" },
  { shape: "drop", color: "#8ec5e8" },
  { shape: "bean", color: "#b9a3e3" },
  { shape: "cube", color: "#f3d36b" },
];

/** Shared beats of the timeline */
export const stateMood = (t: number): Mood => (t < 5.2 ? "thinking" : t < 6.6 ? "loading" : "happy");
export const CODE = '<Moodi mood="love" />';
export const typedCode = (t: number) => CODE.slice(0, Math.floor(p(t, 11.9, 13.3) * CODE.length));
