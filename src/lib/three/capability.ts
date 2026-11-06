export type WorldTier = "high" | "low" | "none";

export type WorldReason =
  | "ok"
  | "forced-off"
  | "forced-low"
  | "reduced-motion"
  | "save-data"
  | "no-webgl2"
  | "weak-device"
  | "constrained-device"
  | "context-lost"
  | "slow-frames"
  | "load-error";

export interface WorldCapability {
  tier: WorldTier;
  reason: WorldReason;
}

/** Rendering budgets per tier (see the Phase 2 plan: fewer particles, lower DPR on weaker devices). */
export const budgets = {
  high: { particles: 2000, dpr: 1.5 },
  low: { particles: 600, dpr: 1.25 },
} as const;

interface NavigatorHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    // Release the probe context right away; browsers cap the number of live contexts.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Decides, once and on the client, whether to run the 3D world.
 * "none" means the existing 2D experience is the experience. It is a full design
 * rather than a degraded one, so nothing is lost for the visitor.
 *
 * `?world=off` and `?world=low` force a tier, which is useful for testing and
 * for anyone who simply prefers the lighter page.
 */
export function detectCapability(): WorldCapability {
  const forced = new URLSearchParams(window.location.search).get("world");
  if (forced === "off") return { tier: "none", reason: "forced-off" };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { tier: "none", reason: "reduced-motion" };
  }

  const nav = navigator as NavigatorHints;
  if (nav.connection?.saveData) return { tier: "none", reason: "save-data" };
  if (!hasWebGL2()) return { tier: "none", reason: "no-webgl2" };

  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  if (memory <= 2 || cores <= 2) return { tier: "none", reason: "weak-device" };

  if (forced === "low") return { tier: "low", reason: "forced-low" };

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  if (coarse || narrow || memory <= 4 || cores <= 4) {
    return { tier: "low", reason: "constrained-device" };
  }

  return { tier: "high", reason: "ok" };
}
