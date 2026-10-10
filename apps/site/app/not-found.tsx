import type { Metadata } from "next";
import Link from "next/link";
import { Moodi } from "moodi/react";

export const metadata: Metadata = { title: "Page Not Found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Moodi mood="sad" size={200} />
      <p className="mt-2 font-mono text-[13px] text-muted">404</p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.02em]">This page doesn&apos;t exist.</h1>
      <p className="mt-2 text-[15px] text-muted">Even the ghost looked everywhere.</p>
      <Link
        href="/"
        className="press mt-8 inline-flex h-10 items-center rounded-lg bg-chip-strong px-4 text-[14px] text-fg hover:bg-chip"
      >
        Back to moodi
      </Link>
    </main>
  );
}
