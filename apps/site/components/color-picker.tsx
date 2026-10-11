"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";

/* ---------- color math (hex <-> HSV) ---------- */

type HSV = { h: number; s: number; v: number };

function hexToHsv(hex: string): HSV {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
}

function hsvToHex({ h, s, v }: HSV): string {
  const f = (k: number) => {
    const x = (k + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(x, 4 - x, 1));
  };
  return "#" + [f(5), f(3), f(1)].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
}

const HEX = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;
function normalizeHex(input: string): string | null {
  const m = HEX.exec(input.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return `#${h.toLowerCase()}`;
}

const clamp = (x: number) => Math.min(1, Math.max(0, x));

/** Drag inside an element; reports the pointer as 0..1 fractions of its box. */
function useDrag(onMove: (x: number, y: number) => void) {
  return useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      const move = (ev: { clientX: number; clientY: number }) => {
        const r = el.getBoundingClientRect();
        onMove(clamp((ev.clientX - r.left) / r.width), clamp((ev.clientY - r.top) / r.height));
      };
      move(e);
      const up = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    },
    [onMove],
  );
}

interface EyeDropperResult {
  sRGBHex: string;
}
declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<EyeDropperResult> };
  }
}

/* ---------- popover ---------- */

interface PanelProps {
  value: string;
  label: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  anchor: HTMLElement;
}

