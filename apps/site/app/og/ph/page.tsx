"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Moodi, MOOD_INFO, MOODS, PALETTES, SHAPE_LABELS, SHAPES, type Shape } from "moodi/react";

/** Product Hunt gallery (1270×760): screenshot /og/ph?n=1..4. Asset generation only. */

const W = "w-[1270px] h-[760px]";
const calm = { followCursor: false, interactive: false, loading: "eager" as const };

function Frame({ children, kicker, title }: { children: ReactNode; kicker: string; title: ReactNode }) {
  return (
    <div className={`relative flex ${W} flex-col items-center overflow-hidden bg-bg`} style={{ ["--accent" as string]: "#2b15d1" }}>
      <div className="stage-glow absolute left-1/2 top-[56%] size-[900px] -translate-x-1/2 -translate-y-1/2 opacity-80" />
      <p className="relative mt-[64px] font-mono text-[15px] text-[var(--syn-kw)]">{kicker}</p>
      <h1 className="relative mt-3 text-[54px] font-semibold leading-none tracking-[-0.035em]">{title}</h1>
      <div className="relative flex w-full flex-1 items-center justify-center">{children}</div>
    </div>
  );
}

function Cover() {
  return (
    <div className={`relative flex ${W} items-center overflow-hidden bg-bg`} style={{ ["--accent" as string]: "#2b15d1" }}>
      <div className="stage-glow absolute right-[20px] top-1/2 size-[820px] -translate-y-1/2" />
      <div className="relative z-10 pl-[96px]">
        <div className="text-[124px] font-semibold leading-none tracking-[-0.05em]">moodi</div>
        <div className="mt-6 text-[36px] tracking-[-0.01em] text-muted">Tiny 3D mood buddies for your UI.</div>
        <div className="mt-10 inline-flex rounded-2xl bg-chip px-6 py-3.5 font-mono text-[27px]">
          <span className="mr-3 text-muted">$</span>npm i moodi
        </div>
      </div>
      <div className="absolute right-[70px] top-1/2 -translate-y-1/2">
        <Moodi mood="happy" cheekColor="#ff3b4e" size={600} settle={1} {...calm} />
      </div>
    </div>
  );
}

function Moods() {
  return (
    <Frame kicker={`mood="${MOODS.slice(0, 4).join(" | ")} | …"`} title="11 moods for every UI state">
      <div className="flex w-[1120px] flex-wrap justify-center gap-x-4 gap-y-1 pb-4">
        {MOODS.map((m) => (
          <figure key={m} className="flex w-[170px] flex-col items-center">
            <Moodi mood={m} size={168} {...calm} />
            <figcaption className="-mt-4 text-[18px] text-fg">{MOOD_INFO[m].label}</figcaption>
          </figure>
        ))}
      </div>
    </Frame>
  );
}

const SNIPPETS: { label: string; shape: Shape; code: string }[] = [
  { label: "React", shape: "ghost", code: `import { Moodi }\n  from 'moodi/react'\n\n<Moodi mood="happy" />` },
  { label: "Web Component", shape: "blob", code: `import 'moodi'\n\n<moodi-buddy mood="thinking">\n</moodi-buddy>` },
  { label: "CDN", shape: "cube", code: `<script type="module"\n  src="https://esm.sh/moodi">\n</script>\n<moodi-buddy mood="love">` },
];

function OneLine() {
  const moods = ["happy", "thinking", "love"] as const;
  return (
    <Frame kicker="npm i moodi three" title="One line. Any stack.">
      <div className="grid grid-cols-3 gap-6 px-[70px] pb-10">
        {SNIPPETS.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center rounded-3xl border border-line bg-bg/70 px-6 pb-7 pt-2 backdrop-blur">
            <Moodi shape={s.shape} mood={moods[i]} size={210} cheekColor="#ff3b4e" {...calm} />
            <span className="-mt-2 text-[20px] font-semibold">{s.label}</span>
            <pre className="mt-4 w-full whitespace-pre rounded-xl bg-chip px-4 py-3.5 font-mono text-[14px] leading-[1.6] text-[var(--syn-tag)]">
              {s.code}
            </pre>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function ShapesColors() {
  const colors = Object.values(PALETTES);
  return (
    <Frame kicker={`shape="${SHAPES.join(" | ")}"`} title="6 shapes. Any color.">
      <div className="flex flex-col items-center gap-8 pb-12">
        <div className="flex items-end gap-4">
          {SHAPES.map((s, i) => (
            <figure key={s} className="flex flex-col items-center">
              <Moodi shape={s} color={colors[i]} mood={i % 2 ? "happy" : "idle"} size={180} {...calm} />
              <figcaption className="-mt-3 text-[18px]">{SHAPE_LABELS[s]}</figcaption>
            </figure>
          ))}
        </div>
        <div className="flex items-center gap-3 rounded-full bg-chip px-5 py-3">
          {colors.map((c) => (
            <span key={c} className="size-7 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.15)]" style={{ background: c }} />
          ))}
          <span className="ml-2 font-mono text-[15px] text-muted">+ any CSS color</span>
        </div>
      </div>
    </Frame>
  );
}

export default function ProductHunt() {
  const [n, setN] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the slide number is only readable on the client
  useEffect(() => setN(Number(new URLSearchParams(location.search).get("n") ?? 1)), []);
  if (n === null) return null;
  return [<Cover key={1} />, <Moods key={2} />, <OneLine key={3} />, <ShapesColors key={4} />][n - 1] ?? null;
}
