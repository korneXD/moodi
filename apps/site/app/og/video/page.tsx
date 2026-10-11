"use client";

import { ARROW, back, Backdrop, BRAND_INK, Buddy, CIRCLE, DURATION, easeOut, hand, INK, p, PAPER, Scene, SHAPE_COLORS, stateMood, Stroke, typedCode, useClock, Write } from "../hand";

/*
  Hand-drawn promo (1920×1080, ~18.5 s). Everything is a function of the clock `t`, so a
  frame-by-frame capture in virtual time is exact. Asset generation only (/og is noindex).
*/

export default function Video() {
  const t = useClock();
  const shapes = SHAPE_COLORS;
  const s2Mood = stateMood(t);
  const typed = typedCode(t);

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
      <Backdrop t={t} w={1920} h={1080} />

      {/* 1 · meet moodi */}
      <Scene t={t} from={0} to={3.6}>
        <Stroke box="0 0 680 620" d={CIRCLE} progress={easeOut(p(t, 0.1, 1.3))} width={6} style={{ left: 620, top: 160, width: 680, height: 620 }} />
        <Buddy t={t} at={0.7} x={960} y={460} size={460} mood={t < 2.6 ? "idle" : "happy"} />
        <Write progress={p(t, 1.4, 2.4)} style={{ left: 780, top: 800, fontSize: 120, fontWeight: 700 }}>
          meet moodi
        </Write>
        <Stroke box="0 0 300 40" d="M5 25 C 80 10 160 35 290 12" progress={p(t, 2.3, 2.8)} color={BRAND_INK} width={7} style={{ left: 820, top: 935, width: 300, height: 40 }} />
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
            <Stroke box="0 0 1920 1080" d={ARROW(n.to[0], n.to[1], n.to[2], n.to[3])} progress={p(t, n.at + 0.3, n.at + 0.8)} width={5} style={{ left: 0, top: 0, width: 1920, height: 1080 }} />
          </div>
        ))}
        <Stroke box="0 0 120 100" d="M10 55 L 45 88 L 112 10" progress={p(t, 7.0, 7.4)} color="#5bd88a" width={11} style={{ left: 1675, top: 720, width: 110, height: 92 }} />
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
        <Write progress={p(t, 10.4, 11.0)} style={{ left: 760, top: 900, fontSize: 64, fontWeight: 500, color: BRAND_INK }}>
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
            background: "#1a1820",
            border: `3px solid ${INK}`,
            borderRadius: "22px 16px 26px 18px",
            transform: `rotate(-2deg) translateY(${(1 - back(p(t, 11.9, 12.4))) * 40}px)`,
            opacity: p(t, 11.85, 12.1),
            boxShadow: "8px 10px 0 rgba(0,0,0,0.35)",
            fontSize: 76,
            fontWeight: 700,
            color: INK,
          }}
        >
          <span style={{ color: BRAND_INK }}>{typed}</span>
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
        <Stroke box="0 0 560 40" d="M5 28 C 140 6 300 34 550 12" progress={p(t, 16.3, 16.8)} color={BRAND_INK} width={10} style={{ left: 890, top: 520, width: 560, height: 40 }} />
        <Write progress={p(t, 16.6, 17.3)} style={{ left: 890, top: 580, fontSize: 64, fontWeight: 500 }}>
          tiny 3D mood buddies for your UI
        </Write>
        <Write progress={p(t, 17.2, 17.8)} style={{ left: 890, top: 690, fontSize: 70, fontWeight: 700, color: BRAND_INK }}>
          npm i moodi · getmoodi.dev
        </Write>
      </Scene>
    </div>
  );
}