function Panel({ value, label, onChange, onClose, anchor }: PanelProps) {
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value));
  const [text, setText] = useState(value);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const hex = hsvToHex(hsv);

  // keep the text field in sync while dragging, not while typing in it
  const commit = useCallback(
    (next: HSV) => {
      setHsv(next);
      const h = hsvToHex(next);
      setText(h);
      onChange(h);
    },
    [onChange],
  );

  // place below the trigger, right-aligned, flipped above if there's no room
  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.getBoundingClientRect();
      const w = 248, h = panel.current?.offsetHeight ?? 300, gap = 10;
      const left = Math.max(12, Math.min(window.innerWidth - w - 12, a.right - w));
      const below = a.bottom + gap + h <= window.innerHeight - 12;
      setPos({ left, top: below ? a.bottom + gap : Math.max(12, a.top - gap - h) });
    };
    place();
    addEventListener("resize", place);
    addEventListener("scroll", place, true);
    return () => {
      removeEventListener("resize", place);
      removeEventListener("scroll", place, true);
    };
  }, [anchor]);

  useEffect(() => {
    const down = (e: globalThis.PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !anchor.contains(t)) onClose();
    };
    const key = (e: globalThis.KeyboardEvent) => e.key === "Escape" && (onClose(), anchor.focus());
    addEventListener("pointerdown", down, true);
    addEventListener("keydown", key);
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      removeEventListener("pointerdown", down, true);
      removeEventListener("keydown", key);
    };
  }, [anchor, onClose]);

  const dragSV = useDrag((x, y) => commit({ ...hsv, s: x, v: 1 - y }));
  const dragHue = useDrag((x) => commit({ ...hsv, h: x * 359.9 }));

  const keySV = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (!d) return;
    e.preventDefault();
    commit({ ...hsv, s: clamp(hsv.s + d[0]), v: clamp(hsv.v + d[1]) });
  };
  const keyHue = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 30 : 4;
    const d = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step }[e.key];
    if (d === undefined) return;
    e.preventDefault();
    commit({ ...hsv, h: (hsv.h + d + 360) % 360 });
  };

  const applyText = () => {
    const h = normalizeHex(text);
    if (h) commit(hexToHsv(h));
    else setText(hex);
  };

  const pick = async () => {
    try {
      const r = await new window.EyeDropper!().open();
      const h = normalizeHex(r.sRGBHex);
      if (h) commit(hexToHsv(h));
    } catch {}
  };

  const pure = hsvToHex({ h: hsv.h, s: 1, v: 1 });

  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-label={`${label} color picker`}
      className="fixed z-50 w-[248px] rounded-2xl border border-line bg-bg/95 p-3 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.55)] backdrop-blur-xl"
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, animation: "swap-in 180ms var(--ease) both" }}
    >
      {/* saturation × brightness */}
      <div
        role="slider"
        tabIndex={0}
        data-autofocus
        aria-label="Saturation and brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuetext={`saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
        onPointerDown={dragSV}
        onKeyDown={keySV}
        className="relative h-[148px] cursor-crosshair touch-none overflow-hidden rounded-xl"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pure})`,
        }}
      >
        <span
          className="pointer-events-none absolute size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white shadow-[0_0_0_1px_rgb(0_0_0/0.25),0_2px_6px_rgb(0_0_0/0.35)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }}
        />
      </div>

      {/* hue */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        onPointerDown={dragHue}
        onKeyDown={keyHue}
        className="relative mt-3 h-3 cursor-pointer touch-none rounded-full"
        style={{
          background: "linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00)",
        }}
      >
        <span
          className="pointer-events-none absolute top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white shadow-[0_0_0_1px_rgb(0_0_0/0.25),0_2px_6px_rgb(0_0_0/0.35)]"
          style={{ left: `${(hsv.h / 360) * 100}%`, background: pure }}
        />
      </div>

      {/* hex + eyedropper */}
      <div className="mt-3 flex items-center gap-2">
        <span className="size-8 shrink-0 rounded-lg shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_18%,transparent)]" style={{ background: hex }} />
        <label className="flex h-8 min-w-0 flex-1 items-center gap-1 rounded-lg bg-chip px-2.5 font-mono text-[12.5px] focus-within:bg-chip-strong">
          <span className="text-faint">HEX</span>
          <input
            value={text.replace("#", "").toUpperCase()}
            onChange={(e) => setText("#" + e.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 6))}
            onBlur={applyText}
            onKeyDown={(e) => e.key === "Enter" && applyText()}
            aria-label="Hex color"
            spellCheck={false}
            className="w-full min-w-0 bg-transparent text-fg uppercase outline-none"
          />
        </label>
        {typeof window !== "undefined" && window.EyeDropper && (
          <button
            type="button"
            onClick={pick}
            aria-label="Pick a color from the screen"
            title="Pick from screen"
            className="press grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-chip hover:text-fg"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m14.5 6.5 3 3M4 20l1-4 9.5-9.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z" />
              <path d="m16 5 1.5-1.5a2.1 2.1 0 0 1 3 3L19 8" />
            </svg>
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- trigger ---------- */

export function ColorPicker({
  label,
  value,
  active,
  base,
  onChange,
}: {
  label: string;
  /** current custom color, when one is chosen */
  value: string | undefined;
  /** ring around the trigger: a custom color is selected */
  active: boolean;
  /** where the picker starts when nothing custom is chosen yet */
  base: string;
  onChange: (hex: string) => void;
}) {
  // the trigger element doubles as the "open" flag and the popover's anchor
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = anchor !== null;
  const close = useCallback(() => setAnchor(null), []);

  return (
    <>
      <button
        type="button"
        aria-label={`Custom ${label.toLowerCase()} color`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Custom color"
        onClick={(e) => {
          const el = e.currentTarget;
          setAnchor((a) => (a ? null : el));
        }}
        className="press relative grid size-[22px] place-items-center rounded-full"
      >
        <span
          className="size-[18px] rounded-full"
          style={{
            background: active && value
              ? value
              : "conic-gradient(from 90deg, #ff8a8a, #ffd36e, #a6e39b, #7fd3f2, #b39cf5, #f59ad6, #ff8a8a)",
          }}
        />
        <span
          className={`absolute inset-0 rounded-full ring-[1.5px] ring-fg transition-opacity duration-150 ${
            active || open ? "opacity-100" : "opacity-0"
          }`}
        />
      </button>
      {anchor && (
        <Panel value={normalizeHex(value ?? base) ?? "#6c5ce7"} label={label} onChange={onChange} onClose={close} anchor={anchor} />
      )}
    </>
  );
}
