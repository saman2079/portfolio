"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type Group } from "three";
import { hueColors } from "@/lib/lab/palette";
import { useLabState } from "@/lib/store/labStore";
import { sceneStore } from "@/lib/store/sceneStore";

const RADIUS = 4.2;

function Node({ index, count }: { index: number; count: number }) {
  const lab = useLabState();
  const group = useRef<Group>(null);

  // Fan the nodes across an arc behind the content.
  const spread = Math.min(Math.PI * 0.9, 0.5 * count);
  const angle = count === 1 ? 0 : -spread / 2 + (spread * index) / (count - 1);
  const base: [number, number, number] = [Math.sin(angle) * RADIUS, 0.4 + (index % 2) * 0.9 - 0.45, -1.5 - Math.cos(angle) * 1.2];

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const { section, focusedProject } = sceneStore.get();
    const inProjects = section === "projects";
    const focused = focusedProject === index;
    const target = !inProjects ? 0 : focused ? 1.5 : focusedProject === null ? 1 : 0.7;
    const k = 1 - Math.exp(-delta * 5);
    g.scale.setScalar(MathUtils.lerp(g.scale.x, target, k));
    g.visible = g.scale.x > 0.02;
    g.rotation.y += delta * (focused ? 1.6 : 0.5);
    g.position.y = base[1] + Math.sin(state.clock.elapsedTime * 0.8 + index) * 0.12;
  });

  const color = hueColors[lab.hue];
  return (
    <group ref={group} position={base} scale={0} visible={false}>
      <mesh>
        {index % 4 === 0 && <octahedronGeometry args={[0.45, 0]} />}
        {index % 4 === 1 && <icosahedronGeometry args={[0.42, 0]} />}
        {index % 4 === 2 && <boxGeometry args={[0.6, 0.6, 0.6]} />}
        {index % 4 === 3 && <tetrahedronGeometry args={[0.55, 0]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.5} wireframe />
      </mesh>
    </group>
  );
}

/** One node per real project; the card the visitor hovers in the page lights its node. */
export function ProjectNodes({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Node key={i} index={i} count={count} />
      ))}
    </>
  );
}
