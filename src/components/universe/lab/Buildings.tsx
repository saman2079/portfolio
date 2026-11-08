"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Group } from "three";

export const HUES = ["#fb923c", "#facc15", "#3b82f6", "#22d3ee", "#2dd4bf", "#f472b6", "#f87171", "#4ade80", "#a78bfa"];
const body = { color: "#141a26", metalness: 0.85, roughness: 0.4 } as const;

/**
 * Procedural buildings, one archetype per skill. The skill's level (1-5) sets how tall/large
 * the building is, so the base is a literal picture of the stack.
 */
export function Building({ kind, level }: { kind: number; level: number }) {
  const k = kind % 9;
  const hue = HUES[k] ?? "#22d3ee";
  const glow = useMemo(() => new Color(hue).multiplyScalar(2.4), [hue]);
  const L = Math.max(1, Math.min(5, level));
  const H = 0.9 + L * 0.45;
  const spinA = useRef<Group>(null);
  const spinB = useRef<Group>(null);
  useFrame((_, dt) => {
    if (spinA.current) spinA.current.rotation.y += dt * 0.9;
    if (spinB.current) spinB.current.rotation.z += dt * 1.4;
  });

  return (
    <group>
      {/* shared pad */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[1.35, 1.45, 0.12, 28]} />
        <meshStandardMaterial {...body} />
      </mesh>
      <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.28, 1.34, 40]} />
        <meshBasicMaterial color={glow} toneMapped={false} />
      </mesh>

      <group position={[0, 0.12, 0]}>
        {k === 0 && (
          <>
            <mesh position={[0, (H * 0.7) / 2, 0]}>
              <boxGeometry args={[2.3, H * 0.7, 2.3]} />
              <meshStandardMaterial {...body} />
            </mesh>
            <mesh position={[0, H * 0.7 + 0.06, 0]}>
              <boxGeometry args={[2.5, 0.12, 2.5]} />
              <meshStandardMaterial color="#2a3346" metalness={0.8} roughness={0.35} />
            </mesh>
            <mesh position={[0, H * 0.4, 1.16]}>
              <boxGeometry args={[1.7, 0.12, 0.04]} />
              <meshBasicMaterial color={glow} toneMapped={false} />
            </mesh>
            <mesh position={[0, H * 0.7 - 0.05, 0]}>
              <boxGeometry args={[2.34, 0.05, 2.34]} />
              <meshBasicMaterial color={glow} toneMapped={false} />
            </mesh>
          </>
        )}
        {k === 1 && (
          <>
            <mesh position={[0, H / 2, 0]}>
              <cylinderGeometry args={[0.85, 0.95, H, 20]} />
              <meshStandardMaterial {...body} />
            </mesh>
            <mesh position={[0, H * 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.92, 0.05, 8, 40]} />
              <meshBasicMaterial color={glow} toneMapped={false} />
            </mesh>
            <mesh position={[0, H + 0.4, 0]}>
              <sphereGeometry args={[0.45, 20, 14]} />
              <meshBasicMaterial color={glow} toneMapped={false} />
            </mesh>
          </>
        )}
        {k === 2 && (
          <>
            <mesh position={[0, (H * 1.3) / 2, 0]}>
              <cylinderGeometry args={[0.55, 0.8, H * 1.3, 6]} />
              <meshStandardMaterial {...body} />
            </mesh>
            <group ref={spinA} position={[0, H * 1.3 + 0.8, 0]}>
              <mesh scale={[0.5, 0.8, 0.5]}>
                <octahedronGeometry args={[1, 0]} />
                <meshBasicMaterial color={glow} toneMapped={false} />
              </mesh>
            </group>
          </>
        )}
        {k === 3 && (
          <>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[1.0, 1.1, 0.5, 24]} />
              <meshStandardMaterial {...body} />
            </mesh>
            <mesh position={[0, 0.5 + H * 0.5, 0]}>
              <sphereGeometry args={[0.35 + L * 0.06, 24, 16]} />
              <meshBasicMaterial color={glow} toneMapped={false} />
            </mesh>
            <group position={[0, 0.5 + H * 0.5, 0]}>
              <group ref={spinB} rotation={[1.1, 0.2, 0]}>
                <mesh>
                  <torusGeometry args={[0.95, 0.035, 6, 56]} />
                  <meshBasicMaterial color={glow} toneMapped={false} />
                </mesh>
              </group>
              <group ref={spinA} rotation={[0.3, 0, 0.5]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[1.2, 0.03, 6, 64]} />
                  <meshBasicMaterial color={glow} toneMapped={false} />
                </mesh>
              </group>
            </group>
          </>
        )}
        {k === 4 && (
          <>
            <mesh position={[0, H / 2, 0]}>
              <cylinderGeometry args={[0.1, 0.16, H, 10]} />
              <meshStandardMaterial {...body} />
            </mesh>
            <group ref={spinA} position={[0, H, 0]}>
              <mesh rotation={[-2.3, 0, 0]}>
                <sphereGeometry args={[0.95, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
                <meshStandardMaterial color="#2a3346" metalness={0.8} roughness={0.35} side={2} />
              </mesh>
              <mesh position={[0, 0.5, -0.4]}>
                <sphereGeometry args={[0.1, 10, 8]} />
                <meshBasicMaterial color={glow} toneMapped={false} />
              </mesh>
            </group>
          </>
        )}
        {k === 5 &&
          Array.from({ length: L }, (_, i) => (
            <group key={i} position={[0, 0.3 + i * 0.52, 0]}>
              <mesh>
                <cylinderGeometry args={[0.92 - i * 0.06, 0.95 - i * 0.06, 0.48, 20]} />
                <meshStandardMaterial {...body} />
              </mesh>
              <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.93 - i * 0.06, 0.03, 6, 40]} />
                <meshBasicMaterial color={glow} toneMapped={false} />
              </mesh>
            </group>
          ))}
        {k === 6 &&
          [-0.7, 0, 0.7].map((x, i) => {
            const h = H * (0.5 + ((i + L) % 3) * 0.3);
            return (
              <group key={i} position={[x, 0, i === 1 ? 0.3 : -0.2]}>
                <mesh position={[0, h / 2, 0]}>
                  <cylinderGeometry args={[0.13, 0.16, h, 8]} />
                  <meshStandardMaterial {...body} />
                </mesh>
                <mesh position={[0, h + 0.15, 0]}>
                  <sphereGeometry args={[0.24, 14, 10]} />
                  <meshBasicMaterial color={glow} toneMapped={false} />
                </mesh>
              </group>
            );
          })}
        {k === 6 && (
          <mesh position={[0, H * 0.45, 0.05]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 1.5, 6]} />
            <meshBasicMaterial color={glow} toneMapped={false} />
          </mesh>
        )}
        {k === 7 && (
          <>
            <mesh position={[0, (H * 0.6) / 2, 0]}>
              <boxGeometry args={[2.2, H * 0.6, 1.8]} />
              <meshStandardMaterial {...body} />
            </mesh>
            {[0.25, 0.5, 0.75].map((f) => (
              <mesh key={f} position={[0, H * 0.6 * f, 0.91]}>
                <boxGeometry args={[1.6, 0.07, 0.04]} />
                <meshBasicMaterial color={glow} toneMapped={false} />
              </mesh>
            ))}
            <mesh position={[0.7, H * 0.6 + 0.5, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 1, 6]} />
              <meshStandardMaterial {...body} />
            </mesh>
            <mesh position={[0.7, H * 0.6 + 1.0, 0]}>
              <sphereGeometry args={[0.1, 10, 8]} />
              <meshBasicMaterial color={glow} toneMapped={false} />
            </mesh>
          </>
        )}
        {k === 8 &&
          Array.from({ length: L + 1 }, (_, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            return (
              <group key={i} position={[col ? 0.62 : -0.62, 0.3 + row * 0.62, (i % 3) * 0.12 - 0.1]}>
                <mesh>
                  <boxGeometry args={[1.1, 0.56, 0.9]} />
                  <meshStandardMaterial color={i % 2 ? "#202a3d" : "#171e2c"} metalness={0.8} roughness={0.42} />
                </mesh>
                <mesh position={[0, 0.29, 0]}>
                  <boxGeometry args={[1.12, 0.03, 0.92]} />
                  <meshBasicMaterial color={glow} toneMapped={false} />
                </mesh>
              </group>
            );
          })}
      </group>
    </group>
  );
}
