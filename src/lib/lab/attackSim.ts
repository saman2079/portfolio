import { useSyncExternalStore } from "react";
import { CELL, PLATFORM, baseStore } from "@/lib/lab/baseStore";
import { TYPES, gameStore } from "@/lib/lab/gameStore";
import { centreOf, maxHp, sim } from "@/lib/lab/waveSim";
import { WEAPONS, current, dmgMul, gapMul, levelOf, type WeaponId } from "@/lib/lab/weapons";
import { reveal } from "@/lib/lab/explore";
import { flightLive } from "@/lib/store/flightStore";
import { heightAt, paramsFor } from "@/components/universe/surface/terrain";
import { DESTINATIONS } from "@/lib/universe/destinations";

/**
 * Attack mode: you leave the strategy view and fight the raid yourself as a third-person
 * character. Pure state and rules (no three.js); Character.tsx draws it, AttackUi.tsx feeds the input.
 * Everything is in surface-local x/z, like waveSim.
 *
 *  - move: WASD / arrows, or the on-screen joystick (screen-up = -z, the camera looks that way)
 *  - aim: the mouse on desktop; on touch the gun auto-aims at the nearest enemy
 *  - fire: hold the mouse button / Space / the fire button; bullets kill raiders, which shrinks the wave
 *  - raiders that reach you hurt; at 0 HP you come back next to the command centre
 */
export interface Bullet {
  x: number;
  z: number;
  vx: number;
  vz: number;
  life: number;
  dmg: number;
  /** enemies it can still pass through */
  pierce: number;
  splash: number;
  w: WeaponId;
  /** ids already hit (a piercing bullet hits each enemy once) */
  hit: number[];
}
export const MAX_BULLETS = 64;
export const MAX_BLASTS = 6;

/** set by scoutSim: true while the drone flies (the two modes exclude each other) */
export const scoutBusy = { on: false };

const SPEED = 9;
const REACH = 1.8;
/** attack mode is open-world: you may walk this far from the plate centre (the enemy bases are inside it) */
const LIMIT = 185;
const labCfg = DESTINATIONS.find((d) => d.id === "lab");
const terrainParams = paramsFor(labCfg?.seed ?? 4.1, "lab");
/** ground height at x/z: the plate is flat, outside it the terrain rises */
export const groundAt = (x: number, z: number) => (Math.hypot(x - PLATFORM.x, z - PLATFORM.z) < PLATFORM.r + 2 ? 0 : heightAt(x, z, terrainParams));
export const eachEnemy = (fn: (e: (typeof sim.enemies)[number]) => void) => {
  for (const e of sim.enemies) fn(e);
  for (const e of sim.defenders) fn(e);
};

export const atk = {
  on: false,
  x: 0,
  z: 0,
  face: 0,
  camX: 0,
  camZ: 0,
  /** camera height / distance behind / look-at height, eased (the scouting drone uses a higher view) */
  camH: 9,
  camD: 11.5,
  /** camera orbit around the character (radians); turn = -1/0/1 from Q/E */
  yaw: 0,
  turn: 0,
  lookY: 1.1,
  hp: 100,
  max: 100,
  fireCd: 0,
  invuln: 0,
  flash: 0,
  moving: false,
  keys: { u: false, d: false, l: false, r: false },
  joy: { x: 0, y: 0 },
  fire: false,
  useMouse: false,
  hasAim: false,
  aimX: 0,
  aimZ: 0,
  bullets: [] as Bullet[],
  /** rocket explosions being drawn: position, age, radius */
  blasts: [] as { x: number; z: number; t: number; r: number }[],
  /** the weapon in hand, for the model */
  weapon: "rifle" as WeaponId,
  kills: 0,
  onExit: null as null | (() => void),
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
export function useAttackOn() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => atk.on,
    () => false
  );
}

function home(): [number, number] {
  const hq = gameStore.get().buildings.find((b) => b.type === "hq");
  const [cx, cz] = hq ? centreOf(hq) : [PLATFORM.x, PLATFORM.z];
  return [cx, cz + 5.5];
}

/** ease the camera framing toward a target view */
export function easeCam(dt: number, h: number, d: number, look: number) {
  const f = 1 - Math.exp(-dt * 3);
  atk.camH += (h - atk.camH) * f;
  atk.camD += (d - atk.camD) * f;
  atk.lookY += (look - atk.lookY) * f;
}

