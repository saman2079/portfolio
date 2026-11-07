"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  HalfFloatType,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderTarget,
  type Group,
  type Texture,
  type WebGLRenderer,
} from "three";
import { SUN_POSITION } from "@/lib/universe/destinations";
import { mulberry32 } from "@/lib/universe/random";
import { bakeFragment, bakeVertex, starFragment, starVertex } from "./shaders";

const tmp = new Vector3();

/** Renders the nebula once into a texture so the per-frame cost is a single texture read. */
function bakeNebula(gl: WebGLRenderer, width: number, height: number) {
  const target = new WebGLRenderTarget(width, height, {
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
    generateMipmaps: false,
  });
  const material = new ShaderMaterial({
    vertexShader: bakeVertex,
    fragmentShader: bakeFragment,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new Mesh(new PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const scene = new Scene();
  scene.add(quad);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const previous = gl.getRenderTarget();
  gl.setRenderTarget(target);
  gl.render(scene, camera);
  gl.setRenderTarget(previous);

  quad.geometry.dispose();
  material.dispose();
  return target;
}

function Stars({ count }: { count: number }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPx: { value: 1 } }), []);

  const geometry = useMemo(() => {
    const rand = mulberry32(5150);
    const position = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const color = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      position[i * 3] = s * Math.cos(a) * 800;
      position[i * 3 + 1] = u * 800;
      position[i * 3 + 2] = s * Math.sin(a) * 800;

      const roll = rand();
      const big = roll > 0.992;
      const mid = roll > 0.93;
      size[i] = big ? 4.5 + rand() * 2.5 : mid ? 2.2 + rand() * 1.2 : 1.1 + rand() * 0.9;
      const gain = big ? 3.2 : mid ? 1.5 : 0.8 + rand() * 0.5;
      const tint = rand();
      const r = tint > 0.8 ? 1.0 : tint < 0.35 ? 0.62 : 0.85;
      const g = tint > 0.8 ? 0.82 : tint < 0.35 ? 0.78 : 0.9;
      const b = tint > 0.8 ? 0.62 : 1.0;
      color[i * 3] = r * gain;
      color[i * 3 + 1] = g * gain;
      color[i * 3 + 2] = b * gain;
      phase[i] = rand();
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(position, 3));
    geo.setAttribute("aSize", new BufferAttribute(size, 1));
    geo.setAttribute("aColor", new BufferAttribute(color, 3));
    geo.setAttribute("aPhase", new BufferAttribute(phase, 1));
    return geo;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock, gl }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uPx.value = gl.getPixelRatio();
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={starVertex}
        fragmentShader={starFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

/** Nebula sphere + star shell. Follows the camera so it always reads as infinitely far away. */
export function Sky({ tier }: { tier: "high" | "low" }) {
  const gl = useThree((s) => s.gl);
  const group = useRef<Group>(null);
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    const w = tier === "high" ? 3072 : 1536;
    const target = bakeNebula(gl, w, w / 2);
    setTexture(target.texture);
    return () => {
      target.dispose();
    };
  }, [gl, tier]);

  useFrame(({ camera }) => {
    group.current?.position.copy(camera.getWorldPosition(tmp));
  });

  return (
    <group ref={group}>
      {texture && (
        <mesh renderOrder={-100} frustumCulled={false}>
          <sphereGeometry args={[900, 64, 32]} />
          <meshBasicMaterial map={texture} side={BackSide} depthWrite={false} toneMapped={false} fog={false} />
        </mesh>
      )}
      <Stars count={tier === "high" ? 4500 : 1800} />
    </group>
  );
}

function makeGlowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.08, "rgba(255,235,200,0.92)");
    g.addColorStop(0.25, "rgba(255,160,80,0.34)");
    g.addColorStop(0.6, "rgba(255,110,50,0.08)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

const SUN_TINT = new Color(2.4, 2.0, 1.5);
const STREAK_TINT = new Color(0.35, 0.65, 1.3);

export function Sun() {
  const texture = useMemo(makeGlowTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group position={SUN_POSITION}>
      <sprite scale={[120, 120, 1]}>
        <spriteMaterial map={texture} color={SUN_TINT} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </sprite>
      <sprite scale={[34, 34, 1]}>
        <spriteMaterial map={texture} color={SUN_TINT} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </sprite>
      {/* anamorphic streak */}
      <sprite scale={[340, 7, 1]}>
        <spriteMaterial map={texture} color={STREAK_TINT} transparent opacity={0.55} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </sprite>
    </group>
  );
}
