import { useSyncExternalStore } from "react";
import { PLATFORM, baseStore } from "@/lib/lab/baseStore";
import { atk, scoutBusy } from "@/lib/lab/attackSim";
import { gameStore, type Res } from "@/lib/lab/gameStore";
import { DESTINATIONS } from "@/lib/universe/destinations";
import { flightLive } from "@/lib/store/flightStore";
import { heightAt, paramsFor } from "@/components/universe/surface/terrain";

/**
 * Phase 6: the scouting drone. You launch it from the base (it costs a little energy), fly it over
 * the wasteland for a short while, and every enemy base it passes close to is revealed (and saved).
 * Pure state and rules (no three.js); DroneLayer.tsx draws it, ScoutUi.tsx feeds the input.
 * Everything is in surface-local x/z, like waveSim and attackSim. Attacking a base is a later phase.
 */
export const SCOUT_COST: Res = { c: 0, e: 25 };
export const DURATION = 45;
export const REVEAL = 30;
const SPEED = 24;
const ALT = 11;
/** how far from the plate centre the drone may go */
const LIMIT = 175;

export interface EnemyBase {
  id: number;
  x: number;
  z: number;
  /** ground height there (the terrain rises away from the landing area) */
  y: number;
  /** 1..3: how strong its defenders are (used when attacking bases comes in) */
  power: number;
}

const lab = DESTINATIONS.find((d) => d.id === "lab");
const params = paramsFor(lab?.seed ?? 4.1, "lab");
/** fixed places, ~105-130 units from the plate: far enough that the drone has to go and look */
const SPOTS: [number, number][] = [
  [96, -74],
  [-62, -118],
  [10, -150],
];
export const BASES: EnemyBase[] = SPOTS.map(([x, z], id) => ({ id, x, z, y: heightAt(x, z, params), power: id + 1 }));

/** a base you took stays quiet for this long, then its defenders are back */
export const COOLDOWN_MS = 8 * 60 * 1000;
const KEY = "lab-scout-v1";
export const scout = {
  on: false,
  x: 0,
  z: 0,
  y: 0,
  /** ground height under the drone */
  gy: 0,
  vx: 0,
  vz: 0,
  yaw: 0,
  left: DURATION,
  keys: { u: false, d: false, l: false, r: false },
  joy: { x: 0, y: 0 },
  /** ids of the bases found so far (saved) */
  found: [] as number[],
  /** when each base was last taken (ms since epoch), saved */
  cleared: {} as Record<number, number>,
  /** what the latest discovery paid */
  reward: { c: 0, e: 0 },
  /** the base found most recently, and when (clock seconds), for the banner and the beacon pulse */
  last: -1,
  lastAt: 0,
  clock: 0,
};

let loaded = false;
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const d = JSON.parse(raw) as { found?: number[]; cleared?: Record<number, number> };
    for (const [k, v] of Object.entries(d.cleared ?? {})) if (typeof v === "number") scout.cleared[Number(k)] = v;
    scout.found = (d.found ?? []).filter((n) => Number.isInteger(n) && n >= 0 && n < BASES.length);
  } catch {
    /* corrupt save: nothing found yet */
  }
}
function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ found: scout.found, cleared: scout.cleared }));
  } catch {
    /* private mode */
  }
}

let ver = 0;
const listeners = new Set<() => void>();
const notify = () => {
  ver++;
  listeners.forEach((l) => l());
};
const sub = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export function useScoutOn() {
  return useSyncExternalStore(sub, () => scout.on, () => false);
}
/** re-renders on every change of the discovered list; returns how many bases are known */
export function useScoutFound() {
  return useSyncExternalStore(
    sub,
    () => {
      load();
      return scout.found.length;
    },
    () => 0
  );
}
/** the base last discovered (or -1), changes with each discovery */
export function useScoutLast() {
  return useSyncExternalStore(sub, () => scout.last, () => -1);
}

export function isFound(id: number) {
  load();
  return scout.found.includes(id);
}

