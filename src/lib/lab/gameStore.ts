import { useSyncExternalStore } from "react";
import { GRID, baseStore, gameBlockers, occupant } from "@/lib/lab/baseStore";

/**
 * The colony game on the Lab planet (phase 3: building and economy).
 * Two resources: crystal (c) and energy (e). Extractors and generators produce them over time,
 * even while the page is closed (timestamps are saved); a tap collects, storage sets the cap.
 * The grid is the same one the skill buildings use (see baseStore), so sizes follow GRID/CELL.
 */
export type BuildingType = "hq" | "extractor" | "generator" | "storage" | "turret" | "wall";
export interface Res {
  c: number;
  e: number;
}
export interface TypeDef {
  w: number;
  h: number;
  max: number;
  cost: Res;
  produces?: "c" | "e";
  /** units per minute at level 1 */
  rate?: number;
}

export const MAX_LEVEL = 3;
export const TYPES: Record<BuildingType, TypeDef> = {
  hq: { w: 2, h: 2, max: 1, cost: { c: 300, e: 150 } },
  extractor: { w: 1, h: 1, max: 4, cost: { c: 60, e: 0 }, produces: "c", rate: 6 },
  generator: { w: 1, h: 1, max: 4, cost: { c: 60, e: 0 }, produces: "e", rate: 6 },
  storage: { w: 1, h: 1, max: 3, cost: { c: 100, e: 50 } },
  turret: { w: 1, h: 1, max: 6, cost: { c: 150, e: 100 } },
  wall: { w: 1, h: 1, max: 20, cost: { c: 15, e: 0 } },
};
/** what the shop offers (the command centre is given at the start) */
export const SHOP: BuildingType[] = ["extractor", "generator", "storage", "turret", "wall"];
const RATE_MUL = [0, 1, 1.7, 2.8];
const HQ_CAP = [0, 1000, 2000, 4000];
const STORAGE_CAP = [0, 500, 1000, 2000];
/** a producer holds this many minutes of output before it is full */
const BUFFER_MIN = 30;
const START: Res = { c: 300, e: 200 };

export interface Building {
  id: string;
  type: BuildingType;
  gx: number;
  gz: number;
  level: number;
  /** ms timestamp of the last collection (production accrues from here) */
  last: number;
}
export interface Armed {
  type: BuildingType;
  /** moving an existing building instead of buying a new one */
  moveId: string | null;
}
export type Toast = "poor" | "max" | "full" | "nospace" | null;
export interface GameState {
  res: Res;
  buildings: Building[];
  selected: string | null;
  armed: Armed | null;
  toast: Toast;
  /** the next raid to repel (rises with every wave survived) */
  wave: number;
}

const KEY = "lab-game-v1";
let state: GameState = { res: { ...START }, buildings: [], selected: null, armed: null, toast: null, wave: 1 };
let loaded = false;
const listeners = new Set<() => void>();
function set(patch: Partial<GameState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ res: state.res, buildings: state.buildings, wave: state.wave }));
  } catch {
    /* private mode: the colony then only lasts for this visit */
  }
}
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const d = JSON.parse(raw) as { res?: Res; buildings?: Building[]; wave?: number };
    const res = d.res && Number.isFinite(d.res.c) && Number.isFinite(d.res.e) ? { c: Math.max(0, d.res.c), e: Math.max(0, d.res.e) } : { ...START };
    const buildings = (d.buildings ?? []).filter(
      (b) =>
        b &&
        b.type in TYPES &&
        Number.isInteger(b.gx) &&
        Number.isInteger(b.gz) &&
        b.gx >= 0 &&
        b.gz >= 0 &&
        b.gx + TYPES[b.type].w <= GRID &&
        b.gz + TYPES[b.type].h <= GRID &&
        typeof b.id === "string"
    );
    state = { ...state, wave: Number.isInteger(d.wave) && (d.wave as number) >= 1 ? (d.wave as number) : 1, res, buildings: buildings.map((b) => ({ ...b, level: Math.min(MAX_LEVEL, Math.max(1, b.level | 0)), last: Number.isFinite(b.last) ? b.last : Date.now() })) };
  } catch {
    /* corrupt save: start fresh */
  }
}

const covers = (b: Building, gx: number, gz: number) => {
  const t = TYPES[b.type];
  return gx >= b.gx && gx < b.gx + t.w && gz >= b.gz && gz < b.gz + t.h;
};
gameBlockers.fn = (gx, gz) => state.buildings.some((b) => covers(b, gx, gz));

