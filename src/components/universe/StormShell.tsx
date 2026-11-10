"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  DoubleSide,
  Matrix4,
  type Mesh,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  type Group,
} from "three";
import { SUN_POSITION } from "@/lib/universe/destinations";

/**
 * A thin storm layer around an ice planet: patchy dark cloud bands drifting over the surface and
 * lightning that flashes inside random cells of the cloud deck, so the lab looks wild from afar too.
 */
const vertex = /* glsl */ `
varying vec3 vObj;
varying vec3 vN;
void main() {
  vObj = normalize(position);
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = /* glsl */ `
uniform float uTime;
uniform vec3 uSun;
varying vec3 vObj;
varying vec3 vN;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z
  );
}
float fbm(vec3 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 4; i++) {
    s += a * noise(p);
    p = p * 2.03 + 11.7;
    a *= 0.5;
  }
  return s;
}

void main() {
  float c = cos(uTime * 0.035);
  float s = sin(uTime * 0.035);
  vec3 d = vec3(vObj.x * c - vObj.z * s, vObj.y, vObj.x * s + vObj.z * c);
  vec3 warp = d * 2.6 + vec3(0.0, uTime * 0.012, 0.0);
  float n = fbm(warp + 1.8 * fbm(warp * 0.7));
  float cover = smoothstep(0.44, 0.68, n);

  float light = clamp(dot(normalize(vN), uSun), 0.0, 1.0) * 0.85 + 0.1;
  vec3 col = mix(vec3(0.04, 0.05, 0.07), vec3(0.3, 0.34, 0.41), n) * light;

  // lightning: every cloud cell flashes now and then, lighting its own patch of the deck
  vec3 g = d * 4.2;
  vec3 cell = floor(g);
  float h = hash(cell);
  float slot = uTime * 0.14 + h * 9.0;
  float s0 = fract(slot);
  float on = step(0.55, hash(cell + floor(slot)));
  float flash = exp(-s0 * 34.0) * on * smoothstep(0.9, 0.0, length(g - cell - 0.5));
  vec3 glow = vec3(0.55, 0.72, 1.0) * flash * (0.6 + cover * 2.6);

  float alpha = clamp(cover * 0.88 + flash * 0.5, 0.0, 1.0);
  gl_FragColor = vec4(col + glow, alpha);
}
`;

/** The lightning bolts of the "Thunderstorm" model (Ludovico Antonicelli, CC BY-NC 4.0) as glowing cards. */
const boltVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const boltFragment = /* glsl */ `
uniform sampler2D uBolt;
uniform vec2 uRange;
uniform float uFlash;
varying vec2 vUv;
void main() {
  vec4 b = texture2D(uBolt, vec2(mix(uRange.x, uRange.y, vUv.x), vUv.y * 0.74));
  float a = b.a * b.r;
  gl_FragColor = vec4(vec3(0.7, 0.85, 1.4) * a * uFlash * 3.0, a * uFlash);
}
`;
const RANGES: [number, number][] = [
  [0.06, 0.26],
  [0.33, 0.4],
  [0.5, 0.64],
  [0.8, 0.87],
];
const BOLTS = 3;

interface Bolt {
  next: number;
  t0: number;
  dir: Vector3;
  range: number;
}

export function StormShell({ radius, bolts = true }: { radius: number; bolts?: boolean }) {
  const group = useRef<Group>(null);
  const cards = useRef<(Mesh | null)[]>([]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        uniforms: { uTime: { value: 0 }, uSun: { value: new Vector3(...SUN_POSITION).normalize() } },
      }),
    []
  );
  const boltMats = useMemo(() => {
    if (!bolts) return [];
    const tex = new TextureLoader().load("/models/storm/bolts.webp");
    tex.colorSpace = SRGBColorSpace;
    return Array.from(
      { length: BOLTS },
      () =>
        new ShaderMaterial({
          vertexShader: boltVertex,
          fragmentShader: boltFragment,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          side: DoubleSide,
          uniforms: { uBolt: { value: tex }, uRange: { value: new Vector2(0.06, 0.26) }, uFlash: { value: 0 } },
        })
    );
  }, [bolts]);
  useEffect(
    () => () => {
      material.dispose();
      (boltMats[0]?.uniforms["uBolt"]?.value as { dispose(): void } | undefined)?.dispose();
      for (const m of boltMats) m.dispose();
    },
    [material, boltMats]
  );

  const state = useMemo<Bolt[]>(
    () =>
      Array.from({ length: BOLTS }, (_, i) => ({ next: 1 + i * 2.1, t0: -10, dir: new Vector3(0, 1, 0), range: 0 })),
    []
  );
  const work = useMemo(() => ({ c: new Vector3(), cam: new Vector3(), up: new Vector3(), right: new Vector3(), fwd: new Vector3(), m: new Matrix4() }), []);

  useFrame((st) => {
    const t = st.clock.elapsedTime;
    material.uniforms["uTime"]!.value = t;
    const g = group.current;
    if (!g || !bolts) return;
    g.getWorldPosition(work.c);
    work.cam.copy(st.camera.position).sub(work.c).normalize();
    for (let i = 0; i < BOLTS; i++) {
      const b = state[i] as Bolt;
      const mesh = cards.current[i];
      const mat = boltMats[i];
      if (!mesh || !mat) continue;
      if (t > b.next) {
        b.t0 = t;
        b.next = t + 2.5 + Math.random() * 6;
        b.range = Math.floor(Math.random() * RANGES.length);
        // somewhere on the half of the planet that faces the camera
        work.up.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        b.dir.copy(work.cam).multiplyScalar(0.5).addScaledVector(work.up, 0.9).normalize();
        const rg = RANGES[b.range] as [number, number];
        (mat.uniforms["uRange"]!.value as Vector2).set(rg[0], rg[1]);
      }
      const tt = t - b.t0;
      const pulse = (x: number, a: number) => (x < 0 ? 0 : Math.exp(-x * a));
      const f = tt > 0.8 ? 0 : Math.max(pulse(tt, 9), 0.7 * pulse(tt - 0.15, 12));
      mat.uniforms["uFlash"]!.value = f;
      mesh.visible = f > 0.01;
      if (!mesh.visible) continue;
      // stand the card on the surface, growing outward, turned towards the camera
      work.up.copy(b.dir);
      work.right.crossVectors(work.up, work.cam).normalize();
      work.fwd.crossVectors(work.right, work.up);
      work.m.makeBasis(work.right, work.up, work.fwd);
      mesh.quaternion.setFromRotationMatrix(work.m);
      mesh.position.copy(b.dir).multiplyScalar(radius * 1.005);
      const rg = RANGES[b.range] as [number, number];
      const h = radius * 0.55;
      mesh.scale.set((((rg[1] - rg[0]) * 1024) / (0.74 * 512)) * h, h, 1);
      mesh.translateY(h * 0.5);
    }
  });
  return (
    <group ref={group}>
      <mesh material={material} scale={1.014} renderOrder={2}>
        <sphereGeometry args={[radius, 64, 44]} />
      </mesh>
      {boltMats.map((m, i) => (
        <mesh key={i} ref={(el) => void (cards.current[i] = el)} material={m} visible={false} renderOrder={3} frustumCulled={false}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}