export function enterAttack(at?: { x: number; z: number }) {
  if (!baseStore.get().mode || atk.on || scoutBusy.on) return;
  gameStore.cancel();
  const [x, z] = at ? [at.x, at.z] : home();
  atk.x = atk.camX = x;
  atk.z = atk.camZ = z;
  atk.camH = 9;
  atk.camD = 11.5;
  atk.lookY = 1.1;
  atk.face = Math.PI;
  atk.yaw = 0;
  atk.turn = 0;
  atk.hp = atk.max;
  atk.kills = 0;
  atk.bullets = [];
  atk.blasts = [];
  atk.on = true;
  flightLive.attack = true;
  notify();
}

export function exitAttack() {
  if (!atk.on) return;
  atk.on = false;
  atk.onExit?.();
  atk.onExit = null;
  atk.fire = false;
  atk.keys = { u: false, d: false, l: false, r: false };
  atk.joy = { x: 0, y: 0 };
  atk.bullets = [];
  flightLive.attack = false;
  notify();
}

/** jump next to the building that is worst hit (or the nearest raider) */
export function goToAttack() {
  let best: [number, number] | null = null;
  let worst = 1;
  for (const b of gameStore.get().buildings) {
    const r = (sim.hp[b.id] ?? 1) / maxHp(b);
    if (r < worst) {
      worst = r;
      best = centreOf(b);
    }
  }
  if (!best && sim.enemies[0]) best = [sim.enemies[0].x, sim.enemies[0].z];
  if (!best) {
    // nothing is under attack: just go back to the command centre
    const [hx, hz] = home();
    atk.x = hx;
    atk.z = hz;
    atk.camX = hx;
    atk.camZ = hz;
    return;
  }
  // stand on the side of the target that faces the middle of the plate
  const dx = PLATFORM.x - best[0];
  const dz = PLATFORM.z - best[1];
  const d = Math.hypot(dx, dz) || 1;
  atk.x = best[0] + (dx / d) * 5;
  atk.z = best[1] + (dz / d) * 5;
  atk.camX = atk.x;
  atk.camZ = atk.z;
}

const nearestEnemy = (maxDist: number) => {
  let best = maxDist;
  let hit: (typeof sim.enemies)[number] | null = null;
  eachEnemy((e) => {
    if (e.hp <= 0) return;
    const d = Math.hypot(e.x - atk.x, e.z - atk.z);
    if (d < best) {
      best = d;
      hit = e;
    }
  });
  return hit;
};

