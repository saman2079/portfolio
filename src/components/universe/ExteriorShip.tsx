"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, type Group, type Mesh } from "three";
import { flightLive } from "@/lib/store/flightStore";

const ORANGE = new Color(3.2, 1.3, 0.25);
const CYAN = new Color(0.3, 1.6, 2.4);
const hull = { color: "#aab6c6", metalness: 0.65, roughness: 0.38 } as const;
const dark = { color: "#1b2433", metalness: 0.8, roughness: 0.45 } as const;

/**
 * Procedural stand-in for the ship's exterior, seen in the outside view. Nose points to -Z,
 * the pilot's eye sits at the canopy. Replaced by the real .glb later.
 */
export function ExteriorShip({ groupRef }: { groupRef: RefObject<Group> }) {
  const plumeL = useRef<Mesh>(null);
  const plumeR = useRef<Mesh>(null);

  useFrame((state) => {
    const s = flightLive.speedNorm;
    const flicker = 1 + Math.sin(state.clock.elapsedTime * 38) * 0.06;
    const len = (0.7 + s * 4.2) * flicker;
    for (const m of [plumeL.current, plumeR.current]) {
      if (!m) continue;
      m.scale.set(1 + s * 0.25, len, 1 + s * 0.25);
      m.position.z = 2.55 + len / 2;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.3, -3]} visible={false}>
      {/* fuselage + nose, flattened vertically */}
      <group scale={[1, 0.55, 1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.62, 3.6, 8, 24]} />
          <meshStandardMaterial {...hull} />
        </mesh>
        <mesh position={[0, 0, -2.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.62, 2.0, 24]} />
          <meshStandardMaterial {...hull} />
        </mesh>
      </group>

      {/* canopy */}
      <mesh position={[0, 0.34, -0.7]} scale={[0.55, 0.38, 1.1]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#0b2433" metalness={0.9} roughness={0.08} emissive={CYAN} emissiveIntensity={0.18} />
      </mesh>

      {/* dorsal spine and panels */}
      <mesh position={[0, 0.3, 1.2]}>
        <boxGeometry args={[0.5, 0.18, 1.8]} />
        <meshStandardMaterial {...dark} />
      </mesh>

      {/* swept wings with glowing tips */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.75, -0.08, 0.85]} rotation={[0, side * 0.42, side * -0.05]}>
          <mesh>
            <boxGeometry args={[2.6, 0.07, 1.7]} />
            <meshStandardMaterial {...hull} />
          </mesh>
          <mesh position={[0, 0.045, 0]}>
            <boxGeometry args={[2.3, 0.02, 0.5]} />
            <meshStandardMaterial {...dark} />
          </mesh>
          <mesh position={[side * 1.3, 0.0, 0]}>
            <boxGeometry args={[0.06, 0.1, 1.6]} />
            <meshBasicMaterial color={ORANGE} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* tail fins */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.55, 0.45, 2.0]} rotation={[0, 0, side * -0.35]}>
          <boxGeometry args={[0.06, 0.95, 0.9]} />
          <meshStandardMaterial {...hull} />
        </mesh>
      ))}

      {/* engines */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.55, -0.02, 2.0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.36, 1.2, 20]} />
            <meshStandardMaterial {...dark} />
          </mesh>
          <mesh position={[0, 0, 0.56]} rotation={[0, 0, 0]}>
            <circleGeometry args={[0.27, 20]} />
            <meshBasicMaterial color={CYAN} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* exhaust plumes (additive; length follows the flight speed) */}
      {[
        [-0.55, plumeL] as const,
        [0.55, plumeR] as const,
      ].map(([x, ref]) => (
        <group key={x} position={[x, -0.02, 0]}>
          <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.26, 1, 16, 1, true]} />
            <meshBasicMaterial
              color={ORANGE}
              toneMapped={false}
              transparent
              opacity={0.5}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
