"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { detectCapability } from "@/lib/three/capability";
import { useWorld, worldStore } from "@/lib/store/worldStore";
import { useSceneState } from "@/lib/store/sceneStore";
import { useSectionTracking } from "./useSectionTracking";

const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false });
type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };

export function WorldRoot({ projectCount }: { projectCount: number }) {
  const world = useWorld();
  const scene = useSceneState();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as IdleWindow;
    const run = () => worldStore.resolve(detectCapability());
    if (w.requestIdleCallback && w.cancelIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 2000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(run, 600);
    return () => window.clearTimeout(id);
  }, []);
  useSectionTracking(world.status === "active");
  if (world.status !== "active") return null;
  return <div aria-hidden data-ready={ready || undefined} data-section={scene.section} className="world-layer fixed inset-0"><div className="world-stage"><WorldCanvas tier={world.tier === "low" ? "low" : "high"} projectCount={projectCount} onReady={() => setReady(true)} /></div></div>;
}
