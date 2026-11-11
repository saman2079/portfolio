import { useSyncExternalStore } from "react";
import { flightLive } from "@/lib/store/flightStore";

/** Build grid on the Lab planet: GRID x GRID cells of CELL units, in the surface group's local space. */
export const GRID = 8;
export const CELL = 3;
export const ORIGIN = { x: -12, z: -36 };
export const cellCenter = (gx: number, gz: number): [number, number] => [
  ORIGIN.x + (gx + 0.5) * CELL,
  ORIGIN.z + (gz + 0.5) * CELL,
];

/** Centre and radius of the base platform (surface-local x/z). */
export const PLATFORM = { x: 3, z: -25, r: 32 };
/** The pilot's eye is this far in front of the middle of the hull (ship space, +z is backwards). */
export const PARK_LEN = 7.03;
/** Where the parked ship's hull centre stands on the base map, and which way it faces (radians about +y). */
export const parkSpot = (portrait: boolean) => (portrait ? { x: 0, z: -45, yaw: Math.PI / 2 } : { x: 17.5, z: -18, yaw: 0.5 });

export interface Skill {
  name: string;
  level: number;
}
export interface Cell {
  gx: number;
  gz: number;
}
export interface Hover extends Cell {
  /** the dragged building may be dropped here */
  ok: boolean;
}

export interface BaseState {
  /** the builder is open (camera above the grid) */
  mode: boolean;
  skills: Skill[];
  placed: Record<number, Cell>;
  selected: number | null;
  /** index of the building being dragged (from the bar or from the grid) */
  dragging: number | null;
  hover: Hover | null;
}

const KEY = "lab-base-v1";

function load(): Record<number, Cell> {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Record<string, Cell>;
    const out: Record<number, Cell> = {};
    for (const [k, c] of Object.entries(data)) {
      if (c && Number.isInteger(c.gx) && Number.isInteger(c.gz) && c.gx >= 0 && c.gz >= 0 && c.gx < GRID && c.gz < GRID) {
        out[Number(k)] = { gx: c.gx, gz: c.gz };
      }
    }
    return out;
  } catch {
    return {};
  }
}
function save(placed: Record<number, Cell>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(placed));
  } catch {
    /* private mode: the base then only lasts for this visit */
  }
}

let state: BaseState = { mode: false, skills: [], placed: {}, selected: null, dragging: null, hover: null };
let loaded = false;
const listeners = new Set<() => void>();
function set(patch: Partial<BaseState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

/** Pointer position and press candidate: read every frame by the 3D side, so not React state. */
export const baseLive = { px: 0, py: 0, candidate: null as null | { index: number; x: number; y: number } };

export const occupant = (placed: Record<number, Cell>, gx: number, gz: number) => {
  for (const [k, c] of Object.entries(placed)) if (c.gx === gx && c.gz === gz) return Number(k);
  return null;
};

export const baseStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  setSkills(skills: Skill[]) {
    if (!loaded) {
      loaded = true;
      state = { ...state, placed: load() };
    }
    set({ skills });
  },
  setMode(mode: boolean) {
    flightLive.build = mode;
    set({ mode, selected: null, dragging: null, hover: null });
    if (typeof document !== "undefined") {
      if (mode) document.documentElement.dataset.builder = "on";
      else delete document.documentElement.dataset.builder;
    }
  },
  select: (selected: number | null) => set({ selected }),
  startDrag: (index: number) => set({ dragging: index, selected: index }),
  endDrag: () => set({ dragging: null, hover: null }),
  setHover(hover: Hover | null) {
    const a = state.hover;
    if (a === hover || (a && hover && a.gx === hover.gx && a.gz === hover.gz && a.ok === hover.ok)) return;
    set({ hover });
  },
  place(index: number, gx: number, gz: number) {
    const who = occupant(state.placed, gx, gz);
    if (who !== null && who !== index) return false;
    const placed = { ...state.placed, [index]: { gx, gz } };
    save(placed);
    set({ placed });
    return true;
  },
  remove(index: number) {
    const placed = { ...state.placed };
    delete placed[index];
    save(placed);
    set({ placed, selected: state.selected === index ? null : state.selected });
  },
  reset() {
    save({});
    set({ placed: {}, selected: null });
  },
};

export function useBase<T>(select: (s: BaseState) => T): T {
  return useSyncExternalStore(
    baseStore.subscribe,
    () => select(state),
    () => select(state)
  );
}

/** Pairs of placed buildings standing next to each other (including diagonals): they get linked. */
export function links(placed: Record<number, Cell>): [number, number][] {
  const keys = Object.keys(placed).map(Number);
  const out: [number, number][] = [];
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = placed[keys[i] as number];
      const b = placed[keys[j] as number];
      if (a && b && Math.max(Math.abs(a.gx - b.gx), Math.abs(a.gz - b.gz)) === 1) out.push([keys[i] as number, keys[j] as number]);
    }
  }
  return out;
}

export const power = (skills: Skill[], placed: Record<number, Cell>) =>
  Object.keys(placed).reduce((sum, k) => sum + (skills[Number(k)]?.level ?? 0), 0) + links(placed).length * 2;
