"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { detectCapability } from "@/lib/three/capability";
import { useWorld, worldStore } from "@/lib/store/worldStore";

/**
 * three.js, R3F and drei live in a separate chunk. It is only requested after
 * the page is interactive and only when the device passed capability detection,
 * so the 2D path (reduced motion, no WebGL2, weak devices) never downloads it.
 */
const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false });

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

export function WorldRoot() {
  const world = useWorld();
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

  if (world.status !== "active") return null;

  return (
    <div
      aria-hidden
      data-ready={ready || undefined}
      className="world-layer pointer-events-none fixed inset-0"
    >
      <WorldCanvas tier={world.tier === "low" ? "low" : "high"} onReady={() => setReady(true)} />
    </div>
  );
}
