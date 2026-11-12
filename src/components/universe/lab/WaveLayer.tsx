"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { Color, type Group, type Mesh, type MeshBasicMaterial } from "three";
import { baseStore } from "@/lib/lab/baseStore";
import type { Building } from "@/lib/lab/gameStore";
import { CELL } from "@/lib/lab/baseStore";
import { TYPES } from "@/lib/lab/gameStore";
import { maxHp, resetSim, sim, updateSim } from "@/lib/lab/waveSim";
import { atk } from "@/lib/lab/attackSim";
import { raid, updateRaid } from "@/lib/lab/raidSim";

/**
 * Draws the strategy-mode raid (the simulation lives in waveSim.ts): placeholder enemies
 * from a fixed pool, turret tracers, and the hit-point bar / "down" state of each building.
 */
const MAX_ENEMIES = 28;
const MAX_SHOTS = 12;
const RED = new Color(3, 0.35, 0.25);
const EYE = new Color(3.2, 0.5, 0.2);
const dark = { color: "#2a1418", metalness: 0.7, roughness: 0.45 } as const;

export function WaveLayer() {
  const slots = useRef<(Group | null)[]>([]);
  const scouts = useRef<(Group | null)[]>([]);
  const brutes = useRef<(Group | null)[]>([]);
  const shots = useRef<(Group | null)[]>([]);
  const tracer = useMemo(() => new Color(3.2, 2.4, 0.6), []);

  useFrame((state, dt) => {
    if (!baseStore.get().mode) {
      if (sim.running) resetSim();
      for (const g of slots.current) if (g) g.visible = false;
      for (const g of shots.current) if (g) g.visible = false;
      return;
    }
    // while you assault an enemy base the colony's own raids are paused
    if (raid.on) updateRaid(dt);
    else updateSim(dt);
    const t = state.clock.elapsedTime;
    for (let i = 0; i < MAX_ENEMIES; i++) {
      const g = slots.current[i];
      if (!g) continue;
      const e = sim.enemies[i];
      if (!e) {
        g.visible = false;
        continue;
      }
      g.visible = true;
      const brute = e.kind === "brute";
      if (scouts.current[i]) scouts.current[i]!.visible = !brute;
      if (brutes.current[i]) brutes.current[i]!.visible = brute;
      const gy = raid.on ? atk.ground(e.x, e.z) : 0;
      g.position.set(e.x, gy + (brute ? 0 : 0.25 + Math.sin(t * 6 + e.id) * 0.12), e.z);
      g.rotation.y = e.face;
      g.rotation.z = Math.sin(t * 8 + e.id) * 0.06;
    }
    for (let i = 0; i < MAX_SHOTS; i++) {
      const g = shots.current[i];
      if (!g) continue;
      const s = sim.shots[i];
      if (!s) {
        g.visible = false;
        continue;
      }
      g.visible = true;
      g.position.set(s.x1, s.y1, s.z1);
      g.lookAt(s.x2, s.y2, s.z2);
      g.scale.z = Math.hypot(s.x2 - s.x1, s.y2 - s.y1, s.z2 - s.z1);
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_ENEMIES }, (_, i) => (
        <group key={i} ref={(el) => void (slots.current[i] = el)} visible={false}>
          {/* scout: a small darting drone */}
          <group ref={(el) => void (scouts.current[i] = el)}>
            <mesh position={[0, 0.7, 0]} scale={[0.7, 0.5, 1]}>
              <octahedronGeometry args={[0.7, 0]} />
              <meshStandardMaterial {...dark} />
            </mesh>
            <mesh position={[0, 0.72, 0.62]}>
              <sphereGeometry args={[0.16, 8, 6]} />
              <meshBasicMaterial color={EYE} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.35, 0.5, 16]} />
              <meshBasicMaterial color={RED} toneMapped={false} transparent opacity={0.6} />
            </mesh>
          </group>
          {/* brute: a slow armoured walker */}
          <group ref={(el) => void (brutes.current[i] = el)} visible={false}>
            <mesh position={[0, 1.15, 0]}>
              <boxGeometry args={[1.7, 1.3, 2.0]} />
              <meshStandardMaterial {...dark} />
            </mesh>
            {[-0.65, 0.65].map((x) => (
              <mesh key={x} position={[x, 0.35, 0.1]}>
                <boxGeometry args={[0.45, 0.7, 0.9]} />
                <meshStandardMaterial color="#1b0f12" metalness={0.8} roughness={0.4} />
              </mesh>
            ))}
            {[-0.5, 0, 0.5].map((x) => (
              <mesh key={x} position={[x, 2.0, -0.3]} rotation={[0, 0, 0]}>
                <coneGeometry args={[0.16, 0.7, 5]} />
                <meshStandardMaterial {...dark} />
              </mesh>
            ))}
            {[-0.4, 0.4].map((x) => (
              <mesh key={x} position={[x, 1.4, 1.02]}>
                <boxGeometry args={[0.28, 0.1, 0.05]} />
                <meshBasicMaterial color={EYE} toneMapped={false} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
      {Array.from({ length: MAX_SHOTS }, (_, i) => (
        <group key={i} ref={(el) => void (shots.current[i] = el)} visible={false}>
          <mesh position={[0, 0, 0.5]}>
            <boxGeometry args={[0.07, 0.07, 1]} />
            <meshBasicMaterial color={tracer} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A building in a raid: flattens when it is down and shows a hit-point bar while damaged. */
export function BuildingFx({ b, children }: { b: Building; children: ReactNode }) {
  const wrap = useRef<Group>(null);
  const bar = useRef<Group>(null);
  const fill = useRef<Group>(null);
  const fillMat = useRef<MeshBasicMaterial>(null);
  const alarm = useRef<Mesh>(null);
  const alarmR = (Math.max(TYPES[b.type].w, TYPES[b.type].h) * CELL) / 2 + 0.7;
  const top = b.type === "hq" ? 6.6 : 3.3;
  useFrame((state, dt) => {
    const mx = maxHp(b);
    const hp = sim.hp[b.id] ?? mx;
    const down = hp <= 0;
    // a pulsing red ring marks a building that is under attack: that is where to go
    if (alarm.current) {
      const hot = sim.active && !down && hp < mx;
      alarm.current.visible = hot;
      if (hot) alarm.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 7) * 0.06);
    }
    if (wrap.current) wrap.current.scale.y += ((down ? 0.22 : 1) - wrap.current.scale.y) * (1 - Math.exp(-dt * 8));
    if (bar.current) bar.current.visible = hp < mx;
    if (fill.current) fill.current.scale.x = Math.max(0.001, Math.min(1, hp / mx));
    if (fillMat.current) {
      const r = hp / mx;
      fillMat.current.color.setRGB(r > 0.5 ? 0.3 : 1.4, r > 0.5 ? 1.6 : r > 0.25 ? 0.9 : 0.25, 0.3);
    }
  });
  return (
    <>
      <group ref={wrap}>{children}</group>
      <mesh ref={alarm} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.22, 0]} visible={false}>
        <ringGeometry args={[alarmR - 0.12, alarmR, 48]} />
        <meshBasicMaterial color={RED} toneMapped={false} transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <Billboard position={[0, top, 0]}>
        <group ref={bar} visible={false}>
          <mesh>
            <planeGeometry args={[2.5, 0.3]} />
            <meshBasicMaterial color="#05080c" transparent opacity={0.75} depthTest={false} />
          </mesh>
          <group ref={fill} position={[-1.2, 0, 0.01]}>
            <mesh position={[1.2, 0, 0]} renderOrder={5}>
              <planeGeometry args={[2.4, 0.2]} />
              <meshBasicMaterial ref={fillMat} color="#4ade80" toneMapped={false} depthTest={false} />
            </mesh>
          </group>
        </group>
      </Billboard>
    </>
  );
}

