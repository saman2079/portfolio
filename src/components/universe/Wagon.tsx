"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  DoubleSide,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type BufferGeometry,
  type Group,
  type InterleavedBufferAttribute,
} from "three";
import { flightLive } from "@/lib/store/flightStore";

export const MODEL_URL = "/models/warp-wagon.glb";
/** Scale of the model, and where the pilot's eyes are in model space (the nose compartment). */
export const MODEL_SCALE = 1.8;
export const MODEL_EYE: [number, number, number] = [0, 2.3, -3.3];
/** Middle of the hull relative to the pilot's eye, in ship space (for the outside camera). */
export const HULL_CENTER: [number, number, number] = [
  0,
  (2.4 - MODEL_EYE[1]) * MODEL_SCALE,
  (-0.8 - MODEL_EYE[2]) * MODEL_SCALE,
];
const ORANGE = new Color(3.2, 1.3, 0.25);

useGLTF.preload(MODEL_URL);

function averageColor(geo: BufferGeometry): [number, number, number] | null {
  const attr = geo.getAttribute("color") as BufferAttribute | InterleavedBufferAttribute | undefined;
  if (!attr) return null;
  const n = Math.min(attr.count, 64);
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < n; i++) {
    r += attr.getX(i);
    g += attr.getY(i);
    b += attr.getZ(i);
  }
  return [r / n, g / n, b / n];
}

/**
 * "Warp Wagon Interior" by Mattdude (CC BY 4.0, sketchfab.com/3d-models/warp-wagon-interior-35c5123c1adc4cac83712c6d0cc22540).
 * The file has no textures, only vertex colours, so the colours are kept and lit with standard PBR;
 * very bright saturated parts glow, and pale bluish meshes become glass.
 */
export function Wagon({ onLoaded }: { onLoaded?: () => void }) {
  const gltf = useGLTF(MODEL_URL);
  const plumeL = useRef<Mesh>(null);
  const plumeR = useRef<Mesh>(null);

  const { scene, body, glass } = useMemo(() => {
    const body = new MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.25, side: DoubleSide });
    body.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          float mx = max(vColor.r, max(vColor.g, vColor.b));
          float mn = min(vColor.r, min(vColor.g, vColor.b));
          totalEmissiveRadiance += vColor.rgb * smoothstep(0.85, 1.0, mx) * smoothstep(0.55, 0.9, mx - mn) * 1.8;
        }`
      );
    };
    const glass = new MeshPhysicalMaterial({
      color: new Color("#9fd8ff"),
      transparent: true,
      opacity: 0.16,
      roughness: 0.05,
      metalness: 0,
      side: DoubleSide,
      depthWrite: false,
    });
    const scene = gltf.scene.clone(true);
    scene.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      const c = averageColor(mesh.geometry);
      const lum = c ? Math.max(c[0], c[1], c[2]) : 0;
      const isGlass = c !== null && lum > 0.6 && c[2] - c[0] > 0.1 && Math.min(c[0], c[1], c[2]) > 0.55;
      mesh.material = isGlass ? glass : body;
      mesh.renderOrder = isGlass ? 5 : 0;
    });
    return { scene, body, glass };
  }, [gltf]);

  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);
  useEffect(
    () => () => {
      body.dispose();
      glass.dispose();
    },
    [body, glass]
  );

  // exhaust flames grow with the flight speed
  useFrame((state) => {
    const s = flightLive.speedNorm;
    const flicker = 1 + Math.sin(state.clock.elapsedTime * 38) * 0.06;
    const len = (1.2 + s * 7) * flicker;
    for (const m of [plumeL.current, plumeR.current]) {
      if (!m) continue;
      m.scale.set(1 + s * 0.3, len, 1 + s * 0.3);
      m.position.z = PLUME_Z + len / 2;
    }
  });

  return (
    <>
      <group scale={MODEL_SCALE} position={[0, -MODEL_EYE[1] * MODEL_SCALE, -MODEL_EYE[2] * MODEL_SCALE]}>
        <primitive object={scene} />
        <pointLight position={[0, 2.55, -3.0]} color="#38bdf8" intensity={6} distance={5} />
        <pointLight position={[0, 2.5, -1.2]} color="#ff9a4d" intensity={5} distance={5} />
        <pointLight position={[0, 2.5, 0.8]} color="#ffd9b0" intensity={4} distance={5} />
      </group>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          ref={side < 0 ? plumeL : plumeR}
          position={[side * PLUME_X, PLUME_Y, PLUME_Z + 0.6]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <coneGeometry args={[0.7, 1, 16, 1, true]} />
          <meshBasicMaterial color={ORANGE} toneMapped={false} transparent opacity={0.5} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/** engine nozzles, in ship space (the pilot's eye is the origin) */
const PLUME_X = 0.5 * MODEL_SCALE;
const PLUME_Y = (2.25 - MODEL_EYE[1]) * MODEL_SCALE;
const PLUME_Z = (2.65 - MODEL_EYE[2]) * MODEL_SCALE;
