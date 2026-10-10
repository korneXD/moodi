"use client";

import { useId, type ReactNode } from "react";

export function Row({ label, value, children }: { label: string; value?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="text-muted">{label}</span>
        {value !== undefined && <span className="text-fg">{value}</span>}
      </div>
      {children}
    </div>
  );
}

interface SwatchesProps {
  label: string;
  value: string | undefined;
  options: { name: string; color: string }[];
  onChange: (color: string | undefined) => void;
  /** show an "Auto" chip that maps to `undefined` */
  auto?: boolean;
  /** color the custom picker starts from */
  pickerBase: string;
}

export function Swatches({ label, value, options, onChange, auto, pickerBase }: SwatchesProps) {
  const id = useId();
  const isCustom = value !== undefined && !options.some((o) => o.color === value);
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-[7px] max-lg:gap-[5px]">
      {auto && (
        <button
          type="button"
          role="radio"
          aria-checked={value === undefined}
          onClick={() => onChange(undefined)}
          className={`press h-[22px] rounded-full px-2.5 text-[11.5px] leading-none ${
            value === undefined ? "bg-chip-strong text-fg" : "text-muted hover:text-fg"
          }`}
        >
          Auto
        </button>
      )}
      {options.map((o) => {
        const active = value === o.color;
        return (
          <button
            key={o.color}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.name}
            title={o.name}
            onClick={() => onChange(o.color)}
            className="press relative grid size-[22px] place-items-center rounded-full"
          >
            <span
              className="size-[18px] rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]"
              style={{ background: o.color }}
            />
            <span
              className={`absolute inset-0 rounded-full ring-[1.5px] ring-fg transition-opacity duration-150 ${
                active ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>
        );
      })}
      <label
        htmlFor={id}
        title="Custom color"
        className="press relative grid size-[22px] cursor-pointer place-items-center rounded-full"
      >
        <span
          className="size-[18px] rounded-full"
          style={{
            background: isCustom
              ? value
              : "conic-gradient(from 90deg, #ff8a8a, #ffd36e, #a6e39b, #7fd3f2, #b39cf5, #f59ad6, #ff8a8a)",
          }}
        />
        <span
          className={`absolute inset-0 rounded-full ring-[1.5px] ring-fg transition-opacity duration-150 ${
            isCustom ? "opacity-100" : "opacity-0"
          }`}
        />
        <input
          id={id}
          type="color"
          aria-label={`Custom ${label.toLowerCase()} color`}
          value={value ?? pickerBase}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode; aria?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-chip p-[3px]">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          aria-label={o.aria}
          onClick={() => onChange(o.value)}
          className={`flex h-7 flex-1 items-center justify-center rounded-md text-[12px] tabular-nums transition-colors duration-150 ${
            value === o.value ? "bg-chip-strong text-fg" : "text-muted hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span id={id} className="text-muted">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className={`relative block h-[18px] w-[30px] shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-accent" : "bg-chip-strong"
        }`}
      >
        <span
          className={`absolute left-[2px] top-[2px] block size-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-soft ${
            checked ? "translate-x-[12px]" : "translate-x-0 opacity-80"
          }`}
        />
      </button>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="range h-7 w-full cursor-pointer"
      style={{ ["--pct" as string]: `${pct}%` }}
    />
  );
}
