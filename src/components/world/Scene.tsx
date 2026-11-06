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
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
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
      <pointsMaterial color={hueColors[lab.hue]} size={lab.particleSize * 0.014} sizeAttenuation transparent opacity={0.78} depthWrite={false} />
    </points>
  );
}

function Satellite({ radius, angle, color, size }: { radius: number; angle: number; color: string; size: number }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const a = angle + state.clock.elapsedTime * 0.22;
    ref.current.position.set(Math.cos(a) * radius, Math.sin(a * 0.83) * 0.28, Math.sin(a) * radius * 0.62);
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <pointLight color={color} intensity={1.2} distance={1.3} />
    </group>
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
    g.rotation.y += delta * 0.19 * speed;
    g.rotation.x += delta * 0.055 * speed;
    g.position.y = 0.04 + Math.sin(state.clock.elapsedTime * 0.38) * 0.055;
    const targetScale = mobile ? 0.76 : 1.02;
    const k = 1 - Math.exp(-delta * 2.2);
    g.scale.setScalar(g.scale.x + (targetScale - g.scale.x) * k);
  });

  return (
    <group
      ref={group}
      position={[0, 0.04, 0]}
      onPointerDown={(event) => {
        event.stopPropagation();
        event.target.setPointerCapture(event.pointerId);
        document.documentElement.classList.add("core-is-dragging");
      }}
      onPointerMove={(event) => {
        if (event.buttons === 0) return;
        event.stopPropagation();
        if (group.current) {
          group.current.rotation.y += event.movementX * 0.009;
          group.current.rotation.x += event.movementY * 0.009;
        }
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        event.target.releasePointerCapture(event.pointerId);
        document.documentElement.classList.remove("core-is-dragging");
      }}
      onPointerCancel={() => document.documentElement.classList.remove("core-is-dragging")}
    >
      {/* Inner luminous planet: layered glass/metal rather than a flat wireframe. */}
      <mesh>
        {lab.shape === "ring" ? <torusGeometry args={[0.78, 0.24, 32, 96]} /> :
          lab.shape === "prism" ? <icosahedronGeometry args={[0.88, 1]} /> :
          <icosahedronGeometry args={[0.92, 4]} />}
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.32 + (lab.light / 100) * 0.42}
          roughness={0.24}
          metalness={0.72}
          clearcoat={1}
          clearcoatRoughness={0.08}
          transparent
          opacity={0.94}
        />
      </mesh>

      {/* Fine polygonal shell catches highlights around the planet. */}
      <mesh scale={1.025}>
        <icosahedronGeometry args={[0.92, 2]} />
        <meshBasicMaterial color="#B8C7FF" wireframe transparent opacity={0.19} />
      </mesh>

      {/* Glowing inner nucleus and soft atmospheric corona. */}
      <mesh scale={0.63}>
        <sphereGeometry args={[0.92, 48, 48]} />
        <meshBasicMaterial color="#D8F3FF" transparent opacity={0.09} />
      </mesh>
      <mesh scale={1.17}>
        <sphereGeometry args={[0.92, 48, 48]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.055} />
      </mesh>

      {/* Three orbital planes, each with a different tilt and material. */}
      <mesh rotation={[0.92, 0.18, -0.42]}>
        <torusGeometry args={[1.31, 0.014, 8, 160]} />
        <meshBasicMaterial color="#B68CFF" transparent opacity={0.92} />
      </mesh>
      <mesh rotation={[0.18, -0.72, 0.96]}>
        <torusGeometry args={[1.48, 0.009, 8, 160]} />
        <meshBasicMaterial color="#52DDF5" transparent opacity={0.86} />
      </mesh>
      <mesh rotation={[1.32, 0.48, 0.16]}>
        <torusGeometry args={[1.62, 0.004, 6, 160]} />
        <meshBasicMaterial color="#E6D7FF" transparent opacity={0.58} />
      </mesh>

      {/* Latitude/longitude technical tracers. */}
      {[0.42, 0.78, 1.12].map((r, i) => (
        <mesh key={r} rotation={[Math.PI / 2 + i * 0.22, i * 0.56, 0.18]}>
          <torusGeometry args={[r, 0.004, 5, 96]} />
          <meshBasicMaterial color={i === 1 ? "#7DEBFF" : "#C4B5FD"} transparent opacity={0.42} />
        </mesh>
      ))}

      <Satellite radius={1.34} angle={0.4} color="#F3D7FF" size={0.045} />
      <Satellite radius={1.52} angle={2.5} color="#66E5FF" size={0.032} />
      <Satellite radius={1.68} angle={4.7} color="#B794FF" size={0.025} />
    </group>
  );
}

export function Scene({ tier, projectCount }: { tier: "high" | "low"; projectCount: number }) {
  const lab = useLabState();
  return (
    <>
      <ambientLight intensity={0.42 + (lab.light / 100) * 0.24} />
      <pointLight position={[3, 4, 5]} intensity={18 + lab.light * 0.38} color={hueColors[lab.hue]} />
      <pointLight position={[-4, -3, 1]} intensity={11} color="#7C3AED" />
      <pointLight position={[0, 1, -3]} intensity={7} color="#38BDF8" />
      <Particles count={budgets[tier].particles} />
      <Core />
      <ProjectNodes count={projectCount} />
      <CameraRig />
    </>
  );
}
