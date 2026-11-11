"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MirroredRepeatWrapping,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Group,
} from "three";

/**
 * The two mountain tiles of the "Thunderstorm" model (Ludovico Antonicelli, CC BY-NC 4.0),
 * thinned from 75k to 12k vertices and arranged as a ring of ranges around the lab.
 * Inside RADIUS_IN they are dropped, so the flat landing ground and base builder stay clear.
 */
const SCALE = 0.5;
const RADIUS_IN = 190;
const RADIUS_FULL = 330;
const SUN = new Vector3(-0.3, 0.5, -0.8).normalize();
const sm = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function StormMountains({ lightning }: { lightning: { flash: number } }) {
  const gl = useThree((st) => st.gl);
  const root = useRef<Group>(null);
  const mats = useRef<MeshBasicMaterial[]>([]);

  useEffect(() => {
    const group = root.current;
    if (!group) return;
    let cancelled = false;
    const added: Mesh[] = [];
    const loader = new TextureLoader();
    // fine rock grain multiplied over the baked maps, so the slopes stay sharp up close
    const detail = loader.load("/models/storm/ground.jpg");
    detail.colorSpace = NoColorSpace;
    detail.wrapS = detail.wrapT = MirroredRepeatWrapping;
    detail.anisotropy = Math.min(12, gl.capabilities.getMaxAnisotropy());
    (async () => {
      const buf = await fetch("/models/storm/mtn.bin").then((r) => r.arrayBuffer());
      if (cancelled) return;
      const hl = new DataView(buf).getUint32(0, true);
      const meta = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl))) as { v: number; i: number }[];
      let off = 4 + hl;
      meta.forEach((m, k) => {
        const pos = new Float32Array(buf.slice(off, off + m.v * 12));
        off += m.v * 12;
        const uv = new Float32Array(buf.slice(off, off + m.v * 8));
        off += m.v * 8;
        const idx = new Uint16Array(buf.slice(off, off + m.i * 2));
        off += m.i * 2;

        // flatten the middle so the tiles rise out of the haze beyond the landing ground
        const f = new Float32Array(m.v);
        for (let i = 0; i < m.v; i++) {
          const x = pos[i * 3] as number;
          const z = pos[i * 3 + 2] as number;
          f[i] = sm(RADIUS_IN, RADIUS_FULL, Math.hypot(x, z) * SCALE);
          pos[i * 3 + 1] = (pos[i * 3 + 1] as number) + 260;
          const y = (pos[i * 3 + 1] as number) * SCALE;
          pos[i * 3 + 1] = (-3 + (y + 3) * (f[i] as number)) / SCALE;
        }
        const keep: number[] = [];
        for (let t = 0; t < idx.length; t += 3) {
          const a = idx[t] as number;
          const b = idx[t + 1] as number;
          const c = idx[t + 2] as number;
          if ((f[a] as number) + (f[b] as number) + (f[c] as number) > 0.003) keep.push(a, b, c);
        }
        const g = new BufferGeometry();
        g.setAttribute("position", new BufferAttribute(pos, 3));
        g.setAttribute("uv", new BufferAttribute(uv, 2));
        g.setIndex(keep);
        g.computeVertexNormals();
        const n = g.getAttribute("normal");
        const col = new Float32Array(m.v * 3);
        for (let i = 0; i < m.v; i++) {
          const l = Math.max(0, n.getX(i) * SUN.x + n.getY(i) * SUN.y + n.getZ(i) * SUN.z);
          const s = 0.42 + 0.85 * l;
          col[i * 3] = s * 0.95;
          col[i * 3 + 1] = s * 1.02;
          col[i * 3 + 2] = s * 1.15;
        }
        g.setAttribute("color", new BufferAttribute(col, 3));

        const t = loader.load(k === 0 ? "/models/storm/m1.jpg" : "/models/storm/m2.jpg");
        t.colorSpace = SRGBColorSpace;
        t.wrapS = t.wrapT = RepeatWrapping;
        t.anisotropy = Math.min(12, gl.capabilities.getMaxAnisotropy());
        const mat = new MeshBasicMaterial({ map: t, vertexColors: true, side: DoubleSide });
        mat.onBeforeCompile = (sh) => {
          sh.uniforms["uDet"] = { value: detail };
          sh.fragmentShader = "uniform sampler2D uDet;\n" + sh.fragmentShader.replace(
            "#include <map_fragment>",
            "#include <map_fragment>\n  diffuseColor.rgb *= 0.62 + texture2D(uDet, vMapUv * 13.0).r * 0.76;"
          );
        };
        mat.customProgramCacheKey = () => "storm-mtn-detail";
        mats.current.push(mat);
        const mesh = new Mesh(g, mat);
        mesh.scale.setScalar(SCALE);
        mesh.frustumCulled = false;
        group.add(mesh);
        added.push(mesh);
      });
    })().catch(() => undefined);
    return () => {
      cancelled = true;
      detail.dispose();
      mats.current = [];
      for (const m of added) {
        group.remove(m);
        (m.material as MeshBasicMaterial).map?.dispose();
        (m.material as MeshBasicMaterial).dispose();
        m.geometry.dispose();
      }
    };
  }, [gl]);

  // the mountains flare up with each lightning strike
  useFrame(() => {
    const k = 0.9 + lightning.flash * 3.2;
    for (const m of mats.current) m.color.setScalar(k);
  });

  return <group ref={root} />;
}
