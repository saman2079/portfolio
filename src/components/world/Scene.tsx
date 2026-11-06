"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group, Points } from "three";
import { budgets } from "@/lib/three/capability";
import { hueColors } from "@/lib/lab/palette";
import { labStore, useLabState } from "@/lib/store/labStore";
import { CameraRig } from "./CameraRig";
import { ProjectNodes } from "./ProjectNodes";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Particles({ count }: { count: number }) {
  const lab = useLabState();
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const rand = mulberry32(2079);
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3.5 + rand() * 7;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      data[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      data[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      data[i * 3 + 2] = r * Math.cos(phi);
    }
    return data;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.018 * (labStore.get().speed / 100);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={hueColors[lab.hue]} size={lab.particleSize * 0.014} sizeAttenuation transparent opacity={0.75} depthWrite={false} />
    </points>
  );
}

function Core() {
  const lab = useLabState();
  const group = useRef<Group>(null);
  const { width } = useThree((state) => state.size);
  const mobile = width < 768;
  const color = hueColors[lab.hue];

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const speed = labStore.get().speed / 100;
    g.rotation.y += delta * 0.42 * speed;
    g.rotation.x += delta * 0.16 * speed;
    g.position.y = 0.12 + Math.sin(state.clock.elapsedTime * 0.55) * 0.08;
    const targetScale = mobile ? 0.68 : 0.92;
    const k = 1 - Math.exp(-delta * 2.8);
    g.scale.setScalar(g.scale.x + (targetScale - g.scale.x) * k);
  });

  return (
    <group ref={group} position={[0, 0.12, 0]}>
      <mesh>
        {lab.shape === "orb" && <icosahedronGeometry args={[1, 2]} />}
        {lab.shape === "ring" && <torusGeometry args={[1, 0.28, 16, 48]} />}
        {lab.shape === "prism" && <cylinderGeometry args={[0.95, 0.95, 1.7, 3]} />}
        <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.65 + (lab.light / 100) * 0.65} roughness={0.2} metalness={0.35} clearcoat={1} clearcoatRoughness={0.15} wireframe={lab.shape === "orb"} />
      </mesh>
      <mesh rotation={[0.9, 0.15, -0.35]}>
        <torusGeometry args={[1.34, 0.018, 8, 96]} />
        <meshBasicMaterial color="#A855F7" transparent opacity={0.95} />
      </mesh>
      <mesh rotation={[0.25, -0.55, 0.8]}>
        <torusGeometry args={[1.5, 0.012, 6, 96]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[1.1, 0.4, 0.2]}>
        <torusGeometry args={[1.68, 0.006, 5, 96]} />
        <meshBasicMaterial color="#D8B4FE" transparent opacity={0.62} />
      </mesh>
    </group>
  );
}

export function Scene({ tier, projectCount }: { tier: "high" | "low"; projectCount: number }) {
  const lab = useLabState();
  return (
    <>
      <ambientLight intensity={0.55 + (lab.light / 100) * 0.35} />
      <pointLight position={[3, 4, 5]} intensity={22 + lab.light * 0.55} color={hueColors[lab.hue]} />
      <pointLight position={[-4, -3, 1]} intensity={8} color="#7C3AED" />
      <Particles count={budgets[tier].particles} />
      <Core />
      <ProjectNodes count={projectCount} />
      <CameraRig />
    </>
  );
}
