"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { loadMoodi, Moodi, MOOD_INFO, type Mood, type MoodiBuddyElement, type Shape } from "moodi/react";
import { SoundToggle } from "./sound-toggle";
import { useInView } from "./use-in-view";

type Method = "react" | "wc" | "cdn";

type Row = {
  shape: Shape;
  name: string;
  description: string;
  method: Method;
  color: string;
  colorName: string;
  mood: Mood;
  /** starts with sound on (the `sound` attribute) */
  sound: boolean;
};

export const CDN_URL = "https://esm.sh/moodi@0.2";

const METHOD_LABEL: Record<Method, string> = {
  react: "React component",
  wc: "Web Component",
  cdn: "CDN (esm.sh)",
};

const METHOD_SOURCE: Record<Method, string> = {
  react: "import { Moodi } from 'moodi/react'",
  wc: "import 'moodi'  →  <moodi-buddy>",
  cdn: `${CDN_URL}  →  <moodi-cdn>`,
};

// All six shapes, each with its own palette color and loading method.
const ROWS: Row[] = [
  {
    shape: "ghost",
    name: "Ghost",
    description: "The default shape. A wavy hem and a floating body: the classic little ghost.",
    method: "react",
    color: "#6c5ce7",
    colorName: "Iris",
    mood: "happy",
    sound: true,
  },
  {
    shape: "pebble",
    name: "Pebble",
    description: "A flat, rounded pebble. Low and wide, it reads well at small sizes too.",
    method: "wc",
    color: "#f2a07b",
    colorName: "Peach",
    mood: "thinking",
    sound: true,
  },
  {
    shape: "blob",
    name: "Blob",
    description: "A soft, round blob. The friendliest shape, great for loading states.",
    method: "cdn",
    color: "#8fb996",
    colorName: "Sage",
    mood: "loading",
    sound: true,
  },
  {
    shape: "drop",
    name: "Drop",
    description: "A droplet with a pointed top. Fits watching and listening states.",
    method: "react",
    color: "#8ec5e8",
    colorName: "Sky",
    mood: "listening",
    sound: false,
  },
  {
    shape: "bean",
    name: "Bean",
    description: "A tall, narrow bean. For vertical spots, a sidebar or next to a chat.",
    method: "wc",
    color: "#f3d36b",
    colorName: "Butter",
    mood: "love",
    sound: false,
  },
  {
    shape: "cube",
    name: "Cube",
    description: "A rounded cube. The most technical shape, perfect for an AI assistant.",
    method: "cdn",
    color: "#f07167",
    colorName: "Coral",
    mood: "speaking",
    sound: false,
  },
];

const SIZE = 180;

type BuddyProps = {
  row: Row;
  sound: boolean;
  elRef: RefObject<MoodiBuddyElement | null>;
  onReady: () => void;
};

/** Listens for the element's `ready` event (first 3D frame on screen). */
function useElementReady(elRef: BuddyProps["elRef"], onReady: () => void) {
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (el.hasAttribute("ready")) return void onReady();
    el.addEventListener("ready", onReady);
    return () => el.removeEventListener("ready", onReady);
  }, [elRef, onReady]);
}

function WebComponentBuddy({ row, sound, elRef, onReady }: BuddyProps) {
  useElementReady(elRef, onReady);
  useEffect(() => {
    loadMoodi(); // same as `import 'moodi'`: registers <moodi-buddy>
  }, []);
  return (
    <moodi-buddy ref={elRef} shape={row.shape} mood={row.mood} color={row.color} size={SIZE} sound={sound ? "true" : "false"} />
  );
}

function CdnBuddy({ row, sound, elRef, onReady }: BuddyProps) {
  useElementReady(elRef, onReady);
  return (
    <moodi-cdn ref={elRef} shape={row.shape} mood={row.mood} color={row.color} size={SIZE} sound={sound ? "true" : "false"} />
  );
}

