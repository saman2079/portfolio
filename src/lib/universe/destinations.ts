export const DESTINATION_IDS = ["about", "skills", "experience", "projects", "lab", "contact"] as const;
export type DestinationId = (typeof DESTINATION_IDS)[number];

type Vec3 = [number, number, number];

export type PlanetModelKind = "smac" | "gas" | "continental" | "frozen" | "lava" | "barren";

export interface DestinationConfig {
  id: DestinationId;
  /** which planet of the Various Planets model is shown */
  model: PlanetModelKind;
  /** id of the matching DOM section: the 2D page stays the source of truth. */
  section: string;
  position: Vec3;
  radius: number;
  /** low / mid / high surface colours */
  colors: [string, string, string];
  atmosphere: string;
  /** number of latitude bands (gas-giant look) */
  bands: number;
  /** 0 = rocky terrain, 1 = fully banded */
  bandMix: number;
  cloud: number;
  /** art-directed light direction (world space) */
  light: Vec3;
  spin: number;
  seed: number;
  ring?: { inner: number; outer: number; color: string; tilt: number };
}

/** The sun sits far away to the right; the big horizon planet is lit by it for real. */
export const SUN_POSITION: Vec3 = [116, 26, -148];

export const DESTINATIONS: DestinationConfig[] = [
  {
    id: "about",
    model: "continental",
    section: "about",
    position: [-17, 11, -46],
    radius: 6.76,
    colors: ["#14312f", "#2f7a70", "#d9e2e3"],
    atmosphere: "#6fc4ff",
    bands: 6,
    bandMix: 0,
    cloud: 0.65,
    light: [0.75, 0.35, 0.6],
    spin: 0.05,
    seed: 1.3,
  },
  {
    id: "skills",
    model: "gas",
    section: "skills",
    position: [21, -3, -82],
    radius: 9.75,
    colors: ["#7a4410", "#c98a2a", "#f0c880"],
    atmosphere: "#ffb25a",
    bands: 14,
    bandMix: 0.85,
    cloud: 0,
    light: [-0.6, 0.45, 0.65],
    spin: 0.06,
    seed: 2.9,
    ring: { inner: 1.35, outer: 2.1, color: "#bff7ee", tilt: 0.42 },
  },
  {
    id: "experience",
    model: "barren",
    section: "experience",
    position: [-21, 5, -130],
    radius: 8.45,
    colors: ["#3a2214", "#7a4a2c", "#c08a5c"],
    atmosphere: "#d28a55",
    bands: 7,
    bandMix: 0.15,
    cloud: 0.25,
    light: [0.7, 0.4, 0.6],
    spin: 0.04,
    seed: 7.7,
  },
  {
    id: "projects",
    model: "lava",
    section: "projects",
    position: [18, 5, -182],
    radius: 10.4,
    colors: ["#1d1512", "#5a3a2c", "#ff7a2a"],
    atmosphere: "#ff6a2a",
    bands: 10,
    bandMix: 0.9,
    cloud: 0,
    light: [0.65, 0.4, 0.65],
    spin: 0.05,
    seed: 9.4,
  },
  {
    id: "lab",
    model: "frozen",
    section: "lab",
    position: [-13, -4, -236],
    radius: 9.6,
    colors: ["#3d3b49", "#7b7d92", "#dfe3f0"],
    atmosphere: "#a9b8ff",
    bands: 8,
    bandMix: 0.4,
    cloud: 0.2,
    light: [-0.7, 0.3, 0.65],
    spin: 0.07,
    seed: 4.1,
  },
  {
    id: "contact",
    model: "smac",
    section: "contact",
    position: [9, 2, -292],
    radius: 7.8,
    colors: ["#4a2616", "#9a3a24", "#d7d3d0"],
    atmosphere: "#e0906c",
    bands: 5,
    bandMix: 0.1,
    cloud: 0.4,
    light: [-0.6, 0.4, 0.7],
    spin: 0.04,
    seed: 5.6,
  },
];

/** Planets are drawn 25% larger than their authored radii (docking distance follows the radius). */
for (const d of DESTINATIONS) d.radius *= 1.25;

/** Large decorative planet on the right of the opening view (not a destination). */
export const HORIZON_PLANET: DestinationConfig = {
  id: "projects",
  model: "gas",
  section: "top",
  position: [175, -45, -150],
  radius: 80,
  colors: ["#1c1830", "#7a4a52", "#e8b89a"],
  atmosphere: "#ff9966",
  bands: 6,
  bandMix: 0.1,
  cloud: 0.18,
  light: [0, 0, 1],
  spin: 0.006,
  seed: 12.2,
};

/**
 * On a narrow (phone) screen the horizontal field of view is small, so planets standing on
 * alternate sides of the route land on top of each other. Push them further apart sideways
 * and vertically; the flight path, asteroids and docking all read these positions.
 */
if (typeof window !== "undefined" && window.innerWidth / Math.max(1, window.innerHeight) < 0.8) {
  for (const d of DESTINATIONS) {
    d.position = [d.position[0] * 1.7, d.position[1] * 1.5 + (d.position[0] < 0 ? 2 : -2), d.position[2]];
  }
}
