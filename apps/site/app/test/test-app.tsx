"use client";

import { useEffect, useState } from "react";
import { loadMoodi } from "moodi/react";
import { SubHeader } from "@/components/sub-header";
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
      <SubHeader section="test">
        <nav className="tabs" aria-label="Pages">
          {TABS.map((t) => (
            <a key={t.id} href={`#${t.id}`} data-fast-goal={t.id === "example" ? "live_example_open" : "test_tab_open"} className="tab" aria-current={tab === t.id ? "page" : undefined}>
              {t.label}
            </a>
          ))}
        </nav>
      </SubHeader>

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
