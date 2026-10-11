"use client";

import { useEffect, useRef, useState } from "react";
import { Moodi, type Mood } from "moodi/react";

/**
 * Product Hunt thumbnail source (240×240, cream tile). With ?capture the clock waits for
 * window.__go; the mood runs happy → love → happy, each settling after 1.5 s so the body
 * is back to calm breathing at both ends (the recorder crossfades the seam).
 */
export default function Thumb() {
  const [t, setT] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const w = window as unknown as { __go?: boolean; __t?: number };
      if (location.search.includes("capture") && !w.__go) return void (raf = requestAnimationFrame(loop));
      start.current ??= now;
      const s = (now - start.current) / 1000;
      w.__t = s;
      setT(s);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const mood: Mood = t > 1.0 && t < 3.4 ? "love" : "happy";
  return (
    <>
      <style>{`html,body{background:#f4efe8!important}`}</style>
      <div className="size-[240px] overflow-hidden bg-[#f4efe8]">
        <Moodi
          mood={mood}
          cheekColor="#e8424f"
          size={300}
          settle={1500}
          shadow={false}
          followCursor={false}
          interactive={false}
          loading="eager"
          style={{ margin: "-24px 0 0 -30px" }}
        />
      </div>
    </>
  );
}
