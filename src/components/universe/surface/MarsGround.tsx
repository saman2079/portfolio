"use client";

import { useEffect, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Group,
} from "three";

/**
 * A real Mars rover photogrammetry scan ("Mars landscape" by David Vacas Madrid, CC BY 4.0),
 * thinned from 137k to 10k vertices and laid under the landing site. Its edges fade into the
 * procedural terrain around it and its centre is flattened so the landing pad sits level.
 */
const SCALE = 5.5;
const RELIEF = 2.2;
const SUN = new Vector3(0.5, 0.6, -0.4).normalize();

const vertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec2 vXZ;
void main() {
  vUv = uv;
  vN = normalize(normalMatrix * normal);
  vXZ = position.xz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const fragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uSun;
uniform vec2 uHalf;
uniform vec3 uTint;
varying vec2 vUv;
varying vec3 vN;
varying vec2 vXZ;
void main() {
  vec3 c = texture2D(uMap, vUv).rgb * uTint;
  float edge = length(vXZ / uHalf);
  float a = 1.0 - smoothstep(0.55, 0.97, edge);
  gl_FragColor = vec4(c * (0.8 + 0.25 * abs(vN.y)), a);
  #include <colorspace_fragment>
}
`;

export function MarsGround() {
  const root = useRef<Group>(null);

  useEffect(() => {
    const group = root.current;
    if (!group) return;
    let cancelled = false;
    let mesh: Mesh | null = null;
    (async () => {
      const buf = await fetch("/models/mars/mars.bin").then((r) => r.arrayBuffer());
      if (cancelled) return;
      const hl = new DataView(buf).getUint32(0, true);
      const m = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl))) as { v: number; i: number; half: [number, number] };
      let off = 4 + hl;
      const pos = new Float32Array(buf.slice(off, off + m.v * 12));
      off += m.v * 12;
      const uv = new Float32Array(buf.slice(off, off + m.v * 8));
      off += m.v * 8;
      const idx = new Uint16Array(buf.slice(off, off + m.i * 2));

      // level the middle (landing pad) and keep the relief gentle
      for (let i = 0; i < m.v; i++) {
        const x = (pos[i * 3] as number) * SCALE;
        const z = (pos[i * 3 + 2] as number) * SCALE;
        const r = Math.hypot(x, z);
        const t = Math.min(1, Math.max(0, (r - 14) / 22));
        pos[i * 3 + 1] = (pos[i * 3 + 1] as number) * RELIEF * (t * t * (3 - 2 * t)) / SCALE;
      }
      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(pos, 3));
      g.setAttribute("uv", new BufferAttribute(uv, 2));
      g.setIndex(new BufferAttribute(idx, 1));
      g.computeVertexNormals();

      const tex = new TextureLoader().load("/models/mars/mars.jpg");
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 8;
      const mat = new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        uniforms: {
          uMap: { value: tex },
          uSun: { value: SUN },
          uHalf: { value: [m.half[0], m.half[1]] },
          uTint: { value: new Vector3(1.0, 0.82, 0.7) },
        },
      });
      mesh = new Mesh(g, mat);
      mesh.scale.setScalar(SCALE);
      mesh.position.y = 0.05;
      mesh.frustumCulled = false;
      mesh.renderOrder = 1;
      group.add(mesh);
    })().catch(() => undefined);
    return () => {
      cancelled = true;
      if (mesh) {
        group.remove(mesh);
        mesh.geometry.dispose();
        const mat = mesh.material as ShaderMaterial;
        (mat.uniforms["uMap"]!.value as { dispose(): void }).dispose();
        mat.dispose();
      }
    };
  }, []);

  return <group ref={root} />;
}