function snippet(row: Row, sound: boolean): ReactNode {
  const s = (v: string) => <span className="syn-str">&quot;{v}&quot;</span>;
  const a = (k: string) => <span className="syn-kw">{k}</span>;
  if (row.method === "react") {
    return (
      <>
        <span className="syn-tag">{"<Moodi"}</span> {a("shape")}={s(row.shape)} {a("mood")}={s(row.mood)} {a("color")}=
        {s(row.color)}
        {sound && <> {a("sound")}</>} <span className="syn-tag">{"/>"}</span>
      </>
    );
  }
  const tag = row.method === "wc" ? "moodi-buddy" : "moodi-cdn";
  return (
    <>
      <span className="syn-tag">{`<${tag}`}</span> {a("shape")}={s(row.shape)} {a("mood")}={s(row.mood)} {a("color")}=
      {s(row.color)}
      {sound && (
        <>
          {" "}
          {a("sound")}={s("true")}
        </>
      )}
      <span className="syn-tag">{`></${tag}>`}</span>
    </>
  );
}

function BuddyRow({ row, index }: { row: Row; index: number }) {
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  const [sound, setSound] = useState(row.sound);
  const elRef = useRef<MoodiBuddyElement>(null);
  // `sound` is only true while the buddy is at least 60% visible (see useInView)
  const inView = useInView(elRef);
  const audible = sound && inView;

  return (
    <article className="row" style={{ "--c": row.color } as CSSProperties} data-flip={index % 2 === 1}>
      <div className="row-text">
        <p className="method">
          <span className={`method-dot method-${row.method}`} aria-hidden />
          Tested as: <strong>{METHOD_LABEL[row.method]}</strong>
        </p>
        <h2>
          <span className="index">{String(index + 1).padStart(2, "0")}</span> {row.name}
        </h2>
        <p className="desc">{row.description}</p>
        <dl className="meta">
          <div>
            <dt>Color</dt>
            <dd>
              <span className="swatch" /> {row.colorName} <code>{row.color}</code>
            </dd>
          </div>
          <div>
            <dt>Mood</dt>
            <dd>
              {MOOD_INFO[row.mood].label}. {MOOD_INFO[row.mood].description}
            </dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>
              <code>{METHOD_SOURCE[row.method]}</code>
            </dd>
          </div>
        </dl>
        <pre>
          <code>{snippet(row, sound)}</code>
        </pre>
      </div>

      <div className="stage">
        <span className={`status ${ready ? "ok" : ""}`} role="status">
          {ready ? "Rendered ✓" : "Loading…"}
        </span>
        <SoundToggle on={sound} onToggle={() => setSound((v) => !v)} />
        {row.method === "react" && (
          <Moodi
            ref={elRef}
            shape={row.shape}
            mood={row.mood}
            color={row.color}
            size={SIZE}
            sound={audible}
            loading="eager"
            onReady={markReady}
          />
        )}
        {row.method === "wc" && <WebComponentBuddy row={row} sound={audible} elRef={elRef} onReady={markReady} />}
        {row.method === "cdn" && <CdnBuddy row={row} sound={audible} elRef={elRef} onReady={markReady} />}
        <span className="stage-label">{METHOD_LABEL[row.method]}</span>
      </div>
    </article>
  );
}

const SETTLE_MOODS: Mood[] = ["happy", "error", "love", "surprised"];
const SETTLE_TIMES = [1000, 2000, 3000];
const SETTLE_THEN: (Mood | undefined)[] = [undefined, "idle", "sleeping", "sad"];

