"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  Fog,
  InstancedMesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  TextureLoader,
  Object3D,
  OctahedronGeometry,
  Points,
  ShaderMaterial,
  Vector3,
  type Group,
  type Mesh,
} from "three";
import { DESTINATIONS } from "@/lib/universe/destinations";
import { mulberry32 } from "@/lib/universe/random";
import { flightLive, flightStore } from "@/lib/store/flightStore";
import { BaseBuilder } from "./lab/BaseBuilder";
import { EYE, buildTerrain, heightAt, paramsFor } from "./surface/terrain";
import { skyFragment, skyVertex, terrainFragment, terrainVertex } from "./surface/shaders";

/** Planets whose sky (and far horizon) is a photographic skybox instead of the procedural dome. */
const SKYBOX: Record<string, { url: string; haze: string; ground: [string, string, string] }> = {
  experience: { url: "/models/alien-sky.jpg", haze: "#66463f", ground: ["#4a2219", "#8a4a34", "#c9875e"] },
};

/**
 * Ground under the ship for the photographic worlds: the photo's own ground, re-projected onto a
 * flat plane as if the photographer stood H metres up, so the hull sits on it instead of floating.
 */
const GROUND_H = 18;
const groundVertex = /* glsl */ `
  varying vec2 vLocal;
  void main() {
    vLocal = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const groundFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uH;
  varying vec2 vLocal;
  void main() {
    // circle geometry lies in XY; the mesh is rotated so local (x, y) -> world (x, -z)
    vec3 d = normalize(vec3(vLocal.x, -uH, -vLocal.y));
    float u = fract(atan(d.z, d.x) / 6.28318530718);
    float v = 1.0 - acos(clamp(d.y, -1.0, 1.0)) / 3.14159265359;
    vec3 c = texture2D(uMap, vec2(u, v)).rgb;
    float r = length(vLocal);
    gl_FragColor = vec4(c * 0.92, 1.0 - smoothstep(45.0, 120.0, r));
    #include <colorspace_fragment>
  }
`;

const SIZE = 900;
const SPORES = 320;

/**
 * The ground the ship lands on. Everything is built from the planet's own palette:
 * a yellow planet gives yellow dunes, a teal one teal crystal fields, and so on.
 * It is mounted only while a landing is under way and stays hidden otherwise.
 */
export function SurfaceWorld({ tier }: { tier: "high" | "low" }) {
  const landId = useSyncExternalStore(
    flightStore.subscribe,
    () => flightStore.get().landId,
    () => null
  );
  const cfg = landId ? DESTINATIONS.find((d) => d.id === landId) : undefined;
  if (!cfg) return null;
  return <Surface key={cfg.id} cfg={cfg} tier={tier} />;
}

