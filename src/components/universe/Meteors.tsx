"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, ConeGeometry, DoubleSide, IcosahedronGeometry, type Group } from "three";
import { flightLive } from "@/lib/store/flightStore";

const COUNT = 7;

function rock() {
  const geo = new IcosahedronGeometry(1, 1);
  const p = geo.attributes.position;
  if (p) {
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
      const k = 0.7 + (n - Math.floor(n)) * 0.5;
      p.setXYZ(i, x * k, y * k * 0.85, z * k);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

interface Meteor {
  x: number;
  y: number;
  z: number;
  v: number;
  size: number;
  wait: number;
  spin: number;
}

const fresh = (m: Meteor, first: boolean) => {
  const side = Math.random() < 0.5 ? -1 : 1;
  const close = Math.random() < 0.25;
  m.x = side * (close ? 3.2 + Math.random() * 3 : 6 + Math.random() * 14);
  m.y = (Math.random() - 0.4) * 12;
  m.z = -170 - Math.random() * 60;
  m.v = 60 + Math.random() * 60;
  m.size = 0.25 + Math.random() * (close ? 0.6 : 1.0);
  m.wait = (first ? 1 : 0) + Math.random() * 4.5;
  m.spin = (Math.random() - 0.5) * 3;
};

/**
 * Meteors that streak past the ship's flanks. They live in ship space (the pilot is the origin and the
 * ship looks down -Z), so they pass the windows whatever the ship is doing.
 */
export function Meteors() {
  const groups = useRef<(Group | null)[]>([]);
  const rocks = useRef<(Group | null)[]>([]);
  const state = useMemo(() => {
    const list: Meteor[] = Array.from({ length: COUNT }, () => ({ x: 0, y: 0, z: 0, v: 0, size: 1, wait: 0, spin: 0 }));
    list.forEach((m) => fresh(m, true));
    return list;
  }, []);
  const geo = useMemo(rock, []);
  const trail = useMemo(() => new ConeGeometry(1, 1, 10, 1, true), []);
  useEffect(
    () => () => {
      geo.dispose();
      trail.dispose();
    },
    [geo, trail]
  );

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const away = flightLive.surface;
    state.forEach((m, i) => {
      const g = groups.current[i];
      if (!g) return;
      if (away) {
        g.visible = false;
        return;
      }
      if (m.wait > 0) {
        m.wait -= dt;
        g.visible = false;
        return;
      }
      m.z += m.v * dt;
      if (m.z > 25) {
        fresh(m, false);
        g.visible = false;
        return;
      }
      g.visible = true;
      g.position.set(m.x, m.y, m.z);
      const r = rocks.current[i];
      if (r) {
        r.rotation.x += m.spin * dt;
        r.rotation.y += m.spin * 0.7 * dt;
      }
    });
  });

  return (
    <>
      {state.map((m, i) => {
        const len = 7 + m.size * 14;
        return (
          <group key={i} ref={(el) => void (groups.current[i] = el)} visible={false}>
            <group ref={(el) => void (rocks.current[i] = el)} scale={m.size}>
              <mesh geometry={geo}>
                <meshStandardMaterial color="#6b5f55" roughness={0.9} emissive={new Color("#ff5a14")} emissiveIntensity={0.55} flatShading />
              </mesh>
            </group>
            {/* the glowing tail points back the way the rock came from (-Z) */}
            <mesh geometry={trail} position={[0, 0, -len / 2]} rotation={[-Math.PI / 2, 0, 0]} scale={[m.size * 0.95, len, m.size * 0.95]}>
              <meshBasicMaterial
                color={new Color(2.2, 0.9, 0.25)}
                transparent
                opacity={0.55}
                depthWrite={false}
                blending={AdditiveBlending}
                side={DoubleSide}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
