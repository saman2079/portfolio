"use client";

import { useEffect, useState } from "react";
import { type MotionValue, useMotionValueEvent, useTransform } from "framer-motion";

export interface CodeToken {
  text: string;
  className?: string;
}

export type CodeLine = CodeToken[];

interface TypewriterCodeProps {
  lines: CodeLine[];
  /** 0 -> nothing revealed, 1 -> full snippet revealed. */
  progress: MotionValue<number>;
}

const totalChars = (lines: CodeLine[]) =>
  lines.reduce((sum, line) => sum + line.reduce((s, t) => s + t.text.length, 0) + 1, 0);

/** Slices a single line's tokens down to `remaining` characters, in order. */
function sliceLine(line: CodeLine, remaining: number) {
  const nodes: React.ReactNode[] = [];
  let budget = remaining;

  for (const [i, token] of line.entries()) {
    if (budget <= 0) break;
    const slice = token.text.slice(0, budget);
    nodes.push(
      <span key={i} className={token.className}>
        {slice}
      </span>
    );
    budget -= token.text.length;
  }

  const lineLength = line.reduce((s, t) => s + t.text.length, 0);
  return { nodes, consumed: Math.min(remaining, lineLength) + 1 };
}

export function TypewriterCode({ lines, progress }: TypewriterCodeProps) {
  const characterCount = useTransform(progress, [0, 1], [0, totalChars(lines)]);
  const [revealed, setRevealed] = useState(0);

  useMotionValueEvent(characterCount, "change", (latest) => {
    const rounded = Math.round(latest);
    setRevealed((prev) => (prev === rounded ? prev : rounded));
  });

  // Ensure the very first paint (before any scroll listener fires) is correct.
  useEffect(() => {
    setRevealed(Math.round(characterCount.get()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let remaining = revealed;
  let cursorPlaced = false;

  return (
    <pre className="overflow-hidden font-mono text-[11px] leading-relaxed sm:text-[12px] md:text-[13px]">
      <code>
        {lines.map((line, i) => {
          const budgetBeforeLine = remaining;
          const { nodes, consumed } = sliceLine(line, remaining);
          remaining = Math.max(0, remaining - consumed);
          const showCursorHere = !cursorPlaced && budgetBeforeLine > 0 && remaining === 0;
          if (showCursorHere) cursorPlaced = true;

          return (
            <div key={i} className="flex">
              <span className="mr-4 select-none text-paper-500/50">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                {nodes}
                {showCursorHere && (
                  <span className="ml-px inline-block h-[1em] w-[2px] animate-blink bg-accent-blue align-middle" />
                )}
              </span>
            </div>
          );
        })}
      </code>
    </pre>
  );
}
