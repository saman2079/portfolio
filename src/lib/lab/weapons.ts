import { useSyncExternalStore } from "react";
import { gameStore, type Res } from "@/lib/lab/gameStore";

/**
 * The armoury: six weapons for attack mode, bought with crystal/energy and upgraded to level 3.
 * Pure data and a small saved store (no three.js); attackSim fires them, Character.tsx draws them,
 * BuilderUi has the armoury panel and AttackUi the quick switch.
 */
export type WeaponId = "rifle" | "machinegun" | "shotgun" | "sniper" | "rpg" | "minigun";
export const WEAPON_IDS: WeaponId[] = ["rifle", "machinegun", "shotgun", "sniper", "rpg", "minigun"];
export const MAX_LEVEL = 3;

export interface Weapon {
  id: WeaponId;
  price: Res;
  /** damage per bullet at level 1 */
  dmg: number;
  /** seconds between shots at level 1 */
  gap: number;
  speed: number;
  /** seconds a bullet lives: range = speed * life */
  life: number;
  pellets: number;
  /** random spread of each bullet, radians */
  spread: number;
  /** extra enemies a bullet passes through */
  pierce: number;
  /** explosion radius (0 = none) */
  splash: number;
  /** tracer colour (HDR rgb) and size (thickness, length) */
  color: [number, number, number];
  size: [number, number];
  /** scale of the gun model on the character (x, y, z) */
  gun: [number, number, number];
}

export const WEAPONS: Record<WeaponId, Weapon> = {
  rifle: { id: "rifle", price: { c: 0, e: 0 }, dmg: 9, gap: 0.13, speed: 46, life: 0.75, pellets: 1, spread: 0.02, pierce: 0, splash: 0, color: [3.2, 2.6, 0.7], size: [1, 1], gun: [1, 1, 1] },
  machinegun: { id: "machinegun", price: { c: 350, e: 0 }, dmg: 7, gap: 0.07, speed: 50, life: 0.65, pellets: 1, spread: 0.07, pierce: 0, splash: 0, color: [3.4, 1.8, 0.4], size: [1, 0.9], gun: [1.1, 1.1, 1.2] },
  shotgun: { id: "shotgun", price: { c: 500, e: 0 }, dmg: 10, gap: 0.75, speed: 40, life: 0.42, pellets: 8, spread: 0.3, pierce: 0, splash: 0, color: [3.4, 2.4, 0.6], size: [0.8, 0.6], gun: [1.3, 1.1, 0.9] },
  sniper: { id: "sniper", price: { c: 700, e: 100 }, dmg: 80, gap: 1.0, speed: 130, life: 0.62, pellets: 1, spread: 0, pierce: 4, splash: 0, color: [0.4, 2.6, 3.4], size: [0.7, 3.2], gun: [0.8, 0.9, 1.7] },
  rpg: { id: "rpg", price: { c: 1000, e: 250 }, dmg: 60, gap: 1.3, speed: 26, life: 1.6, pellets: 1, spread: 0.01, pierce: 0, splash: 5.5, color: [3.6, 1.4, 0.3], size: [3, 2.4], gun: [1.8, 1.8, 1.2] },
  minigun: { id: "minigun", price: { c: 1600, e: 400 }, dmg: 5, gap: 0.035, speed: 54, life: 0.55, pellets: 1, spread: 0.16, pierce: 0, splash: 0, color: [3.2, 3, 1.2], size: [0.9, 0.8], gun: [1.6, 1.5, 1.4] },
};

/** damage and fire-rate multipliers for a level (1..3) */
export const dmgMul = (lvl: number) => 1 + 0.3 * (lvl - 1);
export const gapMul = (lvl: number) => 1 - 0.08 * (lvl - 1);

/** price of reaching `lvl` (2 or 3) */
export function upgradeCost(id: WeaponId, lvl: number): Res {
  const base = WEAPONS[id].price;
  const c = Math.ceil(((base.c || 150) * (lvl === 2 ? 0.8 : 1.6)) / 10) * 10;
  const e = Math.ceil((base.e * (lvl === 2 ? 0.8 : 1.6)) / 10) * 10;
  return { c, e };
}

const KEY = "lab-weapons-v1";
const arm = {
  owned: ["rifle"] as WeaponId[],
  level: {} as Partial<Record<WeaponId, number>>,
  cur: "rifle" as WeaponId,
};
let loaded = false;
let ver = 0;
const listeners = new Set<() => void>();
const notify = () => {
  ver++;
  listeners.forEach((l) => l());
};

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const d = JSON.parse(raw) as { owned?: string[]; level?: Record<string, number>; cur?: string };
    const ok = (s: string): s is WeaponId => (WEAPON_IDS as string[]).includes(s);
    arm.owned = ["rifle", ...(d.owned ?? []).filter(ok).filter((s) => s !== "rifle")];
    for (const [k, v] of Object.entries(d.level ?? {})) if (ok(k) && Number.isInteger(v) && v >= 1 && v <= MAX_LEVEL) arm.level[k] = v;
    if (d.cur && ok(d.cur) && arm.owned.includes(d.cur)) arm.cur = d.cur;
  } catch {
    /* corrupt save: start with the rifle */
  }
}
function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(arm));
  } catch {
    /* private mode */
  }
}

export function owned(id: WeaponId) {
  load();
  return arm.owned.includes(id);
}
export function levelOf(id: WeaponId) {
  load();
  return arm.level[id] ?? 1;
}
export function current(): WeaponId {
  load();
  return arm.cur;
}
export function ownedList(): WeaponId[] {
  load();
  return WEAPON_IDS.filter((w) => arm.owned.includes(w));
}

export function select(id: WeaponId) {
  load();
  if (!arm.owned.includes(id) || arm.cur === id) return;
  arm.cur = id;
  save();
  notify();
}
/** next owned weapon (the touch button) */
export function cycle() {
  const l = ownedList();
  select(l[(l.indexOf(current()) + 1) % l.length]!);
}
export function buy(id: WeaponId): boolean {
  load();
  if (arm.owned.includes(id)) return false;
  if (!gameStore.spend(WEAPONS[id].price)) return false;
  arm.owned.push(id);
  arm.cur = id;
  save();
  notify();
  return true;
}
export function upgrade(id: WeaponId): boolean {
  load();
  const lvl = levelOf(id);
  if (!arm.owned.includes(id) || lvl >= MAX_LEVEL) return false;
  if (!gameStore.spend(upgradeCost(id, lvl + 1))) return false;
  arm.level[id] = lvl + 1;
  save();
  notify();
  return true;
}

const sub = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
/** re-renders whenever the armoury changes */
export function useArmoury() {
  return useSyncExternalStore(sub, () => (load(), ver), () => 0);
}
