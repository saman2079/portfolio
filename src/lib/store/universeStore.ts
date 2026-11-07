import { useSyncExternalStore } from "react";
import { DESTINATIONS, type DestinationId } from "@/lib/universe/destinations";

export interface UniverseState {
  /** destination currently hovered (in 3D or in the HUD list) */
  hovered: DestinationId | null;
}

let state: UniverseState = { hovered: null };
const listeners = new Set<() => void>();

function set(patch: Partial<UniverseState>) {
  const next = { ...state, ...patch };
  if (next.hovered === state.hovered) return;
  state = next;
  listeners.forEach((listener) => listener());
}

export const universeStore = {
  get: (): UniverseState => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  hover: (hovered: DestinationId | null) => set({ hovered }),
  /** Phase 1: jump to the matching section. Phase 2 replaces this with a ship flight. */
  goTo(id: DestinationId) {
    const section = DESTINATIONS.find((d) => d.id === id)?.section ?? id;
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  },
};

const server: UniverseState = { hovered: null };

export const useUniverse = (): UniverseState =>
  useSyncExternalStore(universeStore.subscribe, universeStore.get, () => server);
