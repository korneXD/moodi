import Link from "next/link";
import type { ReactNode } from "react";
import { Moodi } from "moodi/react";
import { GITHUB_URL } from "@/lib/site";

const LINKS = [
  { href: "/", label: "Playground", id: "playground" },
  { href: "/test", label: "Test", id: "test" },
  { href: "/docs", label: "Docs", id: "docs" },
] as const;

/** One header for /docs and /test: same height, logo and links on both. */
export function SubHeader({ section, children }: { section: "docs" | "test"; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-line bg-bg/85 px-5 backdrop-blur max-sm:px-4">
      <Link href="/" className="flex items-center gap-1.5 justify-self-start">
        <Moodi size={30} loading="interaction" poster="/posters/logo.webp" interactive={false} shadow={false} aria-hidden />
        <span className="text-[17px] font-semibold tracking-[-0.03em]">moodi</span>
        <span className="ml-2 text-[13px] text-muted">{section}</span>
      </Link>
      <div className="justify-self-center">{children}</div>
      <nav className="flex items-center gap-4 justify-self-end text-[13px] text-muted">
        {LINKS.map((l) => (
          <Link
            key={l.id}
            href={l.href}
            aria-current={l.id === section ? "page" : undefined}
            className={`hover:text-fg max-sm:hidden ${l.id === section ? "text-fg" : ""}`}
          >
            {l.label}
          </Link>
        ))}
        <a href={GITHUB_URL} className="hover:text-fg">
          GitHub
        </a>
      </nav>
    </header>
  );
}
