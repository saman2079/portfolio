"use client";

import { HUES, hueColors, type LabHue } from "@/lib/lab/palette";
import { cn } from "@/lib/utils";

interface SwatchesProps {
  legend: string;
  names: Record<LabHue, string>;
  value: LabHue;
  onChange: (hue: LabHue) => void;
}

/** Radio group drawn as colour chips. Arrow keys work natively. */
export function Swatches({ legend, names, value, onChange }: SwatchesProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm text-paper-100">{legend}</legend>
      <div className="flex flex-wrap gap-3">
        {HUES.map((hue) => (
          <label key={hue} className="relative cursor-pointer">
            <input
              type="radio"
              name="lab-hue"
              value={hue}
              checked={value === hue}
              onChange={() => onChange(hue)}
              className="peer sr-only"
            />
            <span className="sr-only">{names[hue]}</span>
            <span
              aria-hidden
              style={{ backgroundColor: hueColors[hue] }}
              className={cn(
                "block h-11 w-11 rounded-full border-2 border-transparent transition-transform",
                "peer-checked:scale-110 peer-checked:border-paper-100 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-blue"
              )}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
