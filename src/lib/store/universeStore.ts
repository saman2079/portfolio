import { useSyncExternalStore } from "react";
import { DESTINATIONS, type DestinationId } from "@/lib/universe/destinations";
import { flyToStation, openSection } from "@/lib/flight/controller";

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
  /** Fly the ship to a destination (animates the scroll position). */
  goTo: (id: DestinationId) => flyToStation(id),
  /** Phase 2: the destination's content is still the 2D section; phase 5 opens it in the universe. */
  openSection(id: DestinationId) {
    const section = DESTINATIONS.find((d) => d.id === id)?.section ?? id;
    openSection(section);
  },
};

const server: UniverseState = { hovered: null };

export const useUniverse = (): UniverseState =>
  useSyncExternalStore(universeStore.subscribe, universeStore.get, () => server);
