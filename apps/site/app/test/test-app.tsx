"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadMoodi, Moodi } from "moodi/react";
import { GITHUB_URL } from "@/lib/site";
import { CDN_URL, ShapesTest } from "./shapes-test";
import { LiveExample } from "./live-example";

type Tab = "test" | "example";

const TABS: { id: Tab; label: string }[] = [
  { id: "test", label: "Test" },
  { id: "example", label: "Live example" },
];

const tabFromHash = (): Tab => (window.location.hash === "#example" ? "example" : "test");

/**
 * The CDN row loads moodi straight from esm.sh, the way a page without a build step would,
 * and registers it under its own tag so it can't be confused with the npm copy.
 */
let cdnLoading: Promise<unknown> | null = null;
function loadCdn() {
  return (cdnLoading ??= loadMoodi()
    .then(() => import(/* webpackIgnore: true */ /* turbopackIgnore: true */ CDN_URL))
    .then((m: { defineMoodi: (tag: string) => void }) => m.defineMoodi("moodi-cdn"))
    .catch(() => {}));
}

export function TestApp() {
  const [tab, setTab] = useState<Tab>("test");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the hash is only readable on the client
    setTab(tabFromHash());
    const onHash = () => {
      setTab(tabFromHash());
      window.scrollTo(0, 0);
    };
    addEventListener("hashchange", onHash);
    loadCdn();
    return () => removeEventListener("hashchange", onHash);
  }, []);

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/">
          <Moodi size={26} interactive={false} shadow={false} loading="eager" aria-hidden />
          moodi <span className="brand-sub">test</span>
        </Link>
        <nav className="tabs" aria-label="Pages">
          {TABS.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="tab" aria-current={tab === t.id ? "page" : undefined}>
              {t.label}
            </a>
          ))}
        </nav>
        <nav className="links">
          <code className="chip">$ npm i moodi three</code>
          <Link className="nav-link" href="/docs">
            Docs
          </Link>
          <a className="nav-link hide-sm" href={GITHUB_URL}>
            GitHub
          </a>
        </nav>
      </header>

      {/* both stay mounted, only hidden: buddies keep their state when you switch tabs */}
      <div hidden={tab !== "test"}>
        <ShapesTest />
      </div>
      <div hidden={tab !== "example"}>
        <LiveExample />
      </div>
    </>
  );
}
