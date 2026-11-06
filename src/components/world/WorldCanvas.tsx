"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { budgets } from "@/lib/three/capability";
import { worldStore } from "@/lib/store/worldStore";
import { Scene } from "./Scene";

interface Props {
  tier: "high" | "low";
  projectCount: number;
  onReady: () => void;
}

export default function WorldCanvas({ tier, projectCount, onReady }: Props) {
  const [visible, setVisible] = useState(true);

  // Nothing renders while the tab is in the background.
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === "visible");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return (
    <Canvas
      frameloop={visible ? "always" : "never"}
      dpr={[1, budgets[tier].dpr]}
      camera={{ position: [0, 0, 7], fov: 50, near: 0.1, far: 60 }}
      gl={{
        antialias: tier === "high",
        alpha: true,
        powerPreference: tier === "high" ? "high-performance" : "low-power",
        stencil: false,
      }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          worldStore.fail("context-lost");
        });
        onReady();
      }}
    >
      {/* Sustained low FPS: drop to the low tier first, then to the 2D fallback. */}
      <PerformanceMonitor
        ms={250}
        iterations={6}
        flipflops={2}
        onDecline={() => worldStore.degrade()}
        onFallback={() => worldStore.fail("slow-frames")}
      />
      <Scene tier={tier} projectCount={projectCount} />
    </Canvas>
  );
}
