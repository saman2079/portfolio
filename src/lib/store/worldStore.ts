import { useSyncExternalStore } from "react";
import type { WorldCapability, WorldReason, WorldTier } from "@/lib/three/capability";

export type WorldStatus = "pending" | "active" | "fallback";

export interface WorldState {
  status: WorldStatus;
  tier: WorldTier;
  reason: WorldReason | null;
}

const initial: WorldState = { status: "pending", tier: "none", reason: null };

let state: WorldState = initial;
const listeners = new Set<() => void>();

function commit(next: WorldState) {
  state = next;
  // Mirrored on <html> so CSS, tests and the 2D fallback can react without JS state.
  if (typeof document !== "undefined") {
    document.documentElement.dataset.world = next.status;
    document.documentElement.dataset.worldTier = next.tier;
  }
  listeners.forEach((listener) => listener());
}

/** One writer for the whole 3D lifecycle: detect → active → (degrade) → fallback. */
export const worldStore = {
  get: (): WorldState => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  resolve(cap: WorldCapability) {
    if (cap.tier === "none") {
      commit({ status: "fallback", tier: "none", reason: cap.reason });
    } else {
      commit({ status: "active", tier: cap.tier, reason: cap.reason });
    }
  },
  /** Sustained low FPS: step down once, then give up and use the 2D experience. */
  degrade() {
    if (state.status !== "active") return;
    if (state.tier === "high") {
      commit({ status: "active", tier: "low", reason: "slow-frames" });
    } else {
      commit({ status: "fallback", tier: "none", reason: "slow-frames" });
    }
  },
  fail(reason: WorldReason) {
    if (state.status === "fallback") return;
    commit({ status: "fallback", tier: "none", reason });
  },
};

const serverState = initial;

export const useWorld = (): WorldState =>
  useSyncExternalStore(worldStore.subscribe, worldStore.get, () => serverState);
