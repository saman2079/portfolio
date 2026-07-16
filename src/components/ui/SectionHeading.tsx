interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

/**
 * The eyebrow is styled like a code comment ("// about") — a small, honest
 * nod to the subject matter rather than a decorative numbered marker.
 */
export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-sm text-accent-green">
        <span className="text-paper-500">//</span> {eyebrow}
      </p>
      <h2 className="mt-3 text-balance font-display text-display-md font-bold text-paper-100">
        {title}
      </h2>
      {description && <p className="mt-4 text-paper-300">{description}</p>}
    </div>
  );
}
