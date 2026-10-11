"use client";

import type { CSSProperties, ReactNode } from "react";
import { ARROW, back, Backdrop, BRAND_INK, Buddy, CIRCLE, DURATION, easeOut, hand, INK, p, PAPER, Scene, SHAPE_COLORS, stateMood, Stroke, typedCode, useClock, Write } from "../hand";

/*
  Vertical cut of the promo for YouTube Shorts (1080×1920). Same beats and timings as
  /og/video, so both share one soundtrack. Asset generation only (/og is noindex).
*/

const W = 1080;
const H = 1920;

/** Handwriting centred on the frame */
function Centered({ top, progress, style, children }: { top: number; progress: number; style?: CSSProperties; children: ReactNode }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
      <Write progress={progress} style={{ position: "relative", ...style }}>
        {children}
      </Write>
    </div>
  );
}

export default function Short() {
  const t = useClock();
  const typed = typedCode(t);

  return (
    <div style={{ position: "relative", width: W, height: H, overflow: "hidden", background: PAPER }}>
      <Backdrop t={t} w={W} h={H} />

      {/* 1 · meet moodi */}
      <Scene t={t} from={0} to={3.6}>
        <Stroke box="0 0 680 620" d={CIRCLE} progress={easeOut(p(t, 0.1, 1.3))} width={6} style={{ left: 160, top: 470, width: 760, height: 693 }} />
        <Buddy t={t} at={0.7} x={540} y={810} size={540} mood={t < 2.6 ? "idle" : "happy"} />
        <Centered top={1260} progress={p(t, 1.4, 2.4)} style={{ fontSize: 150, fontWeight: 700 }}>
          meet moodi
        </Centered>
        <Stroke box="0 0 300 40" d="M5 25 C 80 10 160 35 290 12" progress={p(t, 2.3, 2.8)} color={BRAND_INK} width={7} style={{ left: 360, top: 1450, width: 360, height: 48 }} />
      </Scene>

      {/* 2 · it shows what your UI is doing */}
      <Scene t={t} from={3.6} to={8.2}>
        <Centered top={170} progress={p(t, 3.7, 4.2)} style={{ fontSize: 112, fontWeight: 700 }}>
          it shows what
        </Centered>
        <Centered top={300} progress={p(t, 4.1, 4.6)} style={{ fontSize: 112, fontWeight: 700 }}>
          your UI is doing
        </Centered>
        <Buddy t={t} at={3.8} x={540} y={1060} size={540} mood={stateMood(t)} />
        {[
          { at: 3.9, label: "thinking…", x: 80, y: 560, rot: -4, to: [250, 690, 330, 820] },
          { at: 5.2, label: "loading…", x: 650, y: 580, rot: 3, to: [800, 710, 740, 830] },
          { at: 6.6, label: "done!", x: 420, y: 1440, rot: -2, to: [540, 1430, 540, 1340] },
        ].map((n) => (
          <div key={n.label}>
            <div
              className={hand.className}
              style={{
                position: "absolute",
                left: n.x,
                top: n.y,
                padding: "14px 30px 18px",
                background: n.label === "done!" ? "#2f2814" : "#1f1d26",
                boxShadow: "0 6px 0 rgba(0,0,0,0.35)",
                border: `3px solid ${INK}`,
                borderRadius: "14px 18px 12px 20px",
                fontSize: 64,
                fontWeight: 700,
                color: n.label === "done!" ? "#ffd479" : INK,
                transform: `rotate(${n.rot}deg) scale(${back(p(t, n.at, n.at + 0.45))})`,
              }}
            >
              {n.label}
            </div>
            <Stroke box={`0 0 ${W} ${H}`} d={ARROW(n.to[0], n.to[1], n.to[2], n.to[3])} progress={p(t, n.at + 0.3, n.at + 0.8)} width={5} style={{ left: 0, top: 0, width: W, height: H }} />
          </div>
        ))}
        <Stroke box="0 0 120 100" d="M10 55 L 45 88 L 112 10" progress={p(t, 7.0, 7.4)} color="#5bd88a" width={11} style={{ left: 700, top: 1440, width: 110, height: 92 }} />
      </Scene>

      {/* 3 · pick a shape */}
      <Scene t={t} from={8.2} to={11.8}>
        <Centered top={220} progress={p(t, 8.3, 9.0)} style={{ fontSize: 140, fontWeight: 700 }}>
          pick a shape
        </Centered>
        {SHAPE_COLORS.map((s, i) => {
          const x = 200 + (i % 3) * 340;
          const y = 720 + Math.floor(i / 3) * 460;
          return (
            <div key={s.shape}>
              <Buddy t={t} at={8.7 + i * 0.22} x={x} y={y} size={280} mood={i % 2 ? "happy" : "idle"} shape={s.shape} color={s.color} />
              <Stroke box="0 0 200 30" d="M5 18 C 60 6 130 26 195 10" progress={p(t, 9.1 + i * 0.22, 9.5 + i * 0.22)} color={s.color} width={8} style={{ left: x - 100, top: y + 150, width: 200, height: 30 }} />
              <div style={{ position: "absolute", left: x - 150, width: 300, top: y + 175, display: "flex", justifyContent: "center" }}>
                <Write progress={p(t, 9.2 + i * 0.22, 9.6 + i * 0.22)} style={{ position: "relative", fontSize: 60, fontWeight: 500 }}>
                  {s.shape}
                </Write>
              </div>
            </div>
          );
        })}
        <Centered top={1640} progress={p(t, 10.4, 11.0)} style={{ fontSize: 76, fontWeight: 500, color: BRAND_INK }}>
          + any color you like
        </Centered>
      </Scene>

      {/* 4 · one line */}
      <Scene t={t} from={11.8} to={15.4}>
        <Centered top={200} progress={p(t, 11.85, 12.5)} style={{ fontSize: 124, fontWeight: 700 }}>
          one line of code
        </Centered>
        <div
          className={hand.className}
          style={{
            position: "absolute",
            left: 90,
            top: 500,
            width: 900,
            padding: "56px 60px",
            background: "#1a1820",
            border: `3px solid ${INK}`,
            borderRadius: "22px 16px 26px 18px",
            transform: `rotate(-2deg) translateY(${(1 - back(p(t, 11.9, 12.4))) * 40}px)`,
            opacity: p(t, 11.85, 12.1),
            boxShadow: "8px 10px 0 rgba(0,0,0,0.35)",
            fontSize: 80,
            fontWeight: 700,
            color: INK,
          }}
        >
          <span style={{ color: BRAND_INK }}>{typed}</span>
          <span style={{ opacity: Math.floor(t * 3) % 2 ? 1 : 0 }}>|</span>
        </div>
        <Stroke box={`0 0 ${W} ${H}`} d={ARROW(500, 790, 560, 1010)} progress={p(t, 13.3, 13.8)} width={6} style={{ left: 0, top: 0, width: W, height: H }} />
        <Buddy t={t} at={13.5} x={540} y={1340} size={580} mood="love" />
      </Scene>

      {/* 5 · end card */}
      <Scene t={t} from={15.4} to={DURATION + 1}>
        <Buddy t={t} at={15.5} x={540} y={700} size={620} mood="happy" />
        <Centered top={1030} progress={p(t, 15.7, 16.4)} style={{ fontSize: 260, fontWeight: 700, lineHeight: 1 }}>
          moodi
        </Centered>
        <Stroke box="0 0 560 40" d="M5 28 C 140 6 300 34 550 12" progress={p(t, 16.3, 16.8)} color={BRAND_INK} width={10} style={{ left: 260, top: 1300, width: 560, height: 40 }} />
        <Centered top={1370} progress={p(t, 16.6, 17.3)} style={{ fontSize: 62, fontWeight: 500 }}>
          tiny 3D mood buddies for your UI
        </Centered>
        <Centered top={1480} progress={p(t, 17.2, 17.8)} style={{ fontSize: 72, fontWeight: 700, color: BRAND_INK }}>
          npm i moodi · getmoodi.dev
        </Centered>
      </Scene>
    </div>
  );
}
