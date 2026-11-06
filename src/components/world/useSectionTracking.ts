"use client";

import { useEffect } from "react";
import { SECTION_IDS, sceneStore, type SectionId } from "@/lib/store/sceneStore";

/** Mirrors the section under the reading line into the scene store (no scroll handler). */
export function useSectionTracking(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const targets = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) sceneStore.setSection(entry.target.id as SectionId);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enabled]);
}
