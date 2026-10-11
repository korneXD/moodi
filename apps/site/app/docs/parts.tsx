"use client";

// Constants from moodi/react are client references on the server, so the pieces
// that read them live in a client module (still server-rendered).
import { Moodi, MOOD_INFO, MOODS, PALETTES, SHAPE_LABELS, SHAPES } from "moodi/react";

const PROPS: [prop: string, attr: string, type: string, def: string, desc: string][] = [
  ["shape", "shape", SHAPES.map((s) => `'${s}'`).join(" | "), "'ghost'", "Body shape."],
  ["mood", "mood", "Mood", "'idle'", "Current state. Changes are interpolated, never instant."],
  ["color", "color", "string", "'#6c5ce7'", "Body color, any CSS color."],
  ["faceColor", "face-color", "string", "auto", "Eyes and mouth. Auto-contrasts with the body."],
  ["cheekColor", "cheek-color", "string", "auto", "Blush. Derived from the body color."],
  ["size", "size", "number | string", "160", "px number or any CSS length."],
  ["speed", "speed", "number", "1", "Animation speed. 0 pauses."],
  ["followCursor", "follow-cursor", "boolean", "true", "Eyes, and slightly the body, follow the pointer."],
  ["interactive", "interactive", "boolean", "true", "Hover lift and a little reaction on click."],
  ["shadow", "shadow", "boolean", "true", "Soft ground shadow."],
  ["sound", "sound", "boolean", "false", "A short sound effect per mood, and when it first appears."],
  ["settle", "settle", "number", "0", "ms after a mood change when the body calms to gentle breathing; the expression stays. 0 = never."],
  ["settleMood", "settle-mood", "Mood", "—", "With settle: the mood to rest in once the time is up (face and body)."],
];

function Table({ rows, attr }: { rows: string[][]; attr: boolean }) {
  return (
    <div className="no-scrollbar overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-2 pr-4 font-normal">Prop</th>
            {attr && <th className="py-2 pr-4 font-normal">Attribute</th>}
            <th className="py-2 pr-4 font-normal">Type</th>
            <th className="py-2 pr-4 font-normal">Default</th>
            <th className="py-2 font-normal">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([prop, ...rest]) => (
            <tr key={prop} className="border-b border-line align-top">
              <td className="py-2.5 pr-4 font-mono text-[12.5px]">{prop}</td>
              {rest.slice(0, -1).map((cell, i) => (
                <td key={i} className="max-w-[180px] py-2.5 pr-4 font-mono text-[12.5px] text-muted">
                  {cell}
                </td>
              ))}
              <td className="py-2.5 text-muted">{rest[rest.length - 1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const PropsTable = () => <Table rows={PROPS} attr />;

const REACT_PROPS: [prop: string, type: string, def: string, desc: string][] = [
  ["poster", "string", "—", "Image shown until the first 3D frame."],
  ["loading", "'idle' | 'interaction' | 'eager'", "'idle'", "When three.js loads. 'interaction' waits for the first pointer, touch, key or scroll."],
  ["onMoodChange", "(detail) => void", "—", "Same as the moodchange event."],
  ["onReady", "() => void", "—", "The first 3D frame is on screen."],
];

export const ReactPropsTable = () => <Table rows={REACT_PROPS} attr={false} />;

export function MoodList() {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
      {MOODS.map((m) => (
        <li key={m} className="flex items-center gap-2 py-1">
          <Moodi
            mood={m}
            size={40}
            loading="interaction"
            poster={`/posters/mood-${m}.webp`}
            interactive={false}
            shadow={false}
            followCursor={false}
            aria-hidden
          />
          <div>
            <div className="font-mono text-[12.5px]">{m}</div>
            <div className="text-[12.5px] text-muted">{MOOD_INFO[m].description}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export const ShapeNames = () => <>{SHAPES.map((s) => SHAPE_LABELS[s]).join(", ")}</>;

export function Palettes() {
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {Object.entries(PALETTES).map(([name, c]) => (
        <span key={name} className="flex items-center gap-1.5 text-[13px] text-muted">
          <span className="size-3.5 rounded-full" style={{ background: c }} />
          {name} <span className="font-mono text-[12px] text-faint">{c}</span>
        </span>
      ))}
    </div>
  );
}
