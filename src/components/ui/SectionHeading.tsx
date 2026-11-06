interface SectionHeadingProps {
  /** Section number shown as "01", "02"… */
  index: number;
  eyebrow: string;
  title: string;
  description?: string;
}

export function SectionHeading({ index, eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="inline-flex items-center gap-3 text-xs text-signal">
        <span dir="ltr" className="font-mono text-paper-500">
          {String(index).padStart(2, "0")}
        </span>
        <span aria-hidden className="h-px w-8 bg-signal/50" />
        <span className="font-semibold tracking-wide">{eyebrow}</span>
      </p>
      <h2 className="mt-3 text-balance font-display text-display-md font-bold text-paper-100">{title}</h2>
      {description && <p className="mt-4 leading-relaxed text-paper-300">{description}</p>}
    </div>
  );
}
