import { BufferAttribute, BufferGeometry } from "three";

/** Pilot's eye height above the ground while landed. */
export const EYE = 1.5;

export interface TerrainParams {
  amp: number;
  freq: number;
  seed: number;
  ridge: number;
  /** radius of the flat landing area */
  flat: number;
}

/** Each planet gets its own relief, derived from its seed. */
export function paramsFor(seed: number, id?: string): TerrainParams {
  const k = Math.floor(seed * 10);
  return { amp: 7 + (k % 5) * 2.2, freq: 0.01 + (k % 4) * 0.0035, seed: k, ridge: (((k * 7) % 10) / 10) * 0.8, flat: id === "lab" ? 44 : 16 };
}

/* CPU value noise (integer hash, deterministic) so spires can stand exactly on the terrain. */
const hash2 = (x: number, y: number, s: number) => {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
function vn(x: number, y: number, s: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi, s);
  const b = hash2(xi + 1, yi, s);
  const c = hash2(xi, yi + 1, s);
  const d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm2(x: number, y: number, s: number) {
  let a = 0.5;
  let sum = 0;
  for (let i = 0; i < 5; i++) {
    sum += a * vn(x, y, s);
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 9.7;
    a *= 0.5;
  }
  return sum;
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Ground height at (x, z); flat around the landing pad, rising towards the horizon. */
export function heightAt(x: number, z: number, p: TerrainParams) {
  const r = Math.hypot(x, z);
  const far = smooth(p.flat, p.flat + 54, r);
  if (far === 0) return 0;
  const n = fbm2(x * p.freq, z * p.freq, p.seed);
  const rg = 1 - Math.abs(2 * fbm2(x * p.freq * 0.7 + 13, z * p.freq * 0.7 + 13, p.seed * 2 + 1) - 1);
  const h = n + (rg * rg - n) * p.ridge;
  return (h - 0.4) * p.amp * (1 + r * 0.004) * far;
}

export function buildTerrain(p: TerrainParams, size: number, seg: number) {
  const step = size / seg;
  const n = seg + 1;
  const stride = seg + 3;
  const heights = new Float32Array(stride * stride);
  for (let j = 0; j < stride; j++) {
    for (let i = 0; i < stride; i++) {
      heights[j * stride + i] = heightAt((i - 1) * step - size / 2, (j - 1) * step - size / 2, p);
    }
  }
  const pos = new Float32Array(n * n * 3);
  const nor = new Float32Array(n * n * 3);
  const aH = new Float32Array(n * n);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const k = j * n + i;
      const c = (j + 1) * stride + (i + 1);
      const h = heights[c] ?? 0;
      pos[k * 3] = i * step - size / 2;
      pos[k * 3 + 1] = h;
      pos[k * 3 + 2] = j * step - size / 2;
      const dx = ((heights[c + 1] ?? 0) - (heights[c - 1] ?? 0)) / (2 * step);
      const dz = ((heights[c + stride] ?? 0) - (heights[c - stride] ?? 0)) / (2 * step);
      const l = Math.hypot(dx, 1, dz);
      nor[k * 3] = -dx / l;
      nor[k * 3 + 1] = 1 / l;
      nor[k * 3 + 2] = -dz / l;
      aH[k] = h;
    }
  }
  const index = new Uint32Array(seg * seg * 6);
  let o = 0;
  for (let j = 0; j < seg; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * n + i;
      const b = a + 1;
      const c = a + n;
      const d = c + 1;
      index[o++] = a;
      index[o++] = c;
      index[o++] = b;
      index[o++] = b;
      index[o++] = c;
      index[o++] = d;
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("normal", new BufferAttribute(nor, 3));
  geo.setAttribute("aH", new BufferAttribute(aH, 1));
  geo.setIndex(new BufferAttribute(index, 1));
  geo.computeBoundingSphere();
  return geo;
}