/** Side by side: the same mood with and without `settle`. */
function SettleDemo() {
  const [target, setTarget] = useState<Mood>("happy");
  const [mood, setMood] = useState<Mood>("happy");
  const [ms, setMs] = useState(2000);
  const [then, setThen] = useState<Mood | undefined>(undefined);
  const later = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(later.current), []);

  // dropping to idle for a moment restarts the mood (and the settle timer)
  const play = (m: Mood = target) => {
    setTarget(m);
    setMood("idle");
    clearTimeout(later.current);
    later.current = window.setTimeout(() => setMood(m), 120);
  };

  return (
    <article className="row settle-demo" style={{ "--c": "#6c5ce7" } as CSSProperties}>
      <div className="row-text">
        <p className="method">
          <span className="method-dot method-react" aria-hidden />
          New: <strong>settle</strong> + <strong>settleMood</strong>
        </p>
        <h2>
          <span className="index">07</span> Settle
        </h2>
        <p className="desc">
          Some moods keep moving: happy hops, error shakes, love floats with hearts. <code>settle</code> lets the mood
          play for a while, then the body calms down to gentle breathing while the face keeps its expression. Add{" "}
          <code>settleMood</code> to rest in a different mood instead, e.g. celebrate with happy, then go back to idle.
          Every new mood restarts the timer.
        </p>
        <dl className="meta">
          <div>
            <dt>Mood</dt>
            <dd className="pills">
              {SETTLE_MOODS.map((m) => (
                <button key={m} type="button" aria-pressed={target === m} onClick={() => play(m)}>
                  {MOOD_INFO[m].label}
                </button>
              ))}
            </dd>
          </div>
          <div>
            <dt>Then</dt>
            <dd className="pills">
              {SETTLE_THEN.map((m) => (
                <button
                  key={m ?? "same"}
                  type="button"
                  aria-pressed={then === m}
                  onClick={() => {
                    setThen(m);
                    play();
                  }}
                >
                  {m ? MOOD_INFO[m].label : "Same, calmer"}
                </button>
              ))}
            </dd>
          </div>
          <div>
            <dt>Settle</dt>
            <dd className="pills">
              {SETTLE_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={ms === t}
                  onClick={() => {
                    setMs(t);
                    play();
                  }}
                >
                  {t / 1000}s
                </button>
              ))}
              <button type="button" className="replay" onClick={() => play()}>
                ↻ Replay
              </button>
            </dd>
          </div>
        </dl>
        <pre>
          <code>
            <span className="syn-tag">{"<Moodi"}</span> <span className="syn-kw">mood</span>=
            <span className="syn-str">&quot;{target}&quot;</span> <span className="syn-kw">settle</span>=
            <span className="syn-kw">{`{${ms}}`}</span>
            {then && (
              <>
                {" "}
                <span className="syn-kw">settleMood</span>=<span className="syn-str">&quot;{then}&quot;</span>
              </>
            )}{" "}
            <span className="syn-tag">{"/>"}</span>
          </code>
        </pre>
      </div>

      <div className="stage settle-stage">
        <div className="settle-pair">
          <figure>
            <Moodi mood={mood} size={150} loading="eager" />
            <figcaption>without settle</figcaption>
          </figure>
          <figure>
            <Moodi mood={mood} size={150} settle={ms} settleMood={then} loading="eager" />
            <figcaption>
              settle={ms}
              {then ? ` → ${then}` : ""}
            </figcaption>
          </figure>
        </div>
      </div>
    </article>
  );
}

export function ShapesTest() {
  return (
    <>
      <main>
        <section className="hero">
          <p className="eyebrow">moodi · test</p>
          <h1>All six shapes, three ways to load.</h1>
          <p className="lead">
            Each row is one shape with its own color and mood, loaded as a React component, a Web Component or straight
            from a CDN. The badge turns green once the first 3D frame is on screen. The button in the top left toggles
            sound (the <code>sound</code> attribute); a few start with it on, but browsers only allow audio after your
            first click.
          </p>
          <ul className="legend">
            {(Object.keys(METHOD_LABEL) as Method[]).map((m) => (
              <li key={m}>
                <span className={`method-dot method-${m}`} aria-hidden />
                <span>{METHOD_LABEL[m]}</span>
                <code>{METHOD_SOURCE[m]}</code>
              </li>
            ))}
          </ul>
        </section>

        <section className="rows">
          {ROWS.map((row, i) => (
            <BuddyRow key={row.shape} row={row} index={i} />
          ))}
          <SettleDemo />
        </section>
      </main>

      <footer className="footer">
        <span>
          Docs: <a href="/docs">getmoodi.dev/docs</a>
        </span>
        <span>Click or hover a buddy.</span>
      </footer>
    </>
  );
}
