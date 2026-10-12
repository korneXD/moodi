"use client";

import { useEffect, useRef, useState } from "react";
import { codeText, codeTokens, type Tab } from "@/lib/code";
import type { PlaygroundState } from "@/lib/state";
import { CheckIcon, ChevronIcon, CopyIcon, ResetIcon } from "./icons";

const TABS: { id: Tab; label: string }[] = [
  { id: "react", label: "React" },
  { id: "wc", label: "Web Component" },
  { id: "cdn", label: "CDN" },
];

const COLORS = {
  p: "text-muted",
  tag: "text-[var(--syn-tag)]",
  attr: "text-fg",
  str: "text-[var(--syn-str)]",
  kw: "text-[var(--syn-kw)]",
};

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };
  return [copied, copy] as const;
}

export function CodeBlock({ state, onReset }: { state: PlaygroundState; onReset: () => void }) {
  const [tab, setTab] = useState<Tab>("react");
  const [open, setOpen] = useState(false);
  const [copied, copy] = useCopy();
  const tokens = codeTokens(state, tab);

  return (
    <section className="code-collapsible flex min-h-0 flex-1 flex-col" data-open={open}>
      <button
        type="button"
        className="code-toggle press flex items-center justify-between rounded-lg py-2 text-[13px] text-muted hover:text-fg"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide code" : "Show code"}
        <ChevronIcon className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <div className="code-body flex min-h-0 flex-1 flex-col border-t border-line pt-3">
        <div className="flex items-center justify-between gap-2">
          <div role="tablist" aria-label="Code format" className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`press whitespace-nowrap rounded-md px-[7px] py-1 text-[12px] ${
                  tab === t.id ? "bg-chip-strong text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center">
            <button
              type="button"
              onClick={onReset}
              aria-label="Reset all settings"
              title="Reset"
              className="press grid size-7 place-items-center rounded-md text-muted hover:text-fg"
            >
              <ResetIcon width={13} height={13} />
            </button>
            <button
              type="button"
              onClick={() => copy(codeText(state, tab))}
              data-fast-goal="copy_code"
              data-fast-goal-tab={tab}
              aria-label={copied ? "Copied" : "Copy code"}
              className="press flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-muted hover:text-fg"
            >
              {copied ? <CheckIcon width={13} height={13} /> : <CopyIcon width={13} height={13} />}
              <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        <div className="mt-2 flex min-h-0 flex-1 flex-col">
          <pre
            role="tabpanel"
            className="no-scrollbar min-h-0 flex-1 overflow-auto rounded-lg bg-chip compact:flex-none px-3.5 py-3 font-mono text-[12px] leading-[1.65]"
          >
            <code>
              {tokens.map(([text, kind], i) => (
                <span key={i} className={COLORS[kind]}>
                  {text}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
