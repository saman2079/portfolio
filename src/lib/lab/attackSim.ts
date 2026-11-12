import { useSyncExternalStore } from "react";
import { CELL, PLATFORM, baseStore } from "@/lib/lab/baseStore";
import { TYPES, gameStore } from "@/lib/lab/gameStore";
import { centreOf, maxHp, sim } from "@/lib/lab/waveSim";
import { flightLive } from "@/lib/store/flightStore";

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
}
export const MAX_BULLETS = 40;

/** set by scoutSim: true while the drone flies (the two modes exclude each other) */
export const scoutBusy = { on: false };

const SPEED = 9;
const BULLET_SPEED = 46;
const BULLET_DMG = 9;
const FIRE_GAP = 0.13;
const REACH = 1.8;
const LIMIT = PLATFORM.r - 4;

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
  kills: 0,
  /** set while assaulting an enemy base: the fight stays inside this circle, on the terrain */
  arena: null as null | { x: number; z: number; r: number },
  ground: (_x: number, _z: number) => 0,
  /** how many times the character was killed in an assault */
  deaths: 0,
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

export function enterAttack(at?: { x: number; z: number; arena: { x: number; z: number; r: number }; ground: (x: number, z: number) => number }) {
  if (!baseStore.get().mode || atk.on || scoutBusy.on) return;
  gameStore.cancel();
  atk.arena = at?.arena ?? null;
  atk.ground = at?.ground ?? (() => 0);
  atk.deaths = 0;
  const [x, z] = at ? [at.x, at.z] : home();
  atk.x = atk.camX = x;
  atk.z = atk.camZ = z;
  atk.camH = 9;
  atk.camD = 11.5;
  atk.lookY = 1.1;
  atk.face = Math.PI;
  atk.hp = atk.max;
  atk.kills = 0;
  atk.bullets = [];
  atk.on = true;
  flightLive.attack = true;
  notify();
}

export function exitAttack() {
  if (!atk.on) return;
  atk.on = false;
  atk.arena = null;
  atk.ground = () => 0;
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
  if (!best) return;
  // stand on the side of the target that faces the middle of the plate
  const dx = PLATFORM.x - best[0];
  const dz = PLATFORM.z - best[1];
  const d = Math.hypot(dx, dz) || 1;
  atk.x = best[0] + (dx / d) * 5;
  atk.z = best[1] + (dz / d) * 5;
}

const nearestEnemy = (maxDist: number) => {
  let best = maxDist;
  let hit: (typeof sim.enemies)[number] | null = null;
  for (const e of sim.enemies) {
    if (e.hp <= 0) continue;
    const d = Math.hypot(e.x - atk.x, e.z - atk.z);
    if (d < best) {
      best = d;
      hit = e;
    }
  }
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
  atk.moving = len > 0.12;
  if (atk.moving) {
    atk.x += ix * SPEED * dt;
    atk.z += iz * SPEED * dt;
  }

  // stay on the plate (or inside the enemy base's arena) and out of the buildings
  const cx0 = atk.arena ? atk.arena.x : PLATFORM.x;
  const cz0 = atk.arena ? atk.arena.z : PLATFORM.z;
  const lim = atk.arena ? atk.arena.r : LIMIT;
  const px = atk.x - cx0;
  const pz = atk.z - cz0;
  const pd = Math.hypot(px, pz);
  if (pd > lim) {
    atk.x = cx0 + (px / pd) * lim;
    atk.z = cz0 + (pz / pd) * lim;
  }
  for (const b of atk.arena ? [] : gameStore.get().buildings) {
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
    if (atk.bullets.length < MAX_BULLETS) {
      atk.bullets.push({ x: atk.x + (dx / d) * 1.0, z: atk.z + (dz / d) * 1.0, vx: (dx / d) * BULLET_SPEED, vz: (dz / d) * BULLET_SPEED, life: 0.75 });
    }
    atk.fireCd = FIRE_GAP;
    atk.flash = 0.06;
  }

  for (let i = atk.bullets.length - 1; i >= 0; i--) {
    const b = atk.bullets[i]!;
    b.x += b.vx * dt;
    b.z += b.vz * dt;
    b.life -= dt;
    let gone = b.life <= 0;
    if (!gone) {
      for (const e of sim.enemies) {
        if (e.hp <= 0) continue;
        if (Math.hypot(e.x - b.x, e.z - b.z) < (e.kind === "brute" ? 1.4 : 1.0)) {
          e.hp -= BULLET_DMG;
          if (e.hp <= 0) atk.kills++;
          gone = true;
          break;
        }
      }
    }
    if (gone) atk.bullets.splice(i, 1);
  }

  // raiders that reach the character hurt; dead = back at the command centre
  atk.invuln = Math.max(0, atk.invuln - dt);
  if (atk.invuln <= 0) {
    for (const e of sim.enemies) {
      if (e.hp > 0 && Math.hypot(e.x - atk.x, e.z - atk.z) < REACH) atk.hp -= e.dps * 0.6 * dt;
    }
  }
  if (atk.hp <= 0 && atk.arena) {
    // an assault is lost: raidSim notices and sends you home; stay safe meanwhile
    atk.deaths++;
    atk.hp = atk.max;
    atk.invuln = 99;
  } else if (atk.hp <= 0) {
    const [x, z] = home();
    atk.x = x;
    atk.z = z;
    atk.hp = atk.max;
    atk.invuln = 2.5;
  }

  const f = 1 - Math.exp(-dt * 6);
  atk.camX += (atk.x - atk.camX) * f;
  atk.camZ += (atk.z - atk.camZ) * f;
  const gy = atk.arena ? atk.ground(atk.camX, atk.camZ) : 0;
  easeCam(dt, 9 + gy, 11.5, 1.1 + gy);
}
