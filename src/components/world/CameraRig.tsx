"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils } from "three";
import { SECTION_IDS, sceneStore } from "@/lib/store/sceneStore";

/**
 * Desktop camera follows the page with a restrained dolly and parallax.
 * On phones the camera stays composition-locked: the 3D core must remain
 * in view while the visitor scrolls through the long page.
 */
export function CameraRig() {
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const width = useThree((state) => state.size.width);
  const mobile = width < 768;

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
    const k = 1 - Math.exp(-delta * 3);
    const idx = SECTION_IDS.indexOf(sceneStore.get().section);

    if (mobile) {
      // Keep the camera almost fixed on mobile; only a tiny section drift remains.
      const targetX = Math.sin(idx * 0.65) * 0.12 + pointer.current.x * 0.035;
      const targetY = 0.05 - pointer.current.y * 0.025;
      const targetZ = 7.4;
      camera.position.x = MathUtils.lerp(camera.position.x, targetX, k);
      camera.position.y = MathUtils.lerp(camera.position.y, targetY, k);
      camera.position.z = MathUtils.lerp(camera.position.z, targetZ, k);
      camera.lookAt(0, 0.15, 0);
      return;
    }

    const targetX = pointer.current.x * 0.5 + Math.sin(idx * 0.9) * 0.9;
    const targetY = -pointer.current.y * 0.3 - progress.current * 1.0;
    const targetZ = 7 + progress.current * 1.2;
    camera.position.x = MathUtils.lerp(camera.position.x, targetX, k);
    camera.position.y = MathUtils.lerp(camera.position.y, targetY, k);
    camera.position.z = MathUtils.lerp(camera.position.z, targetZ, k);
    camera.lookAt(0, -progress.current * 0.55, 0);
  });

  return null;
}
