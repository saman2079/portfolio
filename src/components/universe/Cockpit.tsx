"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { flightLive } from "@/lib/store/flightStore";
import {
  Color,
  DoubleSide,
  Mesh,
  MeshPhysicalMaterial,
  PMREMGenerator,
  type Group,
  type Material,
  type Texture,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Screens } from "./Screens";
import { HoloButton, Hologram } from "./Hologram";

export const MODEL_URL = "/models/cockpit.glb";
/**
 * The model is about 1 m wide and looks along +Z. In ship space the pilot's eye is the origin and
 * the ship flies along -Z, so the model is turned around and scaled up about the pilot's eye.
 */
export const MODEL_SCALE = 2.2;
export const MODEL_EYE: [number, number, number] = [0, 1.5, -0.05];
/**
 * Middle of the outside model relative to the pilot's eye, in ship space (the outside camera orbits it).
 * The pilot sits at the canopy of the exterior model; its middle is about 390 000 model units behind it.
 */
export const HULL_CENTER: [number, number, number] = [0, -31000 * 3.2e-5, 390000 * 3.2e-5];

useGLTF.preload(MODEL_URL);

/**
 * "Sci-fi Spaceship Cockpit 02" by NotARealStudio (CC BY 4.0,
 * sketchfab.com/3d-models/sci-fi-spaceship-cockpit-02-c6825892999242319c1a29326c4e7713).
 * Its textures were downscaled to 1024 px. The three screens above the dash, the hologram button
 * and the hologram are added on top of the model.
 */
export function Cockpit({ onLoaded }: { onLoaded?: () => void }) {
  const gltf = useGLTF(MODEL_URL);
  const gl = useThree((s) => s.gl);
  const root = useRef<Group>(null);
  // the cockpit is only the inside view: it folds away once the camera is out around the ship
  useFrame(() => {
    if (root.current) root.current.visible = flightLive.view < 0.4;
  });

  const { scene, glass, env } = useMemo(() => {
    const glass = new MeshPhysicalMaterial({
      color: new Color("#a8dcff"),
      transparent: true,
      opacity: 0.1,
      roughness: 0.05,
      metalness: 0,
      side: DoubleSide,
      depthWrite: false,
    });
    // a neutral studio environment so the metal and plastic read well without any texture download
    const pmrem = new PMREMGenerator(gl);
    const env: Texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const scene = gltf.scene.clone(true);
    scene.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as Material & { envMap?: Texture | null; envMapIntensity?: number };
      if (mat.name.startsWith("Glass")) {
        mesh.material = glass;
        mesh.renderOrder = 5;
        return;
      }
      mat.envMap = env;
      mat.envMapIntensity = 0.55;
      mat.needsUpdate = true;
    });
    return { scene, glass, env };
  }, [gltf, gl]);

  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);
  useEffect(
    () => () => {
      glass.dispose();
      env.dispose();
    },
    [glass, env]
  );

  return (
    <group
      ref={root}
      scale={MODEL_SCALE}
      rotation={[0, Math.PI, 0]}
      position={[MODEL_SCALE * MODEL_EYE[0], -MODEL_SCALE * MODEL_EYE[1], MODEL_SCALE * MODEL_EYE[2]]}
    >
      <primitive object={scene} />
      <pointLight position={[0, 1.75, 0.45]} color="#38bdf8" intensity={2.5} distance={4} />
      <pointLight position={[0, 1.3, 0.7]} color="#ff9a4d" intensity={1.6} distance={3} />
      <Screens />
      <HoloButton />
      <Hologram />
    </group>
  );
}
