"use client";

import type { MotionValue } from "framer-motion";
import { FileCode2, FolderGit2, Search, Settings2 } from "lucide-react";
import { TypewriterCode } from "./TypewriterCode";
import { codeSnippet } from "./codeSnippet";

interface CodeEditorScreenProps {
  typingProgress: MotionValue<number>;
}

const sidebarIcons = [FileCode2, Search, FolderGit2, Settings2];

/**
 * A hand-built approximation of a VS Code window — title bar, activity bar,
 * a "file" tab, and the typewriter code area. This is the payoff the whole
 * laptop-opening scroll animation is building toward.
 */
export function CodeEditorScreen({ typingProgress }: CodeEditorScreenProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[6px] bg-ink-900 text-left">
      {/* title bar */}
      <div className="flex items-center gap-1.5 bg-ink-800 px-3 py-2">
        <span className="editor-dot bg-accent-red/70" />
        <span className="editor-dot bg-accent-amber/70" />
        <span className="editor-dot bg-accent-green/70" />
        <span className="ml-2 truncate font-mono text-[10px] text-paper-500 sm:text-[11px]">
          about-me.ts — portfolio
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* activity bar */}
        <div className="hidden w-10 flex-col items-center gap-4 border-r border-ink-600 bg-ink-950 py-3 sm:flex">
          {sidebarIcons.map((Icon, i) => (
            <Icon key={i} size={16} className={i === 0 ? "text-accent-blue" : "text-paper-500"} />
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* tab */}
          <div className="flex items-center gap-1.5 border-b border-ink-600 bg-ink-900 px-3 py-1.5">
            <div className="flex items-center gap-1.5 border-r border-ink-600 pr-3 font-mono text-[10px] text-paper-100 sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
              about-me.ts
            </div>
          </div>

          {/* code area */}
          <div className="min-h-0 flex-1 overflow-hidden bg-ink-900 p-3 sm:p-4">
            <TypewriterCode lines={codeSnippet} progress={typingProgress} />
          </div>
        </div>
      </div>
    </div>
  );
}
