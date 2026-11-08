"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { budgets } from "@/lib/three/capability";
import { worldStore } from "@/lib/store/worldStore";
import { UniverseScene, type UniverseLabels } from "./UniverseScene";

interface Props {
  tier: "high" | "low";
  /** false while the layer is hidden (scrolled away): the render loop stops. */
  active: boolean;
  labels: UniverseLabels;
  onReady: () => void;
}

export default function UniverseCanvas({ tier, active, labels, onReady }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === "visible");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return (
    <Canvas
      frameloop={visible && active ? "always" : "never"}
      dpr={[1, budgets[tier].dpr]}
      camera={{ position: [0, 0, 0], fov: 58, near: 0.05, far: 2500 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: tier === "high" ? "high-performance" : "low-power",
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          worldStore.fail("context-lost");
        });
      }}
    >
      <UniverseScene tier={tier} labels={labels} onReady={onReady} />
    </Canvas>
  );
}
