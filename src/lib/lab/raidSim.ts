import { baseStore } from "@/lib/lab/baseStore";
import { atk, enterAttack, exitAttack, scoutBusy } from "@/lib/lab/attackSim";
import { gameStore } from "@/lib/lab/gameStore";
import { BASES, markCleared } from "@/lib/lab/scoutSim";
import { sim, type Enemy } from "@/lib/lab/waveSim";
import { heightAt, paramsFor } from "@/components/universe/surface/terrain";
import { DESTINATIONS } from "@/lib/universe/destinations";

/**
 * Phase 7: assaulting a discovered enemy base. You land next to it as the third-person character
 * (attack mode, see attackSim) and its defenders come for you. Kill them all to take the base and
 * its loot; if you fall, the assault fails. The colony's own raids are paused while you are away.
 * The defenders reuse waveSim's enemy list, so the same renderer, bullets and damage apply.
 */
const lab = DESTINATIONS.find((d) => d.id === "lab");
const params = paramsFor(lab?.seed ?? 4.1, "lab");
const ground = (x: number, z: number) => heightAt(x, z, params);

export const ARENA_R = 42;
const AGGRO = 17;
const END_DELAY = 3.5;

export const raid = {
  on: false,
  id: -1,
  /** null while fighting */
  result: null as null | { win: boolean; c: number; e: number },
  total: 0,
  endIn: 0,
};

/** why an assault cannot start (null = it can) */
export function blocker(id: number): "wave" | "busy" | "none" | null {
  if (!baseStore.get().mode || atk.on || scoutBusy.on || raid.on) return "busy";
  if (sim.active) return "wave";
  if (!BASES[id]) return "none";
  return null;
}

export function startAssault(id: number): boolean {
  if (blocker(id)) return false;
  const b = BASES[id]!;
  const n = 5 + b.power * 3;
  sim.enemies = [];
  sim.queue = [];
  sim.shots = [];
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
      target: null,
      face: 0,
    };
    sim.enemies.push(e);
  }
  raid.on = true;
  raid.id = id;
  raid.result = null;
  raid.total = n;
  raid.endIn = 0;
  // you arrive on the open side, facing the keep
  enterAttack({ x: b.x, z: b.z + ARENA_R - 4, arena: { x: b.x, z: b.z, r: ARENA_R }, ground });
  atk.kills = 0;
  atk.onExit = () => {
    raid.on = false;
    sim.enemies = [];
  };
  if (!atk.on) {
    raid.on = false;
    sim.enemies = [];
    return false;
  }
  return true;
}

export function updateRaid(rawDt: number) {
  if (!raid.on) return;
  const dt = Math.min(rawDt, 0.05);
  if (!atk.on) {
    raid.on = false;
    return;
  }
  if (raid.result) {
    raid.endIn -= dt;
    if (raid.endIn <= 0) exitAttack();
    return;
  }
  const b = BASES[raid.id]!;
  for (const e of sim.enemies) {
    if (e.hp <= 0) continue;
    const dx = atk.x - e.x;
    const dz = atk.z - e.z;
    const d = Math.hypot(dx, dz) || 1;
    // defenders wait until you come close (or until one of them is shot), then charge
    // the last few come for you whatever the distance, so nobody is left hiding
    if (d < AGGRO || e.hp < e.max || sim.enemies.length <= 3) {
      e.face = Math.atan2(dx, dz);
      if (d > 1.5) {
        e.x += (dx / d) * e.speed * dt;
        e.z += (dz / d) * e.speed * dt;
      }
    }
    // keep them inside the base area
    const ox = e.x - b.x;
    const oz = e.z - b.z;
    const od = Math.hypot(ox, oz);
    if (od > ARENA_R) {
      e.x = b.x + (ox / od) * ARENA_R;
      e.z = b.z + (oz / od) * ARENA_R;
    }
  }
  sim.enemies = sim.enemies.filter((e) => e.hp > 0);

  if (atk.deaths > 0) {
    raid.result = { win: false, c: 0, e: 0 };
    raid.endIn = END_DELAY;
  } else if (!sim.enemies.length) {
    const r = gameStore.reward({ c: 90 * b.power, e: 60 * b.power });
    markCleared(b.id);
    raid.result = { win: true, c: r.c, e: r.e };
    raid.endIn = END_DELAY;
  }
}

/** how many defenders are still alive */
export const defendersLeft = () => sim.enemies.length;
