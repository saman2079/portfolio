"use client";

import type { CSSProperties } from "react";

interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

/** Native range input: free keyboard, touch and screen-reader support. */
export function Slider({ id, label, value, min, max, onChange }: SliderProps) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="text-paper-100">
          {label}
        </label>
        <output htmlFor={id} dir="ltr" className="font-mono text-xs text-signal">
          {value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        dir="ltr"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hud-range"
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
    </div>
  );
}
