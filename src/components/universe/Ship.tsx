"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import type { Group, PerspectiveCamera as ThreePerspectiveCamera } from "three";
import { Cockpit } from "./Cockpit";

/**
 * The ship is a group: the cockpit is fixed inside it and the pilot's head (the
 * camera) can turn. Later phases move the whole group along the flight path.
 */
export function Ship() {
  const head = useRef<Group>(null);
  const camera = useRef<ThreePerspectiveCamera>(null);

  useFrame((state, delta) => {
    const g = head.current;
    if (!g) return;
    const k = 1 - Math.exp(-delta * 3);
    // a gentle look-around that follows the pointer; phase 3 adds drag-to-look
    g.rotation.y += (-state.pointer.x * 0.1 - g.rotation.y) * k;
    g.rotation.x += (state.pointer.y * 0.05 - g.rotation.x) * k;
    g.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.004;

    const cam = camera.current;
    if (cam) {
      const fov = state.size.width / state.size.height < 0.8 ? 74 : 58;
      if (Math.abs(cam.fov - fov) > 0.01) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
      }
    }
  });

  return (
    <group name="ship">
      <Cockpit />
      <group ref={head}>
        <PerspectiveCamera ref={camera} makeDefault fov={58} near={0.05} far={2500} />
      </group>
    </group>
  );
}
