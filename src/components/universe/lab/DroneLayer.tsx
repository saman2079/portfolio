"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Group, type Mesh } from "three";
import { baseStore } from "@/lib/lab/baseStore";
import { BASES, REVEAL, cooldownLeft, exitScout, scout, updateScout } from "@/lib/lab/scoutSim";

/**
 * The scouting drone and the enemy bases it uncovers (placeholder models, to be swapped later).
 * A base stays invisible until the drone has passed near it; it is then marked by a red beacon.
 */
const CYAN = new Color(0.3, 2.2, 3.2);
const RED = new Color(3, 0.4, 0.3);
const hull = { color: "#1a2230", metalness: 0.8, roughness: 0.4 } as const;
const rock = { color: "#2a1418", metalness: 0.7, roughness: 0.5 } as const;
const ARMS: [number, number][] = [
  [0.9, 0.9],
  [-0.9, 0.9],
  [0.9, -0.9],
  [-0.9, -0.9],
];

export function DroneLayer() {
  const drone = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const rotors = useRef<(Mesh | null)[]>([]);
  const ring = useRef<Mesh>(null);
  const bases = useRef<(Group | null)[]>([]);
  const beacons = useRef<(Mesh | null)[]>([]);
  const flak = useRef<(Group | null)[]>([]);

  useFrame((state, dt) => {
    if (scout.on && !baseStore.get().mode) exitScout();
    updateScout(dt);
    const t = state.clock.elapsedTime;
    const g = drone.current;
    if (g) {
      g.visible = scout.on;
      if (scout.on) {
        g.position.set(scout.x, scout.y + Math.sin(t * 2.2) * 0.15, scout.z);
        g.rotation.y = scout.yaw;
        // lean into the direction of travel
        if (tilt.current) {
          const sp = Math.hypot(scout.vx, scout.vz);
          tilt.current.rotation.x += (Math.min(0.35, sp * 0.015) - tilt.current.rotation.x) * (1 - Math.exp(-dt * 6));
        }
      }
    }
    for (const r of rotors.current) if (r) r.rotation.y = t * 40;
    if (ring.current) {
      ring.current.visible = scout.on;
      ring.current.position.set(scout.x, scout.gy + 0.25, scout.z);
      ring.current.scale.setScalar(1 + Math.sin(t * 4) * 0.03);
    }
    // red fire from the bases that are shooting at the drone
    for (let i = 0; i < BASES.length; i++) {
      const f = flak.current[i];
      if (!f) continue;
      const on = scout.on && scout.fire.includes(i) && Math.sin(t * 40 + i) > -0.3;
      f.visible = on;
      if (on) {
        const b = BASES[i]!;
        f.position.set(b.x, b.y + 7, b.z);
        f.lookAt(scout.x, scout.y, scout.z);
        f.scale.z = Math.hypot(scout.x - b.x, scout.y - b.y - 7, scout.z - b.z);
      }
    }
    for (let i = 0; i < BASES.length; i++) {
      const b = bases.current[i];
      if (!b) continue;
      const found = scout.found.includes(i);
      b.visible = found;
      const bc = beacons.current[i];
      if (bc) bc.visible = cooldownLeft(i) === 0;
      if (found && bc) {
        // the beacon swells for a moment right after the discovery
        const pulse = i === scout.last ? Math.max(0, 1 - (scout.clock - scout.lastAt) / 1.5) : 0;
        bc.scale.set(1 + pulse * 2.5, 1, 1 + pulse * 2.5);
      }
    }
  });

  return (
    <group>
      <group ref={drone} visible={false}>
        <group ref={tilt}>
          <mesh>
            <boxGeometry args={[1.1, 0.3, 1.5]} />
            <meshStandardMaterial {...hull} />
          </mesh>
          <mesh position={[0, 0.05, 0.78]}>
            <sphereGeometry args={[0.2, 10, 8]} />
            <meshBasicMaterial color={CYAN} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.18, 0.1, 0.22, 8]} />
            <meshBasicMaterial color={CYAN} toneMapped={false} />
          </mesh>
          {ARMS.map(([x, z], i) => (
            <group key={i} position={[x, 0.12, z]}>
              <mesh rotation={[0, Math.atan2(x, z), Math.PI / 2]} position={[-x * 0.45, -0.06, -z * 0.45]} scale={[1, 1, 1]}>
                <cylinderGeometry args={[0.05, 0.05, 1.25, 6]} />
                <meshStandardMaterial {...hull} />
              </mesh>
              <mesh ref={(el) => void (rotors.current[i] = el)} position={[0, 0.08, 0]}>
                <boxGeometry args={[1.05, 0.03, 0.12]} />
                <meshBasicMaterial color="#9fb4cc" transparent opacity={0.7} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {BASES.map((b, i) => (
        <group key={`f${b.id}`} ref={(el) => void (flak.current[i] = el)} visible={false}>
          <mesh position={[0, 0, 0.5]}>
            <boxGeometry args={[0.12, 0.12, 1]} />
            <meshBasicMaterial color={RED} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* the area the drone is uncovering */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[REVEAL - 0.35, REVEAL, 72]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {BASES.map((b, i) => (
        <group key={b.id} ref={(el) => void (bases.current[i] = el)} position={[b.x, b.y, b.z]} visible={false}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[9, 10, 0.5, 20]} />
            <meshStandardMaterial color="#1b1015" metalness={0.6} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[8.2, 8.7, 40]} />
            <meshBasicMaterial color={RED} toneMapped={false} transparent opacity={0.8} />
          </mesh>
          {/* a tower per power level, a keep in the middle, spikes around it */}
          <mesh position={[0, 2.4, 0]}>
            <boxGeometry args={[4.2, 4.4, 4.2]} />
            <meshStandardMaterial {...rock} />
          </mesh>
          <mesh position={[0, 5.4, 0]}>
            <coneGeometry args={[2.4, 3, 5]} />
            <meshStandardMaterial {...rock} />
          </mesh>
          {Array.from({ length: 4 + b.power * 2 }, (_, k) => {
            const a = (k / (4 + b.power * 2)) * Math.PI * 2;
            return (
              <mesh key={k} position={[Math.sin(a) * 6.6, 1.3, Math.cos(a) * 6.6]}>
                <coneGeometry args={[0.55, 2.4, 5]} />
                <meshStandardMaterial {...rock} />
              </mesh>
            );
          })}
          <mesh position={[0, 3.4, 2.15]}>
            <boxGeometry args={[2.4, 0.3, 0.1]} />
            <meshBasicMaterial color={RED} toneMapped={false} />
          </mesh>
          <mesh ref={(el) => void (beacons.current[i] = el)} position={[0, 24, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 48, 8, 1, true]} />
            <meshBasicMaterial color={RED} toneMapped={false} transparent opacity={0.4} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
