import { useSyncExternalStore } from "react";

export const SECTION_IDS = ["top", "about", "lab", "experience", "skills", "projects", "contact"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export interface SceneState {
  /** Section currently under the reading line; drives camera and core pose. */
  section: SectionId;
  /** Index of the project card the visitor is hovering or has focused, if any. */
  focusedProject: number | null;
}

let state: SceneState = { section: "top", focusedProject: null };
const listeners = new Set<() => void>();

const set = (patch: Partial<SceneState>) => {
  const next = { ...state, ...patch };
  if (next.section === state.section && next.focusedProject === state.focusedProject) return;
  state = next;
  listeners.forEach((listener) => listener());
};

/**
 * The page (DOM) is the source of truth; the 3D world only mirrors it. Anything
 * interactive in 3D has a DOM equivalent, so nothing is lost without WebGL.
 */
export const sceneStore = {
  get: (): SceneState => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setSection: (section: SectionId) => set({ section }),
  focusProject: (focusedProject: number | null) => set({ focusedProject }),
};

const server: SceneState = { section: "top", focusedProject: null };

export const useSceneState = (): SceneState =>
  useSyncExternalStore(sceneStore.subscribe, sceneStore.get, () => server);
