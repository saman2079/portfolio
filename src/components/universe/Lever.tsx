"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Color, Plane, Ray, Vector3, type Group, type Mesh } from "three";
import { flightLive, setSpeedMul, speedToT, tToSpeed } from "@/lib/store/flightStore";

const LEN = 1.0; // slot length
const POS: [number, number, number] = [1.5, -0.93, -2.2];
const YAW = Math.atan2(-POS[0], -POS[2]); // face the pilot
const ORANGE = new Color(3.2, 1.3, 0.25);
const CYAN = new Color(0.3, 1.6, 2.4);
const metal = { color: "#0e131c", metalness: 0.9, roughness: 0.42 } as const;

/**
 * The throttle: a slider on the console. Drag it left/right to change the flight speed
 * multiplier (slow = leisurely cruise, fast = the same trip in a fraction of the time).
 */
export function Lever() {
  const root = useRef<Group>(null);
  const knob = useRef<Group>(null);
  const fill = useRef<Mesh>(null);
  const tmp = useMemo(
    () => ({ ray: new Ray(), plane: new Plane(new Vector3(0, 1, 0), -0.06), hit: new Vector3() }),
    []
  );

  const setFrom = (e: ThreeEvent<PointerEvent>) => {
    const g = root.current;
    if (!g) return;
    g.updateWorldMatrix(true, false);
    tmp.ray.copy(e.ray).applyMatrix4(g.matrixWorld.clone().invert());
    if (tmp.ray.intersectPlane(tmp.plane, tmp.hit)) {
      setSpeedMul(tToSpeed(tmp.hit.x / LEN + 0.5));
    }
  };

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (flightLive.outside) return;
    e.stopPropagation();
    (e.target as unknown as Element).setPointerCapture?.(e.pointerId);
    flightLive.grabbing = true;
    setFrom(e);
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (flightLive.grabbing) setFrom(e);
  };
  const release = (e: ThreeEvent<PointerEvent>) => {
    (e.target as unknown as Element).releasePointerCapture?.(e.pointerId);
    flightLive.grabbing = false;
  };
  const over = () => {
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    document.body.style.cursor = "";
  };

  useFrame(() => {
    const t = speedToT(flightLive.speedMul);
    const x = (t - 0.5) * LEN;
    if (knob.current) knob.current.position.x = x;
    if (fill.current) {
      fill.current.scale.x = Math.max(0.001, t * LEN);
      fill.current.position.x = -LEN / 2 + (t * LEN) / 2;
    }
  });

  return (
    <group ref={root} position={POS} rotation={[0, YAW, 0]}>
      {/* base plate and slot */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[LEN + 0.3, 0.06, 0.34]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[LEN, 0.01, 0.05]} />
        <meshBasicMaterial color="#02050a" />
      </mesh>
      <mesh ref={fill} position={[0, 0.02, 0]}>
        <boxGeometry args={[1, 0.008, 0.03]} />
        <meshBasicMaterial color={ORANGE} toneMapped={false} />
      </mesh>
      {/* ticks */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <mesh key={i} position={[(i / 6 - 0.5) * LEN, 0.012, 0.15]}>
          <boxGeometry args={[0.012, 0.008, i % 3 === 0 ? 0.07 : 0.04]} />
          <meshBasicMaterial color={CYAN} toneMapped={false} />
        </mesh>
      ))}
      {/* knob */}
      <group ref={knob}>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.075, 0.095, 0.16, 20]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[0, 0.175, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.02, 0.06, 24]} />
          <meshBasicMaterial color={ORANGE} toneMapped={false} />
        </mesh>
      </group>
      {/* generous invisible hit area */}
      <mesh
        position={[0, 0.08, 0]}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerOver={over}
        onPointerOut={out}
      >
        <boxGeometry args={[LEN + 0.3, 0.3, 0.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
