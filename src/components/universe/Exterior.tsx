"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, DoubleSide, PMREMGenerator, type Group, type Material, type Mesh, type Texture } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { flightLive } from "@/lib/store/flightStore";

export const EXTERIOR_URL = "/models/exterior.glb";
/** ship-space size: the model is about 1.04 million units long, this makes it ~25 long */
export const EXTERIOR_SCALE = 2.4e-5;
/** where the pilot sits inside the model, in the model's own units (the middle of its canopy window) */
const EYE = [-133202, 532000, 60000] as const;

/**
 * "Space Vector Exploration, Interior Redesign" by ReiSakisaka (CC BY 4.0,
 * sketchfab.com/3d-models/space-vector-exploration-interior-redesign-0630b4fcda0845679432568b449a0490).
 * Only seen from outside: it is shown once the camera has left the cockpit.
 * The nose points along +Z in the model, so it is turned round to fly along -Z like everything else.
 */
function ExteriorModel() {
  const gltf = useGLTF(EXTERIOR_URL);
  const gl = useThree((s) => s.gl);
  const group = useRef<Group>(null);

  const { scene, env } = useMemo(() => {
    const pmrem = new PMREMGenerator(gl);
    const env: Texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    const scene = gltf.scene.clone(true);
    const seen = new Set<Material>();
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const mat = m.material as Material & {
        color?: Color;
        metalness?: number;
        roughness?: number;
        envMap?: Texture | null;
        envMapIntensity?: number;
        transparent?: boolean;
      };
      if (seen.has(mat)) return;
      seen.add(mat);
      if (mat.transparent) {
        mat.side = DoubleSide;
        mat.depthWrite = false;
        return;
      }
      // the hull is nearly black: lift it a little and let it catch the light so its shape reads in space
      if (mat.color && mat.color.r + mat.color.g + mat.color.b < 0.4) mat.color.lerp(new Color("#2a3140"), 0.7);
      mat.metalness = 0.75;
      mat.roughness = 0.38;
      mat.envMap = env;
      mat.envMapIntensity = 1.1;
      mat.needsUpdate = true;
    });
    return { scene, env };
  }, [gltf, gl]);
  useEffect(() => () => env.dispose(), [env]);

  // visible only after the camera has started to leave the cockpit
  useFrame(() => {
    if (group.current) group.current.visible = flightLive.view > 0.12;
  });

  return (
    <group ref={group} scale={EXTERIOR_SCALE} rotation={[0, Math.PI, 0]} visible={false}>
      <group position={[-EYE[0], -EYE[1], -EYE[2]]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

/** Loads the 5 MB exterior only the first time the pilot asks for the outside view. */
export function Exterior() {
  const [wanted, setWanted] = useState(false);
  useFrame(() => {
    if (!wanted && flightLive.outside) setWanted(true);
  });
  return wanted ? (
    <Suspense fallback={null}>
      <ExteriorModel />
    </Suspense>
  ) : null;
}
