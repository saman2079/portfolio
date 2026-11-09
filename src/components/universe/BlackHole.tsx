"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, DoubleSide, ShaderMaterial, Vector3, type Group, type Mesh } from "three";

const POSITION: [number, number, number] = [-34, 16, -430];
const R = 14;

const discVertex = /* glsl */ `
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const discFragment = /* glsl */ `
  varying vec2 vP;
  uniform float uTime;
  uniform float uInner;
  uniform float uOuter;
  void main() {
    float r = length(vP);
    float a = atan(vP.y, vP.x);
    float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);
    // inner gas orbits faster than the outer gas
    float swirl = a - uTime * (1.6 / (0.25 + t * 1.6));
    float bands = 0.5 + 0.5 * sin(swirl * 7.0 + t * 26.0) * sin(swirl * 3.0 - t * 11.0 + 1.3);
    float heat = pow(1.0 - t, 1.7);
    vec3 col = mix(vec3(1.0, 0.32, 0.04), vec3(1.0, 0.93, 0.78), heat);
    // one side of the disc is brighter: the gas there moves towards us
    float doppler = 0.55 + 0.45 * cos(a - 0.7);
    float alpha = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.62, 1.0, t)) * (0.45 + 0.55 * bands);
    gl_FragColor = vec4(col * (1.1 + heat * 3.2) * doppler, alpha);
  }
`;
const haloFragment = /* glsl */ `
  varying vec2 vP;
  uniform float uInner;
  uniform float uOuter;
  uniform float uPower;
  void main() {
    float r = length(vP);
    float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);
    float a = pow(1.0 - t, uPower) * smoothstep(0.0, 0.04, t);
    gl_FragColor = vec4(vec3(1.0, 0.72, 0.42) * 3.0, a);
  }
`;

/**
 * A black hole far beyond the last planet: a black horizon, a swirling accretion disc, and a ring of
 * bent light that always faces the viewer (the "Interstellar" look). Ahead of the ship all the way along the route.
 */
export function BlackHole() {
  const root = useRef<Group>(null);
  const halo = useRef<Mesh>(null);
  const glow = useRef<Mesh>(null);
  const tmp = useMemo(() => new Vector3(), []);

  const mats = useMemo(() => {
    const disc = new ShaderMaterial({
      vertexShader: discVertex,
      fragmentShader: discFragment,
      uniforms: { uTime: { value: 0 }, uInner: { value: R * 1.5 }, uOuter: { value: R * 4.6 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      toneMapped: false,
    });
    const ring = new ShaderMaterial({
      vertexShader: discVertex,
      fragmentShader: haloFragment,
      uniforms: { uInner: { value: R * 1.0 }, uOuter: { value: R * 1.75 }, uPower: { value: 2.4 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      toneMapped: false,
    });
    const aura = new ShaderMaterial({
      vertexShader: discVertex,
      fragmentShader: haloFragment,
      uniforms: { uInner: { value: R * 1.2 }, uOuter: { value: R * 9 }, uPower: { value: 3.2 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      toneMapped: false,
    });
    return { disc, ring, aura };
  }, []);
  useEffect(
    () => () => {
      mats.disc.dispose();
      mats.ring.dispose();
      mats.aura.dispose();
    },
    [mats]
  );

  useFrame((state) => {
    const u = mats.disc.uniforms["uTime"];
    if (u) u.value = state.clock.elapsedTime;
    // the lensed ring and glow always face the camera
    const cam = state.camera.getWorldPosition(tmp);
    halo.current?.lookAt(cam);
    glow.current?.lookAt(cam);
  });

  return (
    <group ref={root} position={POSITION}>
      <mesh ref={glow} material={mats.aura} renderOrder={1}>
        <planeGeometry args={[R * 20, R * 20]} />
      </mesh>
      {/* disc, tilted so it is seen from a little above */}
      <group rotation={[1.28, 0.1, -0.28]}>
        <mesh material={mats.disc} renderOrder={2}>
          <ringGeometry args={[R * 1.4, R * 4.7, 160, 1]} />
        </mesh>
      </group>
      <mesh ref={halo} material={mats.ring} renderOrder={3}>
        <ringGeometry args={[R * 0.95, R * 1.8, 96, 1]} />
      </mesh>
      <mesh renderOrder={4}>
        <sphereGeometry args={[R, 48, 32]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
    </group>
  );
}
