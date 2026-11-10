"use client";

import { useEffect, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Group,
} from "three";

/**
 * The whole ground of a planet, taken from a scanned terrain model thinned to ~35k vertices:
 *  - contact: "Canyon Landscape" by Šimon Ustal (CC BY 4.0), a river canyon
 *  - skills:  "Crater City - Terrain" by artfromheath (CC BY 4.0), layered eroded mesas
 * The ship lands on a flat spot chosen offline; the middle is levelled for the landing pad and
 * distance fog hides the model's edges.
 */
export interface ScanConfig {
  dir: string;
  scale: number;
  vscale: number;
  /** radians; turns the model so its nearest edge ends up behind the pilot */
  yaw: number;
  fog: number;
  wall: [[number, number, number], [number, number, number]];
}
const SUN = new Vector3(0.5, 0.6, -0.4).normalize();

const vertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
const fragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uSun;
uniform vec3 uHaze;
uniform float uFog;
uniform vec3 uWallA;
uniform vec3 uWallB;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vWorld;

float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y);
}

void main() {
  vec3 N = normalize(vN);
  vec3 top = texture2D(uMap, vUv).rgb;
  // the painted map is a top-down view: on steep walls it smears, so walls get banded rock instead
  float slope = 1.0 - clamp(N.y, 0.0, 1.0);
  float strata = 0.5 + 0.5 * sin(vWorld.y * 0.9 + n2(vWorld.xz * 0.05) * 6.0);
  vec3 wall = mix(uWallA, uWallB, strata);
  vec3 c = mix(top * 1.15, wall, smoothstep(0.16, 0.42, slope));
  // fine grain so the ground keeps detail close up
  c *= 0.84 + 0.2 * n2(vWorld.xz * 0.7) + 0.12 * n2(vWorld.xz * 3.1);
  float light = 0.5 + 0.7 * max(dot(N, uSun), 0.0);
  c *= light;
  float d = length(vWorld - cameraPosition);
  c = mix(c, uHaze, 1.0 - exp(-d * uFog));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}
`;

export function ScanGround({ haze, cfg }: { haze: string; cfg: ScanConfig }) {
  const root = useRef<Group>(null);

  useEffect(() => {
    const group = root.current;
    if (!group) return;
    let cancelled = false;
    let mesh: Mesh | null = null;
    (async () => {
      const buf = await fetch(`/models/${cfg.dir}/${cfg.dir}.bin`).then((r) => r.arrayBuffer());
      if (cancelled) return;
      const hl = new DataView(buf).getUint32(0, true);
      const m = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl))) as { v: number; i: number };
      let off = 4 + hl;
      const pos = new Float32Array(buf.slice(off, off + m.v * 12));
      off += m.v * 12;
      const uv = new Float32Array(buf.slice(off, off + m.v * 8));
      off += m.v * 8;
      const idx = new Uint16Array(buf.slice(off, off + m.i * 2));

      // level the landing site (the model's floor is almost flat there, this makes it exact)
      for (let i = 0; i < m.v; i++) {
        const r = Math.hypot(pos[i * 3] as number, pos[i * 3 + 2] as number) * cfg.scale;
        const t = Math.min(1, Math.max(0, (r - 18) / 30));
        pos[i * 3 + 1] = (pos[i * 3 + 1] as number) * (t * t * (3 - 2 * t)) * cfg.vscale;
        pos[i * 3] = (pos[i * 3] as number) * cfg.scale;
        pos[i * 3 + 2] = (pos[i * 3 + 2] as number) * cfg.scale;
      }
      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(pos, 3));
      g.setAttribute("uv", new BufferAttribute(uv, 2));
      g.setIndex(new BufferAttribute(idx, 1));
      g.computeVertexNormals();

      const tex = new TextureLoader().load(`/models/${cfg.dir}/${cfg.dir}.jpg`);
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 8;
      const mat = new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uMap: { value: tex },
          uSun: { value: SUN },
          uHaze: { value: new Color(haze) },
          uFog: { value: cfg.fog },
          uWallA: { value: new Vector3(...cfg.wall[0]) },
          uWallB: { value: new Vector3(...cfg.wall[1]) },
        },
      });
      mesh = new Mesh(g, mat);
      // turn the canyon so the nearest edge of the model is behind the pilot
      mesh.rotation.y = cfg.yaw;
      mesh.frustumCulled = false;
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
  }, [haze, cfg]);

  return <group ref={root} />;
}
