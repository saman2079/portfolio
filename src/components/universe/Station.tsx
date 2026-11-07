"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Group } from "three";

const ORANGE = new Color(3.2, 1.3, 0.25);
const CYAN = new Color(0.3, 1.6, 2.4);
const metal = { color: "#8e98a8", metalness: 0.85, roughness: 0.38 } as const;

/** Distant orbital station: spine, rotating habitat ring, solar wings and beacon lights. */
export function Station() {
  const ring = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.12;
  });

  return (
    <group position={[-40, 17, -70]} rotation={[0.25, 0.7, -0.18]} scale={1.2}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.7, 0.7, 16, 24]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[8.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.9, 1.8, 24]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[-8.3, 0, 0]}>
        <sphereGeometry args={[1.15, 24, 16]} />
        <meshStandardMaterial {...metal} />
      </mesh>

      <group ref={ring} position={[2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <torusGeometry args={[5.5, 0.45, 12, 64]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const a = (k * Math.PI) / 3;
          return (
            <mesh key={k} position={[Math.cos(a) * 2.75, Math.sin(a) * 2.75, 0]} rotation={[0, 0, a - Math.PI / 2]}>
              <boxGeometry args={[0.18, 5.4, 0.18]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          );
        })}
        {[0, 1, 2, 3].map((k) => {
          const a = (k * Math.PI) / 2 + 0.4;
          return (
            <mesh key={k} position={[Math.cos(a) * 5.95, Math.sin(a) * 5.95, 0]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshBasicMaterial color={k % 2 ? CYAN : ORANGE} toneMapped={false} />
            </mesh>
          );
        })}
      </group>

      {[-1, 1].map((side) => (
        <mesh key={side} position={[-5.4, 0, side * 2.7]}>
          <boxGeometry args={[4, 0.06, 1.7]} />
          <meshStandardMaterial color="#10224a" emissive="#0b2a66" emissiveIntensity={0.6} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[9.5, 0, 0]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshBasicMaterial color={ORANGE} toneMapped={false} />
      </mesh>
    </group>
  );
}
