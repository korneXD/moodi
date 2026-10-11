import type { Metadata } from "next";
import { Moodi } from "moodi/react";

export const metadata: Metadata = { title: "Docs card", robots: { index: false } };

/** 1200×630 source for public/opengraph-docs-v<N>.png (bump N in app/docs/page.tsx). */
export default function DocsCard() {
  return (
    <div className="relative flex h-[630px] w-[1200px] items-center overflow-hidden bg-bg" style={{ ["--accent" as string]: "#2b15d1" }}>
      <div className="stage-glow absolute right-[40px] top-1/2 size-[760px] -translate-y-1/2" />
      <div className="relative z-10 pl-[96px]">
        <div className="flex items-baseline gap-5">
          <span className="text-[104px] font-semibold leading-none tracking-[-0.05em]">moodi</span>
          <span className="text-[56px] font-medium tracking-[-0.03em] text-muted">docs</span>
        </div>
        <pre className="mt-10 rounded-2xl bg-chip px-7 py-6 font-mono text-[25px] leading-[1.6]">
          <span className="text-[var(--syn-kw)]">import</span> {"{ Moodi } "}
          <span className="text-[var(--syn-kw)]">from</span> <span className="text-[var(--syn-str)]">&apos;moodi/react&apos;</span>
          {"\n\n"}
          <span className="text-muted">&lt;</span>
          <span className="text-[var(--syn-tag)]">Moodi</span> mood=<span className="text-[var(--syn-str)]">&quot;thinking&quot;</span>
          <span className="text-muted"> /&gt;</span>
        </pre>
      </div>
      <div className="absolute right-[50px] top-1/2 -translate-y-1/2">
        <Moodi mood="thinking" size={500} followCursor={false} interactive={false} />
      </div>
    </div>
  );
}
