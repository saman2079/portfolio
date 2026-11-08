import { useSyncExternalStore } from "react";

export type LandState = "idle" | "descending" | "landed" | "ascending";
import { DESTINATION_IDS, type DestinationId } from "@/lib/universe/destinations";

/** The flight path has one segment per destination (start → first planet → … → last planet). */
export const SEGMENTS = DESTINATION_IDS.length;

/** Cockpit throttle lever range (multiplier on flight speed), log-scaled so the middle is 1x. */
export const SPEED_MIN = 0.4;
export const SPEED_MAX = 2.5;
export const speedToT = (m: number) => Math.log(m / SPEED_MIN) / Math.log(SPEED_MAX / SPEED_MIN);
export const tToSpeed = (t: number) => SPEED_MIN * Math.pow(SPEED_MAX / SPEED_MIN, Math.min(1, Math.max(0, t)));
export const setSpeedMul = (m: number) => {
  flightLive.speedMul = Math.min(SPEED_MAX, Math.max(SPEED_MIN, m));
};

/** Position of a destination along the path, 0..1 (the start is 0). */
export const stationU = (id: DestinationId) => (DESTINATION_IDS.indexOf(id) + 1) / SEGMENTS;

/**
 * Mutable per-frame flight state. The scroll controller writes the target, the
 * 3D ship eases towards it. Plain object on purpose: no React renders per frame.
 */
export const flightLive = {
  /** the universe is on screen and may react to scrolling (docking magnet etc.) */
  enabled: false,
  /** where the scroll position says the ship should be, 0..1 */
  targetU: 0,
  /** where the ship actually is, 0..1 (lags behind the target: acceleration / braking) */
  shipU: 0,
  /** world units per second, smoothed */
  worldSpeed: 0,
  /** worldSpeed normalised to 0..1 */
  speedNorm: 0,
  /** user speed multiplier (the cockpit lever, phase 3) */
  speedMul: 1,
  /** a programmatic flight (planet click) is running */
  flying: false,
  /** the pilot is dragging the throttle lever (so a drag must not turn the head) */
  grabbing: false,
  /** a landing command waiting for the ship (handled in its frame loop) */
  landCmd: null as null | { type: "land" | "takeoff"; id?: DestinationId },
  /** the base builder is open: the camera hovers above the build grid */
  build: false,
  /** 0..1 blend of the builder camera */
  buildView: 0,
  /** the surface world replaces space (landed, or lifting off) */
  surface: false,
  /** the outside (chase camera) view is wanted */
  outside: false,
  /** 0 = in the cockpit, 1 = outside, eased by the ship */
  view: 0,
  /** velocity in ship space, used by the speed streaks */
  vLocal: [0, 0, 0] as [number, number, number],
};

/** Low-frequency snapshot for the HUD (published ~10×/s by the ship). */
export interface FlightHud {
  shipU: number;
  speedNorm: number;
  worldSpeed: number;
  nearId: DestinationId | null;
  nextId: DestinationId | null;
  nextDist: number | null;
  arrivedId: DestinationId | null;
  speedMul: number;
  outside: boolean;
  land: LandState;
  landId: DestinationId | null;
}

const initial: FlightHud = {
  shipU: 0,
  speedNorm: 0,
  worldSpeed: 0,
  nearId: null,
  nextId: "about",
  nextDist: null,
  arrivedId: null,
  speedMul: 1,
  outside: false,
  land: "idle",
  landId: null,
};

let hud: FlightHud = initial;
const listeners = new Set<() => void>();

const same = (a: FlightHud, b: FlightHud) =>
  a.shipU === b.shipU &&
  a.speedNorm === b.speedNorm &&
  a.worldSpeed === b.worldSpeed &&
  a.nearId === b.nearId &&
  a.nextId === b.nextId &&
  a.nextDist === b.nextDist &&
  a.arrivedId === b.arrivedId &&
  a.speedMul === b.speedMul &&
  a.outside === b.outside &&
  a.land === b.land &&
  a.landId === b.landId;

let flightStoreRef: { get: () => FlightHud; publish: (n: FlightHud) => void } | null = null;
/** Switch between the cockpit and the outside camera (the HUD updates at once). */
export const setOutside = (outside: boolean) => {
  flightLive.outside = outside;
  if (flightStoreRef) flightStoreRef.publish({ ...flightStoreRef.get(), outside });
};

export const flightStore = {
  get: (): FlightHud => hud,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  publish(next: FlightHud) {
    if (same(hud, next)) return;
    hud = next;
    listeners.forEach((listener) => listener());
  },
};

flightStoreRef = flightStore;

/** Dive into the planet the ship is docked at (only works while arrived and not already landing). */
export const startLanding = (id: DestinationId) => {
  const h = flightStore.get();
  if (h.land !== "idle" || h.arrivedId !== id) return;
  flightLive.landCmd = { type: "land", id };
};
/** Lift off from the surface and go back to orbit. */
export const startTakeoff = () => {
  if (flightStore.get().land === "landed") flightLive.landCmd = { type: "takeoff" };
};
/** Subscribe to one primitive of the HUD snapshot, so callers do not re-render ten times a second. */
export function useFlightPick<T extends string | number | boolean | null>(pick: (h: FlightHud) => T): T {
  return useSyncExternalStore(
    flightStore.subscribe,
    () => pick(flightStore.get()),
    () => pick(initial)
  );
}

export const useFlight = (): FlightHud =>
  useSyncExternalStore(flightStore.subscribe, flightStore.get, () => initial);