function Surface({ cfg, tier }: { cfg: (typeof DESTINATIONS)[number]; tier: "high" | "low" }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const root = useRef<Group>(null);
  const dome = useRef<Mesh>(null);
  const spores = useRef<Points>(null);
  const camPos = useMemo(() => new Vector3(), []);

  const world = useMemo(() => {
    const params = paramsFor(cfg.seed, cfg.id);
    const keepClear = cfg.id === "lab" ? 52 : 0;
    const geometry = buildTerrain(params, SIZE, tier === "high" ? 200 : 120);

    const box = SKYBOX[cfg.id];
    const colorA = new Color(box ? box.ground[0] : cfg.colors[0]);
    const colorB = new Color(box ? box.ground[1] : cfg.colors[1]);
    const colorC = new Color(box ? box.ground[2] : cfg.colors[2]);
    const horizon = box ? new Color(box.haze) : new Color(cfg.atmosphere).lerp(colorC, 0.25).multiplyScalar(0.85);
    const zenith = colorA.clone().multiplyScalar(0.9);
    const sun = new Vector3(cfg.light[0] * 0.8, Math.min(0.5, Math.max(0.22, cfg.light[1])), -(Math.abs(cfg.light[2]) + 0.4)).normalize();

    const terrain = new ShaderMaterial({
      vertexShader: terrainVertex,
      fragmentShader: terrainFragment,
      uniforms: {
        uA: { value: colorA },
        uB: { value: colorB },
        uC: { value: colorC },
        uHorizon: { value: horizon },
        uSun: { value: sun },
        uAmp: { value: params.amp },
        uFog: { value: 0.0075 },
      },
    });
    let sky: ShaderMaterial | MeshBasicMaterial;
    let ground: ShaderMaterial | null = null;
    if (box) {
      ground = new ShaderMaterial({
        vertexShader: groundVertex,
        fragmentShader: groundFragment,
        transparent: true,
        depthWrite: false,
        uniforms: { uMap: { value: null }, uH: { value: GROUND_H } },
      });
      const m = new MeshBasicMaterial({ color: "#000000", side: BackSide, depthWrite: false, fog: false, toneMapped: false });
      new TextureLoader().load(box.url, (tex) => {
        tex.colorSpace = SRGBColorSpace;
        tex.anisotropy = 4;
        m.map = tex;
        if (ground) ground.uniforms["uMap"]!.value = tex;
        m.color.set("#ffffff");
        m.needsUpdate = true;
      });
      sky = m;
    } else sky = new ShaderMaterial({
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      side: BackSide,
      depthWrite: false,
      uniforms: {
        uHorizon: { value: horizon },
        uZenith: { value: zenith },
        uSunColor: { value: new Color("#ffffff").lerp(new Color(cfg.atmosphere), 0.3).multiplyScalar(2.2) },
        uSun: { value: sun },
        uTime: { value: 0 },
      },
    });

    // spires and glowing crystals standing on the real terrain height
    const rand = mulberry32(Math.floor(cfg.seed * 100) + 9);
    const spireCount = tier === "high" ? 70 : 34;
    const crystalCount = tier === "high" ? 120 : 56;
    const spires = Array.from({ length: spireCount }, () => {
      const a = rand() * Math.PI * 2;
      const r = Math.max(50, keepClear + 6) + rand() * 330;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const w = 5 + rand() * 14 * (0.4 + r / 330);
      return { x, z, y: heightAt(x, z, params), w, h: w * (2 + rand() * 3.5) };
    });
    const crystals = Array.from({ length: crystalCount }, () => {
      const a = rand() * Math.PI * 2;
      const r = Math.max(20, keepClear) + Math.pow(rand(), 1.6) * 300;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const w = 0.5 + rand() * 1.6 * (0.5 + r / 200);
      return { x, z, y: heightAt(x, z, params), w, h: w * (3 + rand() * 4), tilt: (rand() - 0.5) * 0.5, spin: rand() * 6.28 };
    });

    const sporePos = new Float32Array(SPORES * 3);
    const sporeBase = new Float32Array(SPORES * 3);
    for (let i = 0; i < SPORES; i++) {
      const a = rand() * Math.PI * 2;
      const r = 4 + rand() * 46;
      sporeBase[i * 3] = Math.cos(a) * r;
      sporeBase[i * 3 + 1] = 0.5 + rand() * 18;
      sporeBase[i * 3 + 2] = Math.sin(a) * r;
    }
    sporePos.set(sporeBase);
    const sporeGeo = new BufferGeometry();
    sporeGeo.setAttribute("position", new BufferAttribute(sporePos, 3));

    return {
      params,
      geometry,
      terrain,
      sky,
      spires,
      crystals,
      sporeGeo,
      sporeBase,
      sporePos,
      horizon,
      spireColor: colorB.clone().multiplyScalar(0.42),
      crystalColor: colorC.clone().multiplyScalar(2.4),
      sporeColor: colorC.clone().multiplyScalar(1.8),
      fog: new Fog(horizon.clone(), box ? 4000 : 30, box ? 5000 : 380),
      photo: Boolean(box),
      ground,
    };
  }, [cfg, tier]);

  const spireMesh = useRef<InstancedMesh>(null);
  const crystalMesh = useRef<InstancedMesh>(null);
  const spireGeo = useMemo(() => new ConeGeometry(1, 1, 6), []);
  const crystalGeo = useMemo(() => new OctahedronGeometry(1, 0), []);

  // place the instances once
  useEffect(() => {
    const d = new Object3D();
    const s = spireMesh.current;
    if (s) {
      world.spires.forEach((p, i) => {
        d.position.set(p.x, p.y + p.h * 0.4, p.z);
        d.rotation.set(0, i, 0);
        d.scale.set(p.w, p.h, p.w);
        d.updateMatrix();
        s.setMatrixAt(i, d.matrix);
      });
      s.instanceMatrix.needsUpdate = true;
    }
    const c = crystalMesh.current;
    if (c) {
      world.crystals.forEach((p, i) => {
        d.position.set(p.x, p.y + p.h * 0.75, p.z);
        d.rotation.set(0, p.spin, p.tilt);
        d.scale.set(p.w, p.h, p.w);
        d.updateMatrix();
        c.setMatrixAt(i, d.matrix);
      });
      c.instanceMatrix.needsUpdate = true;
    }
  }, [world]);

  // compile the shaders now, while the descent is still hiding behind the planet
  useEffect(() => {
    const r = root.current;
    if (!r) return;
    r.visible = true;
    const prevFog = scene.fog;
    scene.fog = world.fog;
    gl.compile(scene, camera);
    scene.fog = prevFog;
    r.visible = false;
  }, [gl, scene, camera, world]);

  useEffect(
    () => () => {
      world.geometry.dispose();
      world.terrain.dispose();
      if (world.sky instanceof MeshBasicMaterial) world.sky.map?.dispose();
      world.sky.dispose();
      world.ground?.dispose();
      world.sporeGeo.dispose();
      spireGeo.dispose();
      crystalGeo.dispose();
    },
    [world, spireGeo, crystalGeo]
  );

  useFrame((state) => {
    const r = root.current;
    if (!r) return;
    const on = flightLive.surface;
    r.visible = on;
    if (on) {
      if (scene.fog !== world.fog) scene.fog = world.fog;
    } else if (scene.fog === world.fog) {
      scene.fog = null;
    }
    if (!on) return;
    const t = state.clock.elapsedTime;
    state.camera.getWorldPosition(camPos);
    if (dome.current) dome.current.position.set(camPos.x, camPos.y + EYE, camPos.z);
    if (world.sky instanceof ShaderMaterial) {
      const su = world.sky.uniforms["uTime"];
      if (su) su.value = t;
    }
    // drifting spores
    const p = world.sporePos;
    const b = world.sporeBase;
    for (let i = 0; i < SPORES; i++) {
      const k = i * 3;
      p[k] = (b[k] ?? 0) + Math.sin(t * 0.3 + i) * 1.2;
      p[k + 1] = 0.4 + (((b[k + 1] ?? 0) + t * (0.25 + (i % 5) * 0.06)) % 20);
      p[k + 2] = (b[k + 2] ?? 0) + Math.cos(t * 0.27 + i * 1.3) * 1.2;
    }
    const attr = world.sporeGeo.getAttribute("position");
    attr.needsUpdate = true;
  });

  return (
    <group ref={root} position={[0, -EYE, 0]} visible={false}>
      <mesh ref={dome} material={world.sky} frustumCulled={false} renderOrder={-10} scale={[-1, 1, 1]}>
        <sphereGeometry args={[1400, 32, 16]} />
      </mesh>

      {world.ground && (
        <mesh material={world.ground} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} frustumCulled={false} renderOrder={-5}>
          <circleGeometry args={[130, 64]} />
        </mesh>
      )}

      {!world.photo && <mesh geometry={world.geometry} material={world.terrain} frustumCulled={false} />}

      {!world.photo && (
        <instancedMesh ref={spireMesh} args={[spireGeo, undefined, world.spires.length]} frustumCulled={false}>
          <meshStandardMaterial color={world.spireColor} roughness={0.92} flatShading />
        </instancedMesh>
      )}
      {!world.photo && (
        <instancedMesh ref={crystalMesh} args={[crystalGeo, undefined, world.crystals.length]} frustumCulled={false}>
          <meshBasicMaterial color={world.crystalColor} toneMapped={false} />
        </instancedMesh>
      )}

      <points ref={spores} geometry={world.sporeGeo} frustumCulled={false} visible={!world.photo}>
        <pointsMaterial
          color={world.sporeColor}
          size={0.16}
          sizeAttenuation
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>

      {cfg.id === "lab" && <BaseBuilder />}

      {/* landing pad under the hull */}
      <group position={[0, 0.04, 9.4]} rotation={[-Math.PI / 2, 0, 0]} scale={1.9}>
        {!world.photo && (
          <mesh>
            <ringGeometry args={[8.2, 8.7, 72]} />
            <meshBasicMaterial color={new Color(3.2, 1.3, 0.25)} toneMapped={false} />
          </mesh>
        )}
        {!world.photo && (
          <mesh>
            <ringGeometry args={[6.4, 6.55, 72]} />
            <meshBasicMaterial color={new Color(0.3, 1.6, 2.4)} toneMapped={false} />
          </mesh>
        )}
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[8.2, 72]} />
          <meshBasicMaterial color="#05080e" transparent opacity={0.55} />
        </mesh>
      </group>
    </group>
  );
}
