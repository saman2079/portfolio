"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import { SECTION_IDS, sceneStore } from "@/lib/store/sceneStore";

/**
 * Camera follows page scroll (dolly + slight descent) and the pointer (parallax).
 * Scroll progress is measured in an event handler, never per frame, so the render
 * loop does no layout reads.
 */
export function CameraRig() {
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
    };
    const onPointer = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  useFrame(({ camera }, delta) => {
    const k = 1 - Math.exp(-delta * 3); // frame-rate independent smoothing
    // A gentle sideways drift per section so each part of the page is seen from a new angle.
    const idx = SECTION_IDS.indexOf(sceneStore.get().section);
    const targetX = pointer.current.x * 0.5 + Math.sin(idx * 0.9) * 0.9;
    const targetY = -pointer.current.y * 0.3 - progress.current * 1.4;
    const targetZ = 7 + progress.current * 2.5;
    camera.position.x = MathUtils.lerp(camera.position.x, targetX, k);
    camera.position.y = MathUtils.lerp(camera.position.y, targetY, k);
    camera.position.z = MathUtils.lerp(camera.position.z, targetZ, k);
    camera.lookAt(0, -progress.current * 0.8, 0);
  });

  return null;
}
