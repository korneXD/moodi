import type { Metadata } from "next";
import Link from "next/link";
import { Moodi } from "moodi/react";

export const metadata: Metadata = { title: "Page Not Found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 text-center">
      <div
        aria-hidden
        className="stage-glow pointer-events-none absolute left-1/2 top-[42%] aspect-square w-[min(90vw,620px)] -translate-x-1/2 -translate-y-1/2"
        style={{ ["--accent" as string]: "#2b15d1" }}
      />
      <div className="relative flex flex-col items-center">
        <Moodi mood="error" size={240} loading="eager" aria-label="moodi: error" />
        <p className="mt-1 font-mono text-[13px] tracking-[0.2em] text-muted">404</p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.025em]">This page doesn&apos;t exist.</h1>
        <p className="mt-2 max-w-[34ch] text-[15px] text-muted">
          Even moodi is confused. The link may be broken, or the page has moved.
        </p>
        <div className="mt-8 flex gap-2">
          <Link href="/" className="press inline-flex h-10 items-center rounded-lg bg-fg px-4 text-[14px] font-medium text-bg hover:opacity-90">
            Back to the playground
          </Link>
          <Link href="/docs" className="press inline-flex h-10 items-center rounded-lg px-4 text-[14px] text-muted hover:bg-chip hover:text-fg">
            Docs
          </Link>
        </div>
      </div>
    </main>
  );
}
