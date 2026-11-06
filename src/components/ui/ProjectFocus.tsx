"use client";

import type { ReactNode } from "react";
import { sceneStore } from "@/lib/store/sceneStore";

/** Lets the 3D world light the node that matches the card being hovered or focused. */
export function ProjectFocus({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div
      className="h-full"
      onMouseEnter={() => sceneStore.focusProject(index)}
      onMouseLeave={() => sceneStore.focusProject(null)}
      onFocus={() => sceneStore.focusProject(index)}
      onBlur={() => sceneStore.focusProject(null)}
    >
      {children}
    </div>
  );
}
