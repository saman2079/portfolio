"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
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

  // Pause rendering only while the browser tab is hidden. Scrolling must never
  // unmount or downgrade the world: the core is a persistent page-wide object.
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
      camera={{ position: [0, 0, 7.4], fov: 42, near: 0.1, far: 60 }}
      gl={{
        antialias: tier === "high",
        alpha: true,
        powerPreference: tier === "high" ? "high-performance" : "low-power",
        stencil: false,
      }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (event) => {
          // Keep the rest of the page intact. Do not turn transient browser
          // lifecycle events or scroll-related frame dips into a permanent
          // world unmount.
          event.preventDefault();
          worldStore.fail("context-lost");
        });
        onReady();
      }}
    >
      <Scene tier={tier} projectCount={projectCount} />
    </Canvas>
  );
}
