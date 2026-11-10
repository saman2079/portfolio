"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, ShaderMaterial, Vector3 } from "three";
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

export function StormShell({ radius }: { radius: number }) {
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
  useFrame((state) => {
    material.uniforms["uTime"]!.value = state.clock.elapsedTime;
  });
  return (
    <mesh material={material} scale={1.014} renderOrder={2}>
      <sphereGeometry args={[radius, 64, 44]} />
    </mesh>
  );
}
