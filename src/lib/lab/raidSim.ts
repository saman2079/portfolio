import { baseStore, PLATFORM } from "@/lib/lab/baseStore";
import { atk, enterAttack, scoutBusy } from "@/lib/lab/attackSim";
import { gameStore } from "@/lib/lab/gameStore";
import { BASES, cooldownLeft, discover, markCleared } from "@/lib/lab/scoutSim";
import { sim, type Enemy } from "@/lib/lab/waveSim";

/**
 * Phase 7: the enemy bases out on the map. In attack mode you walk (or fast-travel) out of the colony
 * to an enemy base; its garrison wakes up when you get close. Kill every defender to take the base and
 * its loot. While you are away the colony keeps being raided, and the raiders come from the enemy
 * bases that are still standing: take a base down and the waves from it stop.
 * The garrison lives in sim.defenders so the same renderer, bullets and damage as for raiders apply.
 */
const SPAWN_NEAR = 60;
const DESPAWN_FAR = 100;
const AGGRO = 17;
const LEASH = 42;
const FOUND_NEAR = 45;
/** where fast travel drops you, outside the garrison's wake-up range */
const ARRIVE = 36;

export const raid = {
  /** the base you took most recently, shown as a banner */
  result: null as null | { id: number; c: number; e: number; at: number },
  /** garrison size per spawned base (a base is in this map while its garrison is out) */
  spawned: {} as Record<number, number>,
};

/** a base whose defenders are up (not recently taken) */
const standing = (id: number) => cooldownLeft(id) === 0;

// waves come from the enemy bases that still stand; none left = a quiet spell
sim.pickOrigin = () => {
  const up = BASES.filter((b) => standing(b.id));
  if (!up.length) return null;
  const b = up[Math.floor(Math.random() * up.length)]!;
  return { id: b.id, angle: Math.atan2(b.z - PLATFORM.z, b.x - PLATFORM.x), mul: 0.5 + (up.length / BASES.length) * 0.5 };
};

/** fast travel: walk out of the colony to just outside an enemy base. Works from strategy view or in attack mode. */
export function travelTo(id: number): boolean {
  const b = BASES[id];
  if (!b || !baseStore.get().mode || scoutBusy.on) return false;
  const x = b.x;
  const z = b.z + ARRIVE;
  if (!atk.on) enterAttack({ x, z });
  else {
    atk.x = atk.camX = x;
    atk.z = atk.camZ = z;
  }
  if (atk.on) {
    atk.face = Math.PI;
    return true;
  }
  return false;
}

function clearGarrisons() {
  sim.defenders = [];
  raid.spawned = {};
}

function spawnGarrison(id: number) {
  const b = BASES[id]!;
  const n = 5 + b.power * 3;
  const hpMul = 1 + 0.35 * (b.power - 1);
  const dpsMul = 1 + 0.2 * (b.power - 1);
  for (let i = 0; i < n; i++) {
    // a ring of defenders around the keep; every third one is a brute
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const r = 9 + Math.random() * 11;
    const brute = i % 3 === 2;
    const hp = (brute ? 140 : 30) * hpMul;
    const e: Enemy = {
      id: sim.nextId++,
      kind: brute ? "brute" : "scout",
      x: b.x + Math.sin(a) * r,
      z: b.z + Math.cos(a) * r,
      hp,
      max: hp,
      speed: brute ? 2.6 : 4.6,
      dps: (brute ? 16 : 5) * dpsMul,
      target: `b${id}`,
      face: 0,
    };
    sim.defenders.push(e);
  }
  raid.spawned[id] = n;
}

export function updateRaid(rawDt: number) {
  const dt = Math.min(rawDt, 0.05);
  if (!atk.on) {
    if (sim.defenders.length || Object.keys(raid.spawned).length) clearGarrisons();
    return;
  }
  for (const b of BASES) {
    const d = Math.hypot(b.x - atk.x, b.z - atk.z);
    if (d < FOUND_NEAR) discover(b.id);
    const up = standing(b.id);
    const out = raid.spawned[b.id] !== undefined;
    if (up && !out && d < SPAWN_NEAR) spawnGarrison(b.id);
    else if (out && d > DESPAWN_FAR) {
      // walked away: the garrison goes back to its post (fresh next time)
      sim.defenders = sim.defenders.filter((e) => e.target !== `b${b.id}`);
      delete raid.spawned[b.id];
    }
  }

  for (const e of sim.defenders) {
    if (e.hp <= 0) continue;
    const b = BASES[Number(e.target!.slice(1))]!;
    const dx = atk.x - e.x;
    const dz = atk.z - e.z;
    const d = Math.hypot(dx, dz) || 1;
    // defenders wait until you come close (or one of them is shot), then charge; the last few always do
    const left = sim.defenders.filter((o) => o.target === e.target && o.hp > 0).length;
    if (d < AGGRO || e.hp < e.max || left <= 3) {
      e.face = Math.atan2(dx, dz);
      if (d > 1.5) {
        e.x += (dx / d) * e.speed * dt;
        e.z += (dz / d) * e.speed * dt;
      }
    }
    const ox = e.x - b.x;
    const oz = e.z - b.z;
    const od = Math.hypot(ox, oz);
    if (od > LEASH) {
      e.x = b.x + (ox / od) * LEASH;
      e.z = b.z + (oz / od) * LEASH;
    }
  }
  sim.defenders = sim.defenders.filter((e) => e.hp > 0);

  // a base whose garrison is all dead is taken
  for (const key of Object.keys(raid.spawned)) {
    const id = Number(key);
    if (sim.defenders.some((e) => e.target === `b${id}`)) continue;
    const b = BASES[id]!;
    const r = gameStore.reward({ c: 90 * b.power, e: 60 * b.power });
    markCleared(id);
    delete raid.spawned[id];
    raid.result = { id, c: r.c, e: r.e, at: Date.now() };
  }
}
