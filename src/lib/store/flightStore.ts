import { useSyncExternalStore } from "react";
import { DESTINATION_IDS, type DestinationId } from "@/lib/universe/destinations";

/** The flight path has one segment per destination (start → first planet → … → last planet). */
export const SEGMENTS = DESTINATION_IDS.length;

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
}

const initial: FlightHud = {
  shipU: 0,
  speedNorm: 0,
  worldSpeed: 0,
  nearId: null,
  nextId: "about",
  nextDist: null,
  arrivedId: null,
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
  a.arrivedId === b.arrivedId;

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

export const useFlight = (): FlightHud =>
  useSyncExternalStore(flightStore.subscribe, flightStore.get, () => initial);
