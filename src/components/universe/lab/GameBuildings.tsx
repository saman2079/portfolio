"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Color, type Group, type Mesh } from "three";
import { CELL, ORIGIN, baseStore, useBase } from "@/lib/lab/baseStore";
import { CharacterLayer } from "./Character";
import { BuildingFx, WaveLayer } from "./WaveLayer";
import { TYPES, bufferSize, gameStore, stored, useGame, type Building, type BuildingType } from "@/lib/lab/gameStore";

/**
 * Placeholder models of the colony buildings: simple dark-metal shapes with glowing parts.
 * They are meant to be swapped for real models later; each one fills its footprint
 * (1x1 = 3 units, the command centre 2x2 = 6) and grows a little with its level.
 */
export const TYPE_HUE: Record<BuildingType, string> = {
  hq: "#facc15",
  extractor: "#22d3ee",
  generator: "#fb923c",
  storage: "#a78bfa",
  turret: "#f87171",
  wall: "#5bc8ff",
};
const body = { color: "#141a26", metalness: 0.85, roughness: 0.4 } as const;
const plate = { color: "#2a3346", metalness: 0.8, roughness: 0.35 } as const;

export function GameBuilding({ type, level }: { type: BuildingType; level: number }) {
  const hue = TYPE_HUE[type];
  const glow = useMemo(() => new Color(hue).multiplyScalar(2.4), [hue]);
  const L = Math.max(1, Math.min(3, level));
  const spin = useRef<Group>(null);
  const spin2 = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  useFrame((state, dt) => {
    if (spin.current) spin.current.rotation.y += dt * (type === "turret" ? 0.5 : 1.2);
    if (spin2.current) spin2.current.rotation.z += dt * 1.6;
    if (core.current) core.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.06);
  });

  const pad = (r: number) => (
    <>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[r, r + 0.1, 0.14, 28]} />
        <meshStandardMaterial {...body} />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r - 0.07, r - 0.01, 40]} />
        <meshBasicMaterial color={glow} toneMapped={false} />
      </mesh>
    </>
  );

  if (type === "hq") {
    const H = 2.4 + L * 0.8;
    return (
      <group>
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[5.4, 0.32, 5.4]} />
          <meshStandardMaterial {...body} />
        </mesh>
        <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.35, 2.45, 48]} />
          <meshBasicMaterial color={glow} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.32 + H / 2, 0]}>
          <cylinderGeometry args={[1.0, 1.6, H, 8]} />
          <meshStandardMaterial {...plate} />
        </mesh>
        <mesh position={[0, 0.32 + H * 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.35, 0.06, 8, 40]} />
          <meshBasicMaterial color={glow} toneMapped={false} />
        </mesh>
        <group ref={spin} position={[0, 0.32 + H + 0.5, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.7, 0.05, 8, 32]} />
            <meshBasicMaterial color={glow} toneMapped={false} />
          </mesh>
          <mesh ref={core}>
            <sphereGeometry args={[0.32, 16, 12]} />
            <meshBasicMaterial color={glow} toneMapped={false} />
          </mesh>
        </group>
        {[
          [-2.25, -2.25],
          [2.25, -2.25],
          [-2.25, 2.25],
          [2.25, 2.25],
        ].map(([x, z], i) => (
          <group key={i} position={[x, 0.32, z]}>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.45, 1, 0.45]} />
              <meshStandardMaterial {...plate} />
            </mesh>
            <mesh position={[0, 1.06, 0]}>
              <boxGeometry args={[0.3, 0.12, 0.3]} />
              <meshBasicMaterial color={glow} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (type === "extractor") {
    return (
      <group>
        {pad(1.35)}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.95, 1.1, 0.9, 6]} />
          <meshStandardMaterial {...plate} />
        </mesh>
        <group ref={spin} position={[0, 1.55 + L * 0.15, 0]}>
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.55, 1.4 + L * 0.3, 6]} />
            <meshStandardMaterial color="#1b2433" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.8 + L * 0.15, 0]}>
            <torusGeometry args={[0.55, 0.05, 6, 20]} />
            <meshBasicMaterial color={glow} toneMapped={false} />
          </mesh>
        </group>
        <mesh position={[0, 1.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 0.95, 6]} />
          <meshBasicMaterial color={glow} toneMapped={false} />
        </mesh>
      </group>
    );
  }

  if (type === "generator") {
    return (
      <group>
        {pad(1.35)}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.55, 0.9, 0.9, 16]} />
          <meshStandardMaterial {...plate} />
        </mesh>
        <mesh ref={core} position={[0, 1.55 + L * 0.1, 0]}>
          <sphereGeometry args={[0.5 + L * 0.06, 20, 14]} />
          <meshBasicMaterial color={glow} toneMapped={false} />
        </mesh>
        <group ref={spin2} position={[0, 1.55 + L * 0.1, 0]}>
          <mesh>
            <torusGeometry args={[0.85, 0.045, 8, 36]} />
            <meshBasicMaterial color={glow} toneMapped={false} />
          </mesh>
        </group>
        <group ref={spin} position={[0, 1.55 + L * 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[1.0, 0.035, 8, 36]} />
            <meshBasicMaterial color={glow} toneMapped={false} />
          </mesh>
        </group>
      </group>
    );
  }

  if (type === "storage") {
    return (
      <group>
        {pad(1.35)}
        {Array.from({ length: L + 1 }, (_, i) => (
          <group key={i} position={[(i % 2 ? 0.12 : -0.1), 0.2 + 0.62 * i + 0.3, 0]} rotation={[0, i * 0.35, 0]}>
            <mesh>
              <boxGeometry args={[1.9, 0.56, 1.5]} />
              <meshStandardMaterial {...(i % 2 ? plate : body)} />
            </mesh>
            <mesh position={[0, 0, 0.76]}>
              <boxGeometry args={[1.5, 0.08, 0.03]} />
              <meshBasicMaterial color={glow} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (type === "turret") {
    return (
      <group>
        {pad(1.25)}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.7, 0.95, 0.8, 8]} />
          <meshStandardMaterial {...plate} />
        </mesh>
        <group ref={spin} position={[0, 1.25, 0]}>
          <mesh>
            <boxGeometry args={[1.0, 0.55, 1.1]} />
            <meshStandardMaterial {...body} />
          </mesh>
          {Array.from({ length: L > 1 ? 2 : 1 }, (_, i) => (
            <group key={i} position={[L > 1 ? (i - 0.5) * 0.5 : 0, 0.06, -0.9]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.15]}>
                <cylinderGeometry args={[0.08, 0.11, 1.5, 8]} />
                <meshStandardMaterial color="#222b3b" metalness={0.9} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, -0.92]}>
                <boxGeometry args={[0.1, 0.1, 0.06]} />
                <meshBasicMaterial color={glow} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    );
  }

  // wall
  const H = 0.9 + L * 0.3;
  return (
    <group>
      <mesh position={[0, H / 2, 0]}>
        <boxGeometry args={[2.7, H, 1.0]} />
        <meshStandardMaterial {...plate} />
      </mesh>
      <mesh position={[0, H + 0.04, 0]}>
        <boxGeometry args={[2.74, 0.08, 1.06]} />
        <meshBasicMaterial color={glow} toneMapped={false} />
      </mesh>
    </group>
  );
}

const centreOf = (type: BuildingType, gx: number, gz: number): [number, number] => {
  const t = TYPES[type];
  return [ORIGIN.x + (gx + t.w / 2) * CELL, ORIGIN.z + (gz + t.h / 2) * CELL];
};

/** A glowing bubble above a producer that has something to collect. */
function Orb({ b }: { b: Building }) {
  const mesh = useRef<Mesh>(null);
  const t = TYPES[b.type];
  const color = useMemo(() => new Color(TYPE_HUE[b.type]).multiplyScalar(2.6), [b.type]);
  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const ready = stored(b) >= Math.min(8, bufferSize(b) * 0.3);
    m.visible = ready;
    if (ready) {
      m.position.y = 4.1 + Math.sin(state.clock.elapsedTime * 2.4 + b.gx) * 0.18;
      m.rotation.y += 0.04;
    }
  });
  return t.produces ? (
    <mesh ref={mesh} visible={false}>
      <octahedronGeometry args={[0.38, 0]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  ) : null;
}

const OK = new Color(0.2, 1.6, 0.7);
const BAD = new Color(2.2, 0.3, 0.3);

/** The colony: placed buildings, the ghost of the one being placed, and the selection ring. */
export function GameLayer() {
  const buildings = useGame((s) => s.buildings);
  const armed = useGame((s) => s.armed);
  const selected = useGame((s) => s.selected);
  const hover = useBase((s) => s.hover);

  const press = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    if (!baseStore.get().mode || gameStore.get().armed) return;
    e.stopPropagation();
    const b = gameStore.get().buildings.find((x) => x.id === id);
    if (b && TYPES[b.type].produces && stored(b) >= 1) gameStore.collect(id);
    gameStore.select(gameStore.get().selected === id && !(b && stored(b) >= 1) ? null : id);
  };

  const ghostType = armed?.type;
  const ghostDef = ghostType ? TYPES[ghostType] : null;

  return (
    <group>
      {buildings
        .filter((b) => b.id !== armed?.moveId)
        .map((b) => {
          const [x, z] = centreOf(b.type, b.gx, b.gz);
          const t = TYPES[b.type];
          return (
            <group key={b.id} position={[x, 0, z]} onPointerDown={press(b.id)}>
              <BuildingFx b={b}>
                <GameBuilding type={b.type} level={b.level} />
              </BuildingFx>
              <Orb b={b} />
              {selected === b.id && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
                  <ringGeometry args={[(Math.max(t.w, t.h) * CELL) / 2 - 0.15, (Math.max(t.w, t.h) * CELL) / 2 - 0.02, 56]} />
                  <meshBasicMaterial color={new Color(3, 2.4, 0.6)} toneMapped={false} />
                </mesh>
              )}
            </group>
          );
        })}

      <WaveLayer />
      <CharacterLayer />

      {ghostType && ghostDef && hover && (
        <group position={[centreOf(ghostType, hover.gx, hover.gz)[0], 0, centreOf(ghostType, hover.gx, hover.gz)[1]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
            <planeGeometry args={[ghostDef.w * CELL - 0.15, ghostDef.h * CELL - 0.15]} />
            <meshBasicMaterial color={hover.ok ? OK : BAD} toneMapped={false} transparent opacity={0.4} depthWrite={false} />
          </mesh>
          <group scale={hover.ok ? 1 : 0.0001}>
            <GameBuilding type={ghostType} level={armed?.moveId ? (buildings.find((b) => b.id === armed.moveId)?.level ?? 1) : 1} />
          </group>
        </group>
      )}
    </group>
  );
}
