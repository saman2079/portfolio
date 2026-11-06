import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WindowProps {
  /** File-name style title shown in the title bar, e.g. "skills.config.ts". */
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Optional small status text on the far end of the title bar. */
  status?: string;
}

/**
 * The base surface of the OS shell: a title bar (always LTR, like a real
 * editor) plus HUD corner brackets. Server-renderable; no state.
 */
export function Window({ title, children, className, bodyClassName, status }: WindowProps) {
  return (
    <div className={cn("os-window hud-corners", className)}>
      <div dir="ltr" className="flex items-center gap-2 border-b border-white/10 bg-ink-800/70 px-3 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="editor-dot bg-accent-red/70" />
          <span className="editor-dot bg-accent-amber/70" />
          <span className="editor-dot bg-accent-green/70" />
        </div>
        <span className="ml-2 truncate font-mono text-[11px] text-paper-300">{title}</span>
        {status && <span className="ml-auto shrink-0 font-mono text-[10px] text-signal/80">{status}</span>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
