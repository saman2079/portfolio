"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { IcosahedronGeometry, Object3D, type InstancedMesh } from "three";
import { mulberry32 } from "@/lib/universe/random";

function rockGeometry() {
  const geo = new IcosahedronGeometry(1, 2);
  const pos = geo.attributes.position;
  if (pos) {
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      // deterministic per position, so duplicated vertices of the flat-shaded faces move together
      const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
      const k = 0.72 + (n - Math.floor(n)) * 0.5;
      pos.setXYZ(i, x * k, y * k * 0.9, z * k);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export function Asteroids({ count }: { count: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const { geometry, items } = useMemo(() => {
    const rand = mulberry32(77);
    const list = Array.from({ length: count }, () => {
      let x = 0;
      let y = 0;
      let z = 0;
      do {
        x = (rand() - 0.5) * 130;
        y = (rand() - 0.5) * 50;
        z = -6 - rand() * 130;
      } while (Math.hypot(x, y, z) < 9); // keep clear of the cockpit
      return {
        x,
        y,
        z,
        s: 0.12 + Math.pow(rand(), 3.2) * 1.7,
        rx: rand() * 6.28,
        ry: rand() * 6.28,
        vx: (rand() - 0.5) * 0.25,
        vy: (rand() - 0.5) * 0.25,
      };
    });
    return { geometry: rockGeometry(), items: list };
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    items.forEach((a, i) => {
      dummy.position.set(a.x, a.y + Math.sin(t * 0.2 + i) * 0.15, a.z);
      dummy.rotation.set(a.rx + t * a.vx, a.ry + t * a.vy, 0);
      dummy.scale.setScalar(a.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial color="#6b6258" roughness={0.95} metalness={0.05} flatShading />
    </instancedMesh>
  );
}
