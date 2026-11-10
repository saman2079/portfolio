"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Group,
  type Texture,
} from "three";
import { mulberry32 } from "@/lib/universe/random";

/**
 * A fir forest at dusk built from "landscape forest & mountains" by dasy444 (CC BY 4.0).
 *
 * The original is 3687 separate meshes (15 MB). Here the same textures, repacked to ~0.8 MB,
 * are drawn as 5 instanced meshes of crossed alpha-tested cards (grass, three kinds of tree),
 * one big grass plane and a ring of the model's two mountain meshes: about a dozen draw calls.
 */

const BASE = "/models/forest/";
const CLEAR = 26; // radius kept free around the ship
const SUN = new Vector3(-0.55, 0.45, -0.7).normalize();

interface Kind {
  tex: string;
  /** height range, world units */
  h: [number, number];
  /** width / height */
  aspect: number;
  /** share of the trees (or grass) */
  share: number;
  cutoff: number;
}

const TREES: Kind[] = [
  { tex: "f1", h: [10, 20], aspect: 0.62, share: 0.22, cutoff: 0.62 },
  { tex: "f2", h: [13, 27], aspect: 0.61, share: 0.66, cutoff: 0.55 },
  { tex: "f3", h: [12, 24], aspect: 0.62, share: 0.12, cutoff: 0.5 },
];
const GRASS: Kind[] = [
  { tex: "g1", h: [0.9, 1.7], aspect: 1.0, share: 0.55, cutoff: 0.5 },
  { tex: "g2", h: [0.8, 1.5], aspect: 1.05, share: 0.45, cutoff: 0.6 },
];

