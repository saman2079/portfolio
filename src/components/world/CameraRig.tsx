"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils } from "three";

/** A stable camera prevents the persistent core from drifting out of the viewport. */
export function CameraRig() {
  const pointer = useRef({ x: 0, y: 0 });
  const mobile = useThree((state) => state.size.width < 768);

  useFrame(({ camera }, delta) => {
    const k = 1 - Math.exp(-delta * 2.4);
    const targetX = mobile ? 0 : pointer.current.x * 0.12;
    const targetY = mobile ? 0 : pointer.current.y * -0.08;
    camera.position.x = MathUtils.lerp(camera.position.x, targetX, k);
    camera.position.y = MathUtils.lerp(camera.position.y, targetY, k);
    camera.position.z = MathUtils.lerp(camera.position.z, 7.4, k);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