/** mark a base as found (by the drone, or by walking up to it) and pay the finder's fee */
export function discover(id: number) {
  load();
  const b = BASES[id];
  if (!b || scout.found.includes(id)) return;
  scout.found = [...scout.found, id];
  // finding a base pays a little: the stronger the base, the more
  scout.reward = gameStore.reward({ c: 40 * b.power, e: 20 * b.power });
  scout.last = id;
  scout.lastAt = scout.clock;
  save();
  notify();
}

export function enterScout(): boolean {
  load();
  if (!baseStore.get().mode || atk.on || scout.on) return false;
  if (!gameStore.spend(SCOUT_COST)) return false;
  gameStore.cancel();
  scout.x = atk.camX = PLATFORM.x;
  scout.z = atk.camZ = PLATFORM.z;
  scout.gy = 0;
  scout.y = ALT;
  scout.vx = scout.vz = 0;
  scout.yaw = Math.PI;
  scout.left = DURATION;
  scout.last = -1;
  scout.on = true;
  scoutBusy.on = true;
  atk.camH = 9;
  atk.camD = 11.5;
  atk.lookY = 1.1;
  flightLive.attack = true;
  notify();
  return true;
}

export function exitScout() {
  if (!scout.on) return;
  scout.on = false;
  scoutBusy.on = false;
  scout.keys = { u: false, d: false, l: false, r: false };
  scout.joy = { x: 0, y: 0 };
  flightLive.attack = false;
  notify();
}

export function updateScout(rawDt: number) {
  scout.clock += rawDt;
  if (!scout.on) return;
  const dt = Math.min(rawDt, 0.05);
  scout.left -= dt;
  if (scout.left <= 0) {
    scout.left = 0;
    exitScout();
    return;
  }
  const k = scout.keys;
  let ix = (k.r ? 1 : 0) - (k.l ? 1 : 0) + scout.joy.x;
  let iz = (k.d ? 1 : 0) - (k.u ? 1 : 0) + scout.joy.y;
  const len = Math.hypot(ix, iz);
  if (len > 1) {
    ix /= len;
    iz /= len;
  }
  // the drone eases into and out of its speed (it drifts a little, like a real one)
  const a = 1 - Math.exp(-dt * 3.5);
  scout.vx += (ix * SPEED - scout.vx) * a;
  scout.vz += (iz * SPEED - scout.vz) * a;
  scout.x += scout.vx * dt;
  scout.z += scout.vz * dt;
  const px = scout.x - PLATFORM.x;
  const pz = scout.z - PLATFORM.z;
  const pd = Math.hypot(px, pz);
  if (pd > LIMIT) {
    scout.x = PLATFORM.x + (px / pd) * LIMIT;
    scout.z = PLATFORM.z + (pz / pd) * LIMIT;
  }
  if (Math.hypot(scout.vx, scout.vz) > 1.5) scout.yaw = Math.atan2(scout.vx, scout.vz);

  // stay above the ground as it rises
  scout.gy = heightAt(scout.x, scout.z, params);
  scout.y += (scout.gy + ALT - scout.y) * (1 - Math.exp(-dt * 3));

  // reveal bases that the drone passes near
  for (const b of BASES) {
    if (scout.found.includes(b.id)) continue;
    if (Math.hypot(b.x - scout.x, b.z - scout.z) < REVEAL) discover(b.id);
  }

  // the camera follows the drone from higher up and further back than in attack mode
  const f = 1 - Math.exp(-dt * 5);
  atk.camX += (scout.x - atk.camX) * f;
  atk.camZ += (scout.z - atk.camZ) * f;
  const g = 1 - Math.exp(-dt * 3);
  atk.camH += (scout.y + 9 - atk.camH) * g;
  atk.camD += (15 - atk.camD) * g;
  atk.lookY += (scout.y - 2 - atk.lookY) * g;
}

/** ms until a taken base is defended again (0 = ready to attack) */
export function cooldownLeft(id: number) {
  load();
  const t = scout.cleared[id];
  return t ? Math.max(0, COOLDOWN_MS - (Date.now() - t)) : 0;
}
export function markCleared(id: number) {
  scout.cleared[id] = Date.now();
  save();
  notify();
}