/** Two crossed vertical quads standing on y = 0; vertex colour darkens the base. */
function cardGeometry() {
  const g = new BufferGeometry();
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  for (let k = 0; k < 2; k++) {
    const c = k === 0 ? [1, 0] : [0, 1];
    const b = pos.length / 3;
    for (const [u, v] of [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ] as const) {
      pos.push((u - 0.5) * (c[0] ?? 0), v, (u - 0.5) * (c[1] ?? 0));
      uv.push(u, v);
      const s = 0.42 + 0.58 * Math.min(1, v * 1.4);
      col.push(s, s, s);
    }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  g.setAttribute("color", new BufferAttribute(new Float32Array(col), 3));
  g.setIndex(idx);
  return g;
}

export function Forest({ tier, tint }: { tier: "high" | "low"; tint: string }) {
  const root = useRef<Group>(null);

  const world = useMemo(() => {
    const loader = new TextureLoader();
    const textures: Texture[] = [];
    const tex = (name: string, ext = "webp", repeat = false) => {
      const t = loader.load(`${BASE}${name}.${ext}`);
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 4;
      if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
      textures.push(t);
      return t;
    };

    const tintColor = new Color(tint);
    const geo = cardGeometry();
    const rand = mulberry32(20261109);
    const dummy = new Object3D();

    const scatter = (kinds: Kind[], total: number, rMin: number, rMax: number, curve: number) => {
      const meshes: InstancedMesh[] = [];
      const mats: MeshBasicMaterial[] = [];
      // a few cluster centres make the forest read as groves rather than uniform noise
      const clusters = Array.from({ length: 34 }, () => {
        const a = rand() * Math.PI * 2;
        const r = rMin + Math.pow(rand(), curve) * (rMax - rMin);
        return [Math.cos(a) * r, Math.sin(a) * r] as const;
      });
      for (const k of kinds) {
        const count = Math.round(total * k.share);
        const mat = new MeshBasicMaterial({
          map: tex(k.tex),
          alphaTest: k.cutoff,
          side: DoubleSide,
          vertexColors: true,
          color: tintColor,
        });
        const mesh = new InstancedMesh(geo, mat, count);
        mesh.frustumCulled = false;
        for (let i = 0; i < count; i++) {
          let x: number;
          let z: number;
          if (rand() < 0.55) {
            const c = clusters[Math.floor(rand() * clusters.length)] as readonly [number, number];
            const spread = 18 + rand() * 40;
            x = c[0] + (rand() - 0.5) * spread * 2;
            z = c[1] + (rand() - 0.5) * spread * 2;
          } else {
            const a = rand() * Math.PI * 2;
            const r = rMin + Math.pow(rand(), curve) * (rMax - rMin);
            x = Math.cos(a) * r;
            z = Math.sin(a) * r;
          }
          // push anything that landed inside the landing clearing out of it
          const d = Math.hypot(x, z - 6);
          if (d < rMin) {
            const s = (rMin + rand() * 14) / Math.max(d, 0.001);
            x *= s;
            z = (z - 6) * s + 6;
          }
          const h = k.h[0] + rand() * (k.h[1] - k.h[0]);
          dummy.position.set(x, 0, z);
          dummy.rotation.set(0, rand() * Math.PI, 0);
          dummy.scale.set(h * k.aspect, h, h * k.aspect);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        meshes.push(mesh);
        mats.push(mat);
      }
      return { meshes, mats };
    };

    const trees = scatter(TREES, tier === "high" ? 760 : 380, CLEAR + 4, 430, 1.35);
    const grass = scatter(GRASS, tier === "high" ? 2400 : 1000, CLEAR - 6, 190, 1.5);

    const groundMat = new MeshBasicMaterial({ map: tex("ground", "jpg", true), color: tintColor });
    groundMat.map!.repeat.set(70, 70);

    return { geo, trees, grass, groundMat, textures, tintColor, rand };
  }, [tier, tint]);

  // the two mountain meshes of the model, arranged as a distant ring
  useEffect(() => {
    const group = root.current;
    if (!group) return;
    let cancelled = false;
    const added: Mesh[] = [];
    const loader = new TextureLoader();
    (async () => {
      const buf = await fetch(`${BASE}mtn.bin`).then((r) => r.arrayBuffer());
      if (cancelled) return;
      const hl = new DataView(buf).getUint32(0, true);
      const meta = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl))) as { v: number; i: number }[];
      let off = 4 + hl;
      const geos = meta.map((m) => {
        const pos = new Float32Array(buf.slice(off, off + m.v * 12));
        off += m.v * 12;
        const uv = new Float32Array(buf.slice(off, off + m.v * 8));
        off += m.v * 8;
        const idx = new Uint16Array(buf.slice(off, off + m.i * 2));
        off += m.i * 2;
        const g = new BufferGeometry();
        g.setAttribute("position", new BufferAttribute(pos, 3));
        g.setAttribute("uv", new BufferAttribute(uv, 2));
        g.setIndex(new BufferAttribute(idx, 1));
        g.computeVertexNormals();
        // baked sun shading so the ridges read without relying on scene lights
        const n = g.getAttribute("normal");
        const col = new Float32Array(m.v * 3);
        for (let i = 0; i < m.v; i++) {
          const l = Math.max(0, n.getX(i) * SUN.x + n.getY(i) * SUN.y + n.getZ(i) * SUN.z);
          const s = 0.32 + 0.78 * l;
          col[i * 3] = s * 1.05;
          col[i * 3 + 1] = s * 0.95;
          col[i * 3 + 2] = s * 0.92;
        }
        g.setAttribute("color", new BufferAttribute(col, 3));
        return g;
      });
      const mats = ["rock1", "rock2"].map((n) => {
        const t = loader.load(`${BASE}${n}.jpg`);
        t.colorSpace = SRGBColorSpace;
        t.wrapS = t.wrapT = RepeatWrapping;
        t.repeat.set(2, 2);
        return new MeshBasicMaterial({ map: t, vertexColors: true, side: DoubleSide, color: world.tintColor });
      });
      const rand = mulberry32(77);
      const N = 7;
      for (let i = 0; i < N; i++) {
        const k = i % 2;
        const m = new Mesh(geos[k], mats[k]);
        const a = (i / N) * Math.PI * 2 + rand() * 0.3;
        const r = 520 + rand() * 60;
        const s = 4.6 + rand() * 1.8;
        m.position.set(Math.cos(a) * r, -2, Math.sin(a) * r);
        m.rotation.y = rand() * Math.PI * 2;
        m.scale.set(s, s * (0.8 + rand() * 0.4), s);
        m.frustumCulled = false;
        group.add(m);
        added.push(m);
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
      for (const m of added) {
        group.remove(m);
        (m.material as MeshBasicMaterial).map?.dispose();
        (m.material as MeshBasicMaterial).dispose();
        m.geometry.dispose();
      }
    };
  }, [world]);

  useEffect(
    () => () => {
      world.geo.dispose();
      for (const m of [...world.trees.mats, ...world.grass.mats, world.groundMat]) m.dispose();
      for (const t of world.textures) t.dispose();
    },
    [world]
  );

  return (
    <group ref={root}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={world.groundMat} frustumCulled={false}>
        <circleGeometry args={[760, 48]} />
      </mesh>
      {world.grass.meshes.map((m, i) => (
        <primitive key={`g${i}`} object={m} />
      ))}
      {world.trees.meshes.map((m, i) => (
        <primitive key={`t${i}`} object={m} />
      ))}
    </group>
  );
}
