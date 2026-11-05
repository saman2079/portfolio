import { cn } from "@/lib/utils";

interface EditorChromeProps {
  fileName: string;
  className?: string;
}

/** Title bar of a fake code editor window, shared by cards across the page. Always LTR. */
export function EditorChrome({ fileName, className }: EditorChromeProps) {
  return (
    <div
      dir="ltr"
      className={cn("flex items-center gap-2 border-b border-ink-600 bg-ink-800/80 px-3 py-2", className)}
    >
      <div className="flex gap-1.5">
        <span className="editor-dot bg-accent-red/70" />
        <span className="editor-dot bg-accent-amber/70" />
        <span className="editor-dot bg-accent-green/70" />
      </div>
      <div className="ml-2 flex items-center gap-1.5 rounded-t-sm border-x border-t border-ink-600 bg-ink-900 px-3 py-1 font-mono text-[11px] text-paper-300">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
        {fileName}
      </div>
    </div>
  );
}