/** Can a building of this type stand with its top-left cell at (gx, gz)? `ignoreId` is the one being moved. */
function canPlace(type: BuildingType, gx: number, gz: number, ignoreId: string | null = null) {
  const t = TYPES[type];
  if (gx < 0 || gz < 0 || gx + t.w > GRID || gz + t.h > GRID) return false;
  const skills = baseStore.get().skills.length;
  const placed = baseStore.get().placed;
  for (let x = gx; x < gx + t.w; x++) {
    for (let z = gz; z < gz + t.h; z++) {
      const who = occupant(placed, x, z);
      if (who !== null && who < skills) return false;
      if (state.buildings.some((b) => b.id !== ignoreId && covers(b, x, z))) return false;
    }
  }
  return true;
}

const count = (type: BuildingType) => state.buildings.filter((b) => b.type === type).length;
const hqLevel = () => state.buildings.find((b) => b.type === "hq")?.level ?? 1;
export function caps(buildings: Building[] = state.buildings): Res {
  const hq = buildings.find((b) => b.type === "hq");
  let cap = HQ_CAP[hq?.level ?? 1] ?? 1000;
  for (const b of buildings) if (b.type === "storage") cap += STORAGE_CAP[b.level] ?? 0;
  return { c: cap, e: cap };
}
const ratePerMs = (b: Building) => ((TYPES[b.type].rate ?? 0) * (RATE_MUL[b.level] ?? 1)) / 60000;
/** how much a producer is holding right now */
export function stored(b: Building, now = Date.now()) {
  const r = ratePerMs(b);
  if (r <= 0) return 0;
  return Math.min(r * BUFFER_MIN * 60000, Math.max(0, now - b.last) * r);
}
export const perMinute = (b: Building) => (TYPES[b.type].rate ?? 0) * (RATE_MUL[b.level] ?? 1);
export const bufferSize = (b: Building) => perMinute(b) * BUFFER_MIN;

const afford = (cost: Res) => state.res.c >= cost.c && state.res.e >= cost.e;
const pay = (cost: Res): Res => ({ c: state.res.c - cost.c, e: state.res.e - cost.e });
/** cost of the next level of a building, or null at the top */
export function upgradeCost(b: Building): Res | null {
  if (b.level >= MAX_LEVEL) return null;
  const k = Math.pow(1.9, b.level);
  const base = TYPES[b.type].cost;
  return { c: Math.round((base.c * k) / 5) * 5, e: Math.round((base.e * k) / 5) * 5 };
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
function toast(t: Toast) {
  set({ toast: t });
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (state.toast === t) set({ toast: null });
  }, 2200);
}
const uid = () => `b${Date.now().toString(36)}${Math.floor(Math.random() * 46656).toString(36)}`;

