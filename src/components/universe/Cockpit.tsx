"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, type Group } from "three";
import { holoFragment, holoVertex, panelFragment, panelVertex } from "./shaders";

const R = 4;
const ARC = 1.75; // half-angle of the console, in radians
const ORANGE = new Color(3.2, 1.3, 0.25);
const CYAN = new Color(0.3, 1.6, 2.4);
const metal = { color: "#0e131c", metalness: 0.9, roughness: 0.42 } as const;

/**
 * Procedural cockpit, built around the camera at the origin: curved top beam,
 * window struts, the console deck with glowing cells and the hologram globe.
 * It lives in ship space, so it moves with the ship and not with the head.
 */
export function Cockpit() {
  const globe = useRef<Group>(null);
  const ringA = useRef<Group>(null);
  const ringB = useRef<Group>(null);

  const panel = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: panelVertex,
        fragmentShader: panelFragment,
        side: DoubleSide,
        uniforms: {
          uBase: { value: new Color(0.018, 0.028, 0.045) },
          uLine: { value: new Color(0.0, 0.3, 0.55) },
          uHot: { value: new Color(2.2, 0.8, 0.12) },
          uScale: { value: 5 },
          uTime: { value: 0 },
        },
      }),
    []
  );
  const holo = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: holoVertex,
        fragmentShader: holoFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uColor: { value: new Color(0.2, 0.9, 1.6) }, uTime: { value: 0 } },
      }),
    []
  );
  useEffect(
    () => () => {
      panel.dispose();
      holo.dispose();
    },
    [panel, holo]
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const pt = panel.uniforms["uTime"];
    const ht = holo.uniforms["uTime"];
    if (pt) pt.value = t;
    if (ht) ht.value = t;
    if (globe.current) globe.current.rotation.y += delta * 0.25;
    if (ringA.current) ringA.current.rotation.z += delta * 0.6;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.4;
  });

  const thetaStart = Math.PI / 2 - ARC; // ring geometry angle: front (-Z) is PI/2 once laid flat
  const cylStart = Math.PI - ARC; // cylinder angle: front (-Z) is PI

  return (
    <group>
      {/* curved top beam */}
      <mesh position={[0, 1.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R, 0.38, 10, 56, Math.PI]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[0, 1.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R - 0.27, 0.035, 6, 64, Math.PI]} />
        <meshBasicMaterial color={ORANGE} toneMapped={false} />
      </mesh>

      {/* window struts */}
      {[-1, 1].flatMap((side) =>
        [0.75, 1.35].map((phi) => (
          <group
            key={`${side}-${phi}`}
            position={[side * R * Math.sin(phi) * 0.97, 0.45, -R * Math.cos(phi) * 0.97]}
            rotation={[0, -side * phi, 0]}
          >
            <mesh>
              <boxGeometry args={[0.34, 3.0, 0.3]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh position={[0, 0, 0.17]}>
              <boxGeometry args={[0.04, 2.5, 0.02]} />
              <meshBasicMaterial color={ORANGE} toneMapped={false} />
            </mesh>
          </group>
        ))
      )}

      {/* console deck */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={panel}>
        <ringGeometry args={[1.6, R, 96, 1, thetaStart, ARC * 2]} />
      </mesh>
      <mesh position={[0, -0.995, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[R - 0.14, R - 0.05, 96, 1, thetaStart, ARC * 2]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} side={DoubleSide} />
      </mesh>
      <mesh position={[0, -0.81, 0]}>
        <cylinderGeometry args={[R, R, 0.38, 64, 1, true, cylStart, ARC * 2]} />
        <meshStandardMaterial {...metal} side={DoubleSide} />
      </mesh>

      {/* side consoles */}
      {[-1, 1].flatMap((side) =>
        [0.95, 1.4].map((phi) => (
          <mesh
            key={`${side}-${phi}`}
            position={[side * 3.4 * Math.sin(phi), -0.62, -3.4 * Math.cos(phi)]}
            rotation={[-0.35, -side * phi, 0]}
            material={panel}
          >
            <boxGeometry args={[1.5, 0.8, 0.5]} />
          </mesh>
        ))
      )}

      {/* hologram globe */}
      <group position={[0, -1, -2.7]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.62, 0.7, 0.1, 48]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.56, 64]} />
          <meshBasicMaterial color={CYAN} toneMapped={false} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.33, 64]} />
          <meshBasicMaterial color={CYAN} toneMapped={false} side={DoubleSide} />
        </mesh>
        <group position={[0, 0.62, 0]}>
          <group ref={globe}>
            <mesh material={holo}>
              <sphereGeometry args={[0.36, 40, 28]} />
            </mesh>
          </group>
          <group ref={ringA} rotation={[1.1, 0.2, 0]}>
            <mesh>
              <torusGeometry args={[0.58, 0.006, 6, 96]} />
              <meshBasicMaterial color={CYAN} toneMapped={false} />
            </mesh>
          </group>
          <group ref={ringB} rotation={[0.35, -0.5, 0.4]}>
            <mesh>
              <torusGeometry args={[0.74, 0.005, 6, 96]} />
              <meshBasicMaterial color={CYAN} toneMapped={false} />
            </mesh>
          </group>
        </group>
        <pointLight position={[0, 0.6, 0.2]} color="#38bdf8" intensity={10} distance={7} />
      </group>

      <pointLight position={[2.4, 1.3, -2.2]} color="#ff9a4d" intensity={8} distance={8} />
      <pointLight position={[-2.4, 1.3, -2.2]} color="#ff9a4d" intensity={8} distance={8} />
    </group>
  );
}
