"use client";

import { useState } from "react";
import { Moodi, MOOD_INFO, MOODS, PALETTES, SHAPE_LABELS, SHAPES } from "moodi/react";

/** Every shape × mood, for eyeballing the whole matrix at once. */
export function Lab() {
  const [color, setColor] = useState(PALETTES.Peach);
  return (
    <div className="min-h-dvh p-6">
      <div className="mb-4 flex gap-2">
        {Object.entries(PALETTES).map(([name, c]) => (
          <button key={name} onClick={() => setColor(c)} className="rounded px-2 py-1 text-xs bg-chip">
            {name}
          </button>
        ))}
      </div>
      <table className="border-separate border-spacing-1 text-[11px] text-muted">
        <thead>
          <tr>
            <th />
            {MOODS.map((m) => (
              <th key={m} className="font-normal">{MOOD_INFO[m].label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHAPES.map((s) => (
            <tr key={s}>
              <th className="pr-2 text-right font-normal">{SHAPE_LABELS[s]}</th>
              {MOODS.map((m) => (
                <td key={m}>
                  <Moodi shape={s} mood={m} color={color} size={104} followCursor={false} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
