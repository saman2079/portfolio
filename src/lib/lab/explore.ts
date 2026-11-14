/**
 * Fog of war for the Lab map: the colony plate is known from the start; everything else is black until
 * the drone flies over it or you walk there in attack mode. Discovered places are saved.
 * (Enemy bases you found are known too: scoutSim adds them when it fills the shader.)
 */
export const MAX_TRAIL = 34;
const KEY = "lab-explore-v1";

export const explore = {
  /** explored circles: x, z, radius */
  trail: [] as [number, number, number][],
  ver: 0,
};

let loaded = false;
export function loadExplore() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const d = JSON.parse(raw) as [number, number, number][];
    if (Array.isArray(d)) explore.trail = d.filter((p) => Array.isArray(p) && p.length === 3 && p.every((n) => typeof n === "number")).slice(-MAX_TRAIL);
    explore.ver++;
  } catch {
    /* corrupt save: nothing explored yet */
  }
}

let saveAt = 0;
function save() {
  const now = Date.now();
  if (now - saveAt < 1500) return;
  saveAt = now;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(explore.trail));
  } catch {
    /* private mode */
  }
}

/** mark a circle as explored (skips if the spot is already well covered) */
export function reveal(x: number, z: number, r: number) {
  loadExplore();
  const t = explore.trail;
  for (const p of t) if (p[2] >= r * 0.9 && Math.hypot(p[0] - x, p[1] - z) < Math.max(5, p[2] * 0.3)) return;
  t.push([x, z, r]);
  if (t.length > MAX_TRAIL) t.shift();
  explore.ver++;
  save();
}
