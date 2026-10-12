import Link from "next/link";
import type { ReactNode } from "react";
import { FEEDBACK_URL, GITHUB_URL } from "@/lib/site";
import { FeedbackIcon } from "./icons";

const LINKS = [
  { href: "/", label: "Playground", id: "playground", goal: "home_click" },
  { href: "/test", label: "Test", id: "test", goal: "test_open" },
  { href: "/docs", label: "Docs", id: "docs", goal: "docs_open" },
] as const;

/** One header for /docs and /test: same height, logo and links on both. */
export function SubHeader({ section, children }: { section: "docs" | "test"; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-line bg-bg/85 px-5 backdrop-blur max-sm:px-4">
      <Link href="/" data-fast-goal="home_click" data-fast-goal-from={section} className="flex items-center gap-1.5 justify-self-start">
        {/* a still, not the live 3D buddy: that one belongs to the playground */}
        {/* eslint-disable-next-line @next/next/no-img-element -- 60px static logo */}
        <img src="/posters/logo.webp" alt="" width={30} height={30} className="size-[30px]" />
        <span className="text-[17px] font-semibold tracking-[-0.03em]">moodi</span>
        <span className="ml-2 text-[13px] text-muted">{section}</span>
      </Link>
      <div className="justify-self-center">{children}</div>
      <nav className="flex items-center gap-4 justify-self-end text-[13px] text-muted">
        {LINKS.map((l) => (
          <Link
            key={l.id}
            href={l.href}
            data-fast-goal={l.goal}
            data-fast-goal-from={section}
            aria-current={l.id === section ? "page" : undefined}
            className={`hover:text-fg max-sm:hidden ${l.id === section ? "text-fg" : ""}`}
          >
            {l.label}
          </Link>
        ))}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-fast-goal="github_click"
          data-fast-goal-from={section}
          className="hover:text-fg"
        >
          GitHub
        </a>
        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-fast-goal="feedback_click"
          data-fast-goal-from={section}
          aria-label="Send feedback (opens in a new tab)"
          title="Feedback"
          className="-mx-1.5 grid size-8 place-items-center rounded-lg hover:bg-chip hover:text-fg"
        >
          <FeedbackIcon />
        </a>
      </nav>
    </header>
  );
}
