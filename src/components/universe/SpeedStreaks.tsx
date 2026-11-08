"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  type LineBasicMaterial,
  type LineSegments,
} from "three";
import { mulberry32 } from "@/lib/universe/random";
import { flightLive } from "@/lib/store/flightStore";

const W = 36;
const wrap = (v: number) => ((((v + W) % (2 * W)) + 2 * W) % (2 * W)) - W;

/**
 * Space dust that streaks past the windshield. Invisible at rest; the faster the
 * ship goes, the longer and brighter the streaks, which is what sells the speed.
 */
export function SpeedStreaks({ count }: { count: number }) {
  const lines = useRef<LineSegments>(null);

  const { geometry, dust } = useMemo(() => {
    const rand = mulberry32(31);
    const dust = new Float32Array(count * 3);
    const positions = new Float32Array(count * 6);
    const colors = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      let x = 0;
      let y = 0;
      let z = 0;
      do {
        x = (rand() * 2 - 1) * W;
        y = (rand() * 2 - 1) * W * 0.7;
        z = (rand() * 2 - 1) * W;
      } while (Math.hypot(x, y, z) < 3.5);
      dust[i * 3] = x;
      dust[i * 3 + 1] = y;
      dust[i * 3 + 2] = z;
      const b = 0.5 + rand() * 0.9;
      // head bright, tail black: additive blending turns that into a fading streak
      colors[i * 6] = 0.6 * b;
      colors[i * 6 + 1] = 1.1 * b;
      colors[i * 6 + 2] = 1.9 * b;
    }
    const geometry = new BufferGeometry();
    const pos = new BufferAttribute(positions, 3);
    pos.setUsage(DynamicDrawUsage);
    geometry.setAttribute("position", pos);
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    return { geometry, dust };
  }, [count]);

  useFrame((_, delta) => {
    const l = lines.current;
    if (!l) return;
    const s = flightLive.speedNorm;
    l.visible = s > 0.015;
    if (!l.visible) return;

    const dt = Math.min(delta, 0.05);
    const [vx, vy, vz] = flightLive.vLocal;
    const tau = Math.min(0.09, 0.03 + s * 0.07);
    const pos = geometry.getAttribute("position") as BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < count; i++) {
      // the dust moves opposite to the ship's own velocity
      const x = wrap(dust[i * 3]! - vx * dt);
      const y = wrap(dust[i * 3 + 1]! - vy * dt);
      const z = wrap(dust[i * 3 + 2]! - vz * dt);
      dust[i * 3] = x;
      dust[i * 3 + 1] = y;
      dust[i * 3 + 2] = z;
      arr[i * 6] = x;
      arr[i * 6 + 1] = y;
      arr[i * 6 + 2] = z;
      arr[i * 6 + 3] = x + vx * tau;
      arr[i * 6 + 4] = y + vy * tau;
      arr[i * 6 + 5] = z + vz * tau;
    }
    pos.needsUpdate = true;
    (l.material as LineBasicMaterial).opacity = Math.min(1, s * 2);
  });

  return (
    <lineSegments ref={lines} geometry={geometry} frustumCulled={false} visible={false}>
      <lineBasicMaterial vertexColors transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </lineSegments>
  );
}
