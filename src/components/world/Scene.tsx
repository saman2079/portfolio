"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group, Points } from "three";
import { budgets } from "@/lib/three/capability";
import { hueColors } from "@/lib/lab/palette";
import { labStore, useLabState } from "@/lib/store/labStore";
import { sceneStore, type SectionId } from "@/lib/store/sceneStore";
import { CameraRig } from "./CameraRig";
import { ProjectNodes } from "./ProjectNodes";

/** Deterministic PRNG so the field is identical on every load (no flicker between tiers). */
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
      // Points on a shell between radius 4 and 11 around the origin.
      const r = 4 + rand() * 7;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      data[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      data[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      data[i * 3 + 2] = r * Math.cos(phi);
    }
    return data;
  }, [count]);

  useFrame((_, delta) => {
    const points = ref.current;
    if (!points) return;
    points.rotation.y += delta * 0.02 * (labStore.get().speed / 100);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color={hueColors[lab.hue]}
        size={lab.particleSize * 0.014}
        sizeAttenuation
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
}

/** Where the core sits and how big it is for each section (wide screens). */
const corePose: Record<SectionId, { x: number; y: number; s: number }> = {
  top: { x: 2.6, y: 0, s: 1 },
  about: { x: -3.2, y: 0.2, s: 0.8 },
  lab: { x: 0, y: 0, s: 1.5 },
  experience: { x: 3.2, y: 0, s: 0.7 },
  skills: { x: -3.2, y: -0.2, s: 0.8 },
  projects: { x: 0, y: 2.2, s: 0.55 },
  contact: { x: 0, y: 0.4, s: 1.1 },
};

function Core() {
  const lab = useLabState();
  const group = useRef<Group>(null);
  const size = useThree((s) => s.size);
  const wide = size.width >= 900;
  const color = hueColors[lab.hue];

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const speed = labStore.get().speed / 100;
    g.rotation.y += delta * 0.6 * speed;
    g.rotation.x += delta * 0.25 * speed;

    // Glide to the pose of the current section; narrow screens tuck the core above the text.
    const pose = corePose[sceneStore.get().section];
    const k = 1 - Math.exp(-delta * 2.5);
    const tx = wide ? pose.x : 0;
    const ty = wide ? pose.y : 1.6;
    const ts = wide ? pose.s : Math.min(pose.s, 0.9);
    g.position.x += (tx - g.position.x) * k;
    g.position.y += (ty - g.position.y) * k;
    g.position.z += (-1 - g.position.z) * k;
    g.scale.setScalar(g.scale.x + (ts - g.scale.x) * k);
  });

  return (
    <group ref={group} position={[2.6, 0, 0]}>
      <mesh>
        {lab.shape === "orb" && <icosahedronGeometry args={[1, 2]} />}
        {lab.shape === "ring" && <torusGeometry args={[1, 0.28, 16, 48]} />}
        {lab.shape === "prism" && <cylinderGeometry args={[0.95, 0.95, 1.7, 3]} />}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.15 + (lab.light / 100) * 0.5}
          roughness={0.4}
          metalness={0.2}
          wireframe={lab.shape === "orb"}
        />
      </mesh>
    </group>
  );
}

export function Scene({ tier, projectCount }: { tier: "high" | "low"; projectCount: number }) {
  const lab = useLabState();

  return (
    <>
      <ambientLight intensity={0.25 + (lab.light / 100) * 0.35} />
      <pointLight position={[4, 3, 5]} intensity={20 + lab.light * 0.6} color={hueColors[lab.hue]} />
      <Particles count={budgets[tier].particles} />
      <Core />
      <ProjectNodes count={projectCount} />
      <CameraRig />
    </>
  );
}
