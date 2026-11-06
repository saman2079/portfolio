"use client";

interface SegmentedProps<T extends string> {
  legend: string;
  name: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}

/** Radio group drawn as a segmented control. */
export function Segmented<T extends string>({ legend, name, options, labels, value, onChange }: SegmentedProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm text-paper-100">{legend}</legend>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-ink-950 p-1">
        {options.map((option) => (
          <label key={option} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="peer sr-only"
            />
            <span className="flex min-h-10 items-center justify-center rounded-md px-2 text-sm text-paper-300 transition-colors peer-checked:bg-signal/15 peer-checked:text-signal peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent-blue">
              {labels[option]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