export const gameStore = {
  get(): GameState {
    load();
    return state;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  canPlace,
  count,
  /** open the colony: loads the save and gives the command centre a spot if it has none */
  init() {
    load();
    if (state.buildings.some((b) => b.type === "hq")) return;
    const mid = (GRID - 2) / 2;
    const spots: [number, number][] = [];
    for (let x = 0; x <= GRID - 2; x++) for (let z = 0; z <= GRID - 2; z++) spots.push([x, z]);
    spots.sort((a, b) => Math.hypot(a[0] - mid, a[1] - mid) - Math.hypot(b[0] - mid, b[1] - mid));
    const spot = spots.find(([x, z]) => canPlace("hq", x, z));
    if (!spot) return;
    set({ buildings: [...state.buildings, { id: uid(), type: "hq", gx: spot[0], gz: spot[1], level: 1, last: Date.now() }] });
    save();
  },
  /** pick a building from the shop: the next free cell you tap gets it */
  arm(type: BuildingType) {
    if (count(type) >= TYPES[type].max) return toast("max");
    if (!afford(TYPES[type].cost)) return toast("poor");
    set({ armed: { type, moveId: null }, selected: null });
  },
  armMove(id: string) {
    const b = state.buildings.find((x) => x.id === id);
    if (b) set({ armed: { type: b.type, moveId: id }, selected: null });
  },
  cancel() {
    if (state.armed) set({ armed: null });
  },
  /** tap on a cell while a building is armed */
  placeAt(gx: number, gz: number) {
    const a = state.armed;
    if (!a) return false;
    if (!canPlace(a.type, gx, gz, a.moveId)) {
      toast("nospace");
      return false;
    }
    if (a.moveId) {
      set({ buildings: state.buildings.map((b) => (b.id === a.moveId ? { ...b, gx, gz } : b)), armed: null, selected: a.moveId });
    } else {
      const cost = TYPES[a.type].cost;
      if (!afford(cost)) {
        toast("poor");
        return false;
      }
      const id = uid();
      state = { ...state, res: pay(cost) };
      // keep the same building armed for another go while there is room and money
      const more = count(a.type) + 1 < TYPES[a.type].max && afford(cost);
      set({ buildings: [...state.buildings, { id, type: a.type, gx, gz, level: 1, last: Date.now() }], armed: more ? a : null, selected: more ? null : id });
    }
    save();
    return true;
  },
  select(id: string | null) {
    if (state.armed) return;
    set({ selected: id });
  },
  upgrade(id: string) {
    const b = state.buildings.find((x) => x.id === id);
    if (!b) return;
    const cost = upgradeCost(b);
    if (!cost) return toast("max");
    if (!afford(cost)) return toast("poor");
    // bank what the building made so far at the old rate
    const now = Date.now();
    const got = this.collectInto(b, now);
    set({ res: pay(cost), buildings: got.map((x) => (x.id === id ? { ...x, level: x.level + 1 } : x)) });
    save();
  },
  sell(id: string) {
    const b = state.buildings.find((x) => x.id === id);
    if (!b || b.type === "hq") return;
    const cost = TYPES[b.type].cost;
    const cap = caps();
    set({
      res: { c: Math.min(cap.c, state.res.c + Math.floor(cost.c / 2)), e: Math.min(cap.e, state.res.e + Math.floor(cost.e / 2)) },
      buildings: state.buildings.filter((x) => x.id !== id),
      selected: null,
    });
    save();
  },
  /** moves what a producer holds into the resources (up to the storage cap); returns the new building list */
  collectInto(b: Building, now: number): Building[] {
    const def = TYPES[b.type];
    if (!def.produces) return state.buildings;
    const have = stored(b, now);
    const cap = caps()[def.produces];
    const room = Math.max(0, cap - state.res[def.produces]);
    const take = Math.min(Math.floor(have), room);
    if (take < 1) return state.buildings;
    const left = have - take;
    state = { ...state, res: { ...state.res, [def.produces]: state.res[def.produces] + take } };
    const r = ratePerMs(b);
    return state.buildings.map((x) => (x.id === b.id ? { ...x, last: now - (r > 0 ? left / r : 0) } : x));
  },
  collect(id: string) {
    const b = state.buildings.find((x) => x.id === id);
    if (!b || !TYPES[b.type].produces) return;
    const now = Date.now();
    if (stored(b, now) < 1) return;
    const before = state.res[TYPES[b.type].produces!];
    const next = this.collectInto(b, now);
    if (state.res[TYPES[b.type].produces!] === before) return toast("full");
    set({ buildings: next });
    save();
  },
  /**
   * A raid is over. Won: reward (up to the storage cap) and the next wave. Lost: 30% of both
   * resources are stolen and the same wave comes again. Returns the change in resources.
   */
  endRaid(win: boolean): Res {
    const cap = caps();
    if (win) {
      const w = state.wave;
      const c = Math.max(0, Math.min(cap.c - state.res.c, 30 + 10 * w));
      const e = Math.max(0, Math.min(cap.e - state.res.e, 20 + 8 * w));
      set({ res: { c: state.res.c + c, e: state.res.e + e }, wave: w + 1 });
      save();
      return { c, e };
    }
    const c = Math.floor(state.res.c * 0.3);
    const e = Math.floor(state.res.e * 0.3);
    set({ res: { c: state.res.c - c, e: state.res.e - e } });
    save();
    return { c: -c, e: -e };
  },
  /** pay for something outside the shop (the scouting drone); false with a toast when short */
  spend(cost: Res): boolean {
    if (!afford(cost)) {
      toast("poor");
      return false;
    }
    set({ res: pay(cost) });
    save();
    return true;
  },
  /** upgrading the command centre also lifts the storage cap: shown as is, nothing to do here */
  hqLevel,
};

export function useGame<T>(select: (s: GameState) => T): T {
  return useSyncExternalStore(
    gameStore.subscribe,
    () => select(gameStore.get()),
    () => select(state)
  );
}
