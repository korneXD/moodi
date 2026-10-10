import type { Metadata } from "next";
import { Moodi } from "moodi/react";

export const metadata: Metadata = { title: "moodi og", robots: { index: false } };

/**
 * 1200×630 composition used to (re)generate app/opengraph-image.png:
 * screenshot this page with a headless browser at that viewport.
 */
export default function OgCard() {
  return (
    <div className="relative flex h-[630px] w-[1200px] items-center overflow-hidden bg-bg" style={{ ["--accent" as string]: "#6c5ce7" }}>
      <div className="stage-glow absolute right-[40px] top-1/2 size-[760px] -translate-y-1/2" />
      <div className="relative z-10 pl-[96px]">
        <div className="text-[112px] font-semibold leading-none tracking-[-0.05em]">moodi</div>
        <div className="mt-6 text-[34px] tracking-[-0.01em] text-muted">Tiny 3D mood buddies for your UI.</div>
        <div className="mt-10 inline-flex rounded-2xl bg-chip px-6 py-3.5 font-mono text-[26px]">
          <span className="mr-3 text-muted">$</span>npm i moodi
        </div>
      </div>
      <div className="absolute right-[60px] top-1/2 -translate-y-1/2">
        <Moodi mood="happy" size={560} followCursor={false} interactive={false} speed={0} />
      </div>
    </div>
  );
}