export function updateAttack(rawDt: number) {
  if (!atk.on) return;
  const dt = Math.min(rawDt, 0.05);
  const k = atk.keys;
  let ix = (k.r ? 1 : 0) - (k.l ? 1 : 0) + atk.joy.x;
  let iz = (k.d ? 1 : 0) - (k.u ? 1 : 0) + atk.joy.y;
  const len = Math.hypot(ix, iz);
  if (len > 1) {
    ix /= len;
    iz /= len;
  }
  atk.yaw += atk.turn * 1.9 * dt;
  // movement is relative to the camera: screen-up is where the camera looks
  const sy = Math.sin(atk.yaw);
  const cy = Math.cos(atk.yaw);
  const wx = ix * cy + iz * sy;
  const wz = -ix * sy + iz * cy;
  ix = wx;
  iz = wz;
  atk.moving = len > 0.12;
  if (atk.moving) {
    atk.x += ix * SPEED * dt;
    atk.z += iz * SPEED * dt;
    reveal(atk.x, atk.z, 30);
  }

  // stay inside the map and out of the buildings
  const px = atk.x - PLATFORM.x;
  const pz = atk.z - PLATFORM.z;
  const pd = Math.hypot(px, pz);
  if (pd > LIMIT) {
    atk.x = PLATFORM.x + (px / pd) * LIMIT;
    atk.z = PLATFORM.z + (pz / pd) * LIMIT;
  }
  for (const b of gameStore.get().buildings) {
    const [cx, cz] = centreOf(b);
    const hx = (TYPES[b.type].w * CELL) / 2 + 0.5;
    const hz = (TYPES[b.type].h * CELL) / 2 + 0.5;
    const ox = atk.x - cx;
    const oz = atk.z - cz;
    if (Math.abs(ox) < hx && Math.abs(oz) < hz) {
      if (hx - Math.abs(ox) < hz - Math.abs(oz)) atk.x = cx + Math.sign(ox || 1) * hx;
      else atk.z = cz + Math.sign(oz || 1) * hz;
    }
  }

  // aim: mouse point on desktop, the nearest raider on touch (or when the mouse is outside the view)
  const auto = nearestEnemy(30);
  let aimX = atk.x + Math.sin(atk.face);
  let aimZ = atk.z + Math.cos(atk.face);
  if (atk.useMouse && atk.hasAim) {
    aimX = atk.aimX;
    aimZ = atk.aimZ;
    atk.face = Math.atan2(aimX - atk.x, aimZ - atk.z);
  } else if (auto && (atk.fire || !atk.moving)) {
    aimX = auto.x;
    aimZ = auto.z;
    atk.face = Math.atan2(aimX - atk.x, aimZ - atk.z);
  } else if (atk.moving) {
    atk.face = Math.atan2(ix, iz);
  }

  atk.fireCd -= dt;
  atk.flash = Math.max(0, atk.flash - dt);
  if (atk.fire && atk.fireCd <= 0) {
    const dx = aimX - atk.x;
    const dz = aimZ - atk.z;
    const d = Math.hypot(dx, dz) || 1;
    const wid = current();
    const w = WEAPONS[wid];
    const lvl = levelOf(wid);
    const base = Math.atan2(dx, dz);
    atk.weapon = wid;
    for (let p = 0; p < w.pellets && atk.bullets.length < MAX_BULLETS; p++) {
      const a = base + (Math.random() - 0.5) * 2 * w.spread;
      atk.bullets.push({
        x: atk.x + (dx / d) * 1.0,
        z: atk.z + (dz / d) * 1.0,
        vx: Math.sin(a) * w.speed,
        vz: Math.cos(a) * w.speed,
        life: w.life,
        dmg: w.dmg * dmgMul(lvl),
        pierce: w.pierce,
        splash: w.splash,
        w: wid,
        hit: [],
      });
    }
    atk.fireCd = w.gap * gapMul(lvl);
    atk.flash = 0.06;
  }
  atk.weapon = current();
  for (let i = atk.blasts.length - 1; i >= 0; i--) {
    atk.blasts[i]!.t += dt;
    if (atk.blasts[i]!.t > 0.4) atk.blasts.splice(i, 1);
  }

  for (let i = atk.bullets.length - 1; i >= 0; i--) {
    const b = atk.bullets[i]!;
    b.x += b.vx * dt;
    b.z += b.vz * dt;
    b.life -= dt;
    let gone = b.life <= 0;
    if (!gone) {
      const strike = (e: (typeof sim.enemies)[number]) => {
        if (gone || e.hp <= 0 || b.hit.includes(e.id)) return;
        if (Math.hypot(e.x - b.x, e.z - b.z) < (e.kind === "brute" ? 1.4 : 1.0)) {
          if (!b.splash) {
            e.hp -= b.dmg;
            if (e.hp <= 0) atk.kills++;
          }
          b.hit.push(e.id);
          if (b.pierce > 0) b.pierce--;
          else gone = true;
        }
      };
      eachEnemy(strike);
    }
    if (gone) {
      // a rocket blows up where it ends: everything in the radius takes damage, less toward the edge
      if (b.splash && atk.blasts.length < MAX_BLASTS) {
        atk.blasts.push({ x: b.x, z: b.z, t: 0, r: b.splash });
        eachEnemy((e) => {
          if (e.hp <= 0) return;
          const d = Math.hypot(e.x - b.x, e.z - b.z);
          if (d < b.splash) {
            e.hp -= b.dmg * (1 - 0.6 * (d / b.splash));
            if (e.hp <= 0) atk.kills++;
          }
        });
      }
      atk.bullets.splice(i, 1);
    }
  }

  // raiders that reach the character hurt; dead = back at the command centre
  atk.invuln = Math.max(0, atk.invuln - dt);
  if (atk.invuln <= 0) {
    eachEnemy((e) => {
      if (e.hp > 0 && Math.hypot(e.x - atk.x, e.z - atk.z) < REACH) atk.hp -= e.dps * 0.6 * dt;
    });
  }
  if (atk.hp <= 0) {
    const [x, z] = home();
    atk.x = x;
    atk.z = z;
    atk.camX = x;
    atk.camZ = z;
    atk.hp = atk.max;
    atk.invuln = 2.5;
  }

  const f = 1 - Math.exp(-dt * 6);
  atk.camX += (atk.x - atk.camX) * f;
  atk.camZ += (atk.z - atk.camZ) * f;
  const gy = groundAt(atk.camX, atk.camZ);
  easeCam(dt, 9 + gy, 11.5, 1.1 + gy);
}
