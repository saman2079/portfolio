import { useSyncExternalStore } from "react";
import { DESTINATIONS, type DestinationId } from "@/lib/universe/destinations";
import { flyToStation, openSection } from "@/lib/flight/controller";

export interface UniverseState {
  /** destination currently hovered (in 3D or in the HUD list) */
  hovered: DestinationId | null;
  /** destination whose content panel is open */
  panel: DestinationId | null;
  /** destination the ship is flying to; its panel opens on arrival */
  pending: DestinationId | null;
}

let state: UniverseState = { hovered: null, panel: null, pending: null };
const listeners = new Set<() => void>();

function set(patch: Partial<UniverseState>) {
  const next = { ...state, ...patch };
  if (next.hovered === state.hovered && next.panel === state.panel && next.pending === state.pending) return;
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
  /** Fly the ship to a destination; its content panel opens when the ship arrives. */
  goTo(id: DestinationId) {
    set({ pending: id, panel: state.panel === id ? id : null });
    flyToStation(id);
  },
  /** Stop waiting for an arrival (the pilot took over by scrolling). */
  cancelPending: () => set({ pending: null }),
  openPanel: (id: DestinationId) => set({ panel: id, pending: null }),
  closePanel: () => set({ panel: null, pending: null }),
  /** Leave the universe and jump to the classic 2D section of a destination. */
  openClassic(id: DestinationId) {
    const section = DESTINATIONS.find((d) => d.id === id)?.section ?? id;
    set({ panel: null, pending: null });
    openSection(section);
  },
};

const server: UniverseState = { hovered: null, panel: null, pending: null };

export const useUniverse = (): UniverseState =>
  useSyncExternalStore(universeStore.subscribe, universeStore.get, () => server);
