import { useSyncExternalStore } from "react";
import type { CoreShape, LabHue } from "@/lib/lab/palette";

export interface LabState {
  hue: LabHue;
  /** 0–100 */
  light: number;
  /** 0–100 (0 pauses the motion) */
  speed: number;
  /** 1–10 */
  particleSize: number;
  shape: CoreShape;
}

export const defaultLabState: LabState = {
  hue: "cyan",
  light: 70,
  speed: 40,
  particleSize: 4,
  shape: "orb",
};

/**
 * A tiny external store (no dependency). The Lab controls write to it and any
 * view — today the CSS preview, later the 3D scene — can subscribe to it. The
 * snapshot is only replaced on change, so subscribers never re-render for free.
 */
let state: LabState = defaultLabState;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const labStore = {
  get: (): LabState => state,
  set(patch: Partial<LabState>) {
    state = { ...state, ...patch };
    emit();
  },
  reset() {
    state = defaultLabState;
    emit();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const useLabState = (): LabState =>
  useSyncExternalStore(labStore.subscribe, labStore.get, () => defaultLabState);
