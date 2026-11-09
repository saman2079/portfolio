"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Color, Mesh, MeshStandardMaterial, type Group, type Object3D } from "three";
import type { PlanetModelKind } from "@/lib/universe/destinations";

export const PLANETS_URL = "/models/planets.glb";
useGLTF.preload(PLANETS_URL);

/**
 * "Various Planets" by feivelyn (CC BY 4.0, sketchfab.com/3d-models/various-planets-73c6c24e7c40409cafc6adacd5d71ff5).
 * Six of its worlds, each with its cloud layers. Textures were downscaled and the metal/rough maps dropped.
 */
const PARTS: Record<PlanetModelKind, { body: string; clouds: string[] }> = {
  smac: { body: "planet_smac_0", clouds: ["planet_smac_cloud_1"] },
  gas: { body: "planet_gas_2", clouds: ["planet_gas_cloud_01_3", "planet_gas_cloud_02_9"] },
  continental: { body: "planet_continental_4", clouds: ["planet_continental_clouds_5"] },
  frozen: { body: "planet_frozen_6", clouds: [] },
  lava: { body: "planet_lava_7", clouds: [] },
  barren: { body: "planet_barren_8", clouds: [] },
};

function tune(root: Object3D) {
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const m = mesh.material as MeshStandardMaterial;
    if (!m || m.userData["tuned"]) return;
    m.userData["tuned"] = true;
    m.metalness = 0;
    m.roughness = 0.85;
    m.metalnessMap = null;
    m.roughnessMap = null;
    if (m.transparent) {
      m.depthWrite = false;
    } else if (m.emissiveMap) {
      // the lava planet: its cracks glow
      m.emissiveIntensity = 2.4;
    } else if (m.map) {
      // a little self-light so the night side still shows its surface
      m.emissive = new Color("#ffffff");
      m.emissiveMap = m.map;
      m.emissiveIntensity = 0.16;
    }
    m.needsUpdate = true;
  });
}

/** A unit-radius planet from the model, scaled to `radius`. Its clouds drift a little faster than the ground. */
export function PlanetBody({ kind, radius }: { kind: PlanetModelKind; radius: number }) {
  const gltf = useGLTF(PLANETS_URL);
  const clouds = useRef<Group>(null);

  const parts = useMemo(() => {
    tune(gltf.scene);
    const spec = PARTS[kind];
    const pick = (name: string) => {
      const node = gltf.scene.getObjectByName(name);
      if (!node) return null;
      const c = node.clone(true);
      c.position.set(0, 0, 0);
      return c;
    };
    return { body: pick(spec.body), clouds: spec.clouds.map(pick).filter((c): c is Object3D => c !== null) };
  }, [gltf, kind]);

  useFrame((_, dt) => {
    if (clouds.current) clouds.current.rotation.y += dt * 0.015;
  });

  return (
    <group scale={radius}>
      {parts.body && <primitive object={parts.body} />}
      <group ref={clouds}>
        {parts.clouds.map((c) => (
          <primitive key={c.uuid} object={c} />
        ))}
      </group>
    </group>
  );
}
