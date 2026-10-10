"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import {
  Moodi,
  MOOD_INFO,
  MOODS,
  PALETTES,
  SHAPE_LABELS,
  SHAPES,
  type Mood,
  type MoodiBuddyElement,
  type Shape,
} from "moodi/react";
import { INITIAL, SIZE_MAX, SIZE_MIN, SPEEDS, type PlaygroundState } from "@/lib/state";
import { AUTHOR, GITHUB_URL } from "@/lib/site";
import { CodeBlock, useCopy } from "./code-block";
import { Row, Segmented, Slider, Swatches, Toggle } from "./controls";
import { CheckIcon, CopyIcon, GitHubIcon, MoonIcon, PauseIcon, SunIcon } from "./icons";

const BODY = Object.entries(PALETTES).map(([name, color]) => ({ name, color }));
const FACE = [
  { name: "Black", color: "#121014" },
  { name: "Cream", color: "#fff6ee" },
  { name: "Night", color: "#1e2a44" },
];
const CHEEKS = [
  { name: "Rose", color: "#ff7a8a" },
  { name: "Apricot", color: "#ffad7a" },
  { name: "Berry", color: "#d65a9a" },
];

const SLEEP_AFTER = 20_000;
const HERO_POSTER = "/posters/hero.webp";

/**
 * three.js loads on the first pointer, touch, key or scroll. Until then each buddy shows
 * a still rendered from the default look (public/posters), so the page paints instantly.
 */
const LOADING = "interaction" as const;
const isPristine = (s: PlaygroundState) => s.color === INITIAL.color && !s.faceColor && !s.cheekColor;

/** The hero stays big; `size` scales it within the stage (and shows up in the code). */
const stageScale = (size: number) => Math.min(1, Math.max(0.3, size / 220)).toFixed(3);

export function Playground() {
  const [state, setState] = useState<PlaygroundState>(INITIAL);
  const [sleepy, setSleepy] = useState(false);
  const stage = useRef<MoodiBuddyElement | null>(null);

  const set = useCallback(<K extends keyof PlaygroundState>(key: K, value: PlaygroundState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  // idle easter egg: 20 s without input → sleeping; any input wakes it with a start
  useEffect(() => {
    let last = performance.now();
    let asleep = false;
    const wake = () => {
      last = performance.now();
      if (!asleep) return;
      asleep = false;
      setSleepy(false);
      stage.current?.react("surprised", { duration: 900 });
    };
    const id = setInterval(() => {
      if (!asleep && performance.now() - last > SLEEP_AFTER && !document.hidden) {
        asleep = true;
        setSleepy(true);
      }
    }, 1000);
    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => addEventListener(e, wake, { passive: true }));
    return () => {
      clearInterval(id);
      events.forEach((e) => removeEventListener(e, wake));
    };
  }, []);

  // moodi plays its own per-mood sounds; the playground only remembers the switch
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preference lives in localStorage
      if (localStorage.getItem("moodi-sound") === "off") setState((s) => ({ ...s, sound: false }));
    } catch {}
  }, []);
  const toggleSound = (on: boolean) => {
    set("sound", on);
    try {
      localStorage.setItem("moodi-sound", on ? "on" : "off");
    } catch {}
  };

  const shownMood: Mood = sleepy ? "sleeping" : state.mood;
  const pristine = isPristine(state);
  preload(HERO_POSTER, { as: "image", fetchPriority: "high" });
  const paletteName = BODY.find((b) => b.color === state.color)?.name ?? state.color;

  return (
    <div className="app" style={{ ["--accent" as string]: state.color }}>
      <Header state={state} />

      {/* shape rail */}
      <nav
        aria-label="Shape"
        className="area-rail no-scrollbar flex flex-col items-center justify-center gap-1 overflow-y-auto border-r border-line py-4 compact:flex-row compact:justify-start compact:gap-2 compact:overflow-x-auto compact:border-r-0 compact:border-t compact:px-4"
      >
        {SHAPES.map((shape, i) => (
          <Thumb
            key={shape}
            index={i + 2}
            active={state.shape === shape}
            label={SHAPE_LABELS[shape]}
            onSelect={() => set("shape", shape)}
            className="w-[64px]"
            moodi={{ shape, mood: "idle", followCursor: state.followCursor }}
            state={state}
            size={46}
            poster={pristine ? `/posters/shape-${shape}.webp` : undefined}
          />
        ))}
      </nav>

      {/* stage */}
      <main className="area-stage relative flex min-h-0 flex-col items-center justify-center overflow-hidden px-4 compact:py-6">
        {/* visually hidden: the page's heading for search engines and screen readers */}
        <h1 className="sr-only">moodi: a tiny 3D character that shows your UI&rsquo;s state.</h1>
        <div className="relative flex flex-col items-center">
          <div
            aria-hidden
            className="stage-glow pointer-events-none absolute left-1/2 top-[44%] aspect-square w-[min(170%,_68dvh)] -translate-x-1/2 -translate-y-1/2 compact:w-[150%]"
          />
          <Moodi
            ref={stage}
            shape={state.shape}
            mood={shownMood}
            color={state.color}
            faceColor={state.faceColor}
            cheekColor={state.cheekColor}
            speed={state.speed}
            followCursor={state.followCursor}
            size="min(60dvh, 40vw, 520px)"
            loading={LOADING}
            poster={pristine && state.shape === "ghost" && shownMood === "idle" ? HERO_POSTER : undefined}
            sound={state.sound}
            className="stage-buddy compact:!h-[min(72vw,340px)] compact:!w-[min(72vw,340px)]"
            // size scales the hero with a springy transform; the canvas keeps its resolution
            style={{
              transform: `scale(${stageScale(state.size)})`,
              transformOrigin: "50% 84%",
              transition: "transform 520ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
          <MoodLabel mood={shownMood} />
        </div>
      </main>

      {/* settings */}
      <aside
        aria-label="Settings"
        className="area-panel no-scrollbar flex min-h-0 flex-col gap-[18px] overflow-y-auto border-l border-line px-5 py-[18px] compact:overflow-visible compact:border-l-0 compact:border-t"
      >
        <div className="enter" style={{ ["--i" as string]: 3 }}>
          <Row label="Shape" value={SHAPE_LABELS[state.shape]} />
        </div>
        <div className="enter" style={{ ["--i" as string]: 4 }}>
          <Row label="Color" value={paletteName}>
            <Swatches
              label="Body"
              value={state.color}
              options={BODY}
              pickerBase={state.color}
              onChange={(c) => set("color", c ?? INITIAL.color)}
            />
          </Row>
        </div>
        <div className="enter grid grid-cols-2 gap-4 max-lg:grid-cols-1 max-lg:gap-5 compact:grid-cols-2" style={{ ["--i" as string]: 5 }}>
          <Row label="Face">
            <Swatches
              label="Face"
              auto
              value={state.faceColor}
              options={FACE.slice(0, 2)}
              pickerBase="#121014"
              onChange={(c) => set("faceColor", c)}
            />
          </Row>
          <Row label="Cheeks">
            <Swatches
              label="Cheeks"
              auto
              value={state.cheekColor}
              options={CHEEKS.slice(0, 2)}
              pickerBase="#ff7a8a"
              onChange={(c) => set("cheekColor", c)}
            />
          </Row>
        </div>
        <div className="enter" style={{ ["--i" as string]: 6 }}>
          <Row label="Size" value={`${state.size}px`}>
            <Slider
              label="Size"
              min={SIZE_MIN}
              max={SIZE_MAX}
              step={4}
              value={state.size}
              onChange={(v) => set("size", v)}
            />
          </Row>
        </div>
        <div className="enter" style={{ ["--i" as string]: 6.5 }}>
          <Row label="Speed">
            <Segmented
              label="Speed"
              value={state.speed}
              onChange={(v) => set("speed", v)}
              options={SPEEDS.map((v) =>
                v === 0 ? { value: v, label: <PauseIcon />, aria: "Pause" } : { value: v, label: `${v}×` },
              )}
            />
          </Row>
        </div>
        <div className="enter" style={{ ["--i" as string]: 7 }}>
          <div className="flex flex-col gap-3">
            <Toggle label="Follow cursor" checked={state.followCursor} onChange={(v) => set("followCursor", v)} />
            <Toggle label="Sound" checked={state.sound} onChange={toggleSound} />
          </div>
        </div>
        <div className="enter flex min-h-[150px] flex-1 flex-col compact:min-h-0" style={{ ["--i" as string]: 8 }}>
          <CodeBlock state={state} onReset={() => setState(INITIAL)} />
        </div>
      </aside>

      {/* mood dock */}
      <nav aria-label="Mood" className="area-dock border-t border-line">
        <div className="no-scrollbar flex justify-center gap-1 overflow-x-auto px-4 py-2.5 compact:justify-start">
          {MOODS.map((mood, i) => (
            <Thumb
              key={mood}
              index={i * 0.6 + 4}
              active={state.mood === mood}
              label={MOOD_INFO[mood].label}
              onSelect={() => set("mood", mood)}
              className="w-[66px] max-lg:w-[60px]"
              moodi={{ shape: state.shape, mood, followCursor: false }}
              state={state}
              size={44}
              poster={pristine && state.shape === "ghost" ? `/posters/mood-${mood}.webp` : undefined}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

/**
 * Small live buddy in the shape rail / mood dock. Only the selected or hovered one
 * animates; the rest hold still, which keeps a page of 19 buddies cheap.
 */
function Thumb({
  index,
  active,
  label,
  onSelect,
  className,
  moodi,
  state,
  size,
  poster,
}: {
  poster?: string;
  index: number;
  active: boolean;
  label: string;
  onSelect: () => void;
  className: string;
  moodi: { shape: Shape; mood: Mood; followCursor: boolean };
  state: PlaygroundState;
  size: number;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className={`enter press group flex shrink-0 flex-col items-center gap-0.5 rounded-xl py-1.5 ${
        active ? "bg-chip-strong" : ""
      } ${className}`}
      style={{ ["--i" as string]: index }}
    >
      <span
        className={`transition-opacity duration-150 ${active ? "opacity-100" : "opacity-45 group-hover:opacity-85"}`}
      >
        <Moodi
          {...moodi}
          loading={LOADING}
          poster={poster}
          color={state.color}
          faceColor={state.faceColor}
          cheekColor={state.cheekColor}
          size={size}
          speed={active || hover ? state.speed : 0}
          interactive={false}
          shadow={false}
          aria-hidden
        />
      </span>
      <span className={`text-[11px] ${active ? "text-fg" : "text-muted group-hover:text-fg"}`}>{label}</span>
    </button>
  );
}

/** Mood title + description, crossfading with a 6px slide. */
function MoodLabel({ mood }: { mood: Mood }) {
  const [items, setItems] = useState([{ mood, key: 0 }]);
  const [prevMood, setPrevMood] = useState(mood);
  if (mood !== prevMood) {
    setPrevMood(mood);
    setItems((list) => [list[list.length - 1], { mood, key: list[list.length - 1].key + 1 }]);
  }
  return (
    <div className="relative -mt-[4%] h-[56px] w-[320px] text-center" aria-live="polite">
      {items.map((it, i) => {
        const current = i === items.length - 1;
        return (
          <div
            key={it.key}
            className={`absolute inset-x-0 top-0 ${current ? (it.key ? "swap-in" : "") : "swap-out"}`}
            aria-hidden={!current}
          >
            <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.02em]">{MOOD_INFO[it.mood].label}</h2>
            <p className="mt-1 text-[14px] text-muted">{MOOD_INFO[it.mood].description}</p>
          </div>
        );
      })}
    </div>
  );
}

function Header({ state }: { state: PlaygroundState }) {
  const [copied, copy] = useCopy();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- theme lives on <html>, set before paint
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("moodi-theme", next);
    } catch {}
  };

  return (
    <header className="area-header flex items-center border-b border-line px-4 sm:px-5">
      <Link href="/" className="enter flex items-center gap-1.5" aria-label="moodi home">
        <Moodi
          shape={state.shape}
          color={state.color}
          faceColor={state.faceColor}
          cheekColor={state.cheekColor}
          size={30}
          loading={LOADING}
          poster={isPristine(state) && state.shape === "ghost" ? "/posters/logo.webp" : undefined}
          interactive={false}
          shadow={false}
          aria-hidden
        />
        <span className="text-[17px] font-semibold tracking-[-0.03em]">moodi</span>
      </Link>
      <a
        href={AUTHOR.url}
        target="_blank"
        rel="noopener noreferrer"
        className="enter mr-auto ml-2 flex items-center gap-2 rounded-full py-1 pl-1.5 pr-3 text-[17px] tracking-[-0.02em] text-muted transition-colors duration-150 hover:bg-chip hover:text-fg"
        style={{ ["--i" as string]: 0.5 }}
      >
        <span>by</span>
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static avatar */}
        <img src={AUTHOR.avatar} alt="" width={26} height={26} className="size-[26px] rounded-full" />
        @{AUTHOR.handle}
      </a>
      <div className="enter flex items-center gap-1" style={{ ["--i" as string]: 1 }}>
        <button
          type="button"
          onClick={() => copy("npm i moodi three")}
          className="press flex h-8 items-center gap-2 rounded-lg bg-chip pl-3 pr-2.5 font-mono text-[12.5px] text-fg hover:bg-chip-strong max-sm:hidden"
          aria-label={copied ? "Copied npm i moodi" : "Copy npm i moodi"}
        >
          <span className="text-muted">$</span>
          npm i moodi
          <span className="ml-1 grid size-4 place-items-center text-muted">
            {copied ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
          </span>
        </button>
        <a
          href={GITHUB_URL}
          className="press grid size-8 place-items-center rounded-lg text-muted hover:text-fg"
          aria-label="GitHub"
        >
          <GitHubIcon />
        </a>
        <Link href="/test" className="press hidden h-8 items-center rounded-lg px-2 text-[13px] text-muted hover:text-fg sm:flex">
          Test
        </Link>
        <Link href="/docs" className="press hidden h-8 items-center rounded-lg px-2 text-[13px] text-muted hover:text-fg sm:flex">
          Docs
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="press grid size-8 place-items-center rounded-lg text-muted hover:text-fg"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
