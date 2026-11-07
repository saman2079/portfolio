export const DESTINATION_IDS = ["about", "lab", "experience", "skills", "projects", "contact"] as const;
export type DestinationId = (typeof DESTINATION_IDS)[number];

type Vec3 = [number, number, number];

export interface DestinationConfig {
  id: DestinationId;
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
    section: "about",
    position: [-17, 11, -46],
    radius: 5.2,
    colors: ["#0b2a5a", "#1f6fb2", "#d9e8f5"],
    atmosphere: "#5ab4ff",
    bands: 6,
    bandMix: 0,
    cloud: 0.65,
    light: [0.75, 0.35, 0.6],
    spin: 0.05,
    seed: 1.3,
  },
  {
    id: "lab",
    section: "lab",
    position: [21, -3, -82],
    radius: 4.6,
    colors: ["#2a0f4d", "#7b3fe4", "#e0b3ff"],
    atmosphere: "#b57bff",
    bands: 8,
    bandMix: 0.4,
    cloud: 0.2,
    light: [-0.7, 0.3, 0.65],
    spin: 0.07,
    seed: 4.1,
  },
  {
    id: "experience",
    section: "experience",
    position: [-21, 5, -130],
    radius: 6.5,
    colors: ["#3a2412", "#b0652a", "#e9b36b"],
    atmosphere: "#ff9a4d",
    bands: 7,
    bandMix: 0.15,
    cloud: 0.25,
    light: [0.7, 0.4, 0.6],
    spin: 0.04,
    seed: 7.7,
  },
  {
    id: "skills",
    section: "skills",
    position: [18, 5, -182],
    radius: 7.5,
    colors: ["#0d3b3f", "#1fa6a0", "#c8fff3"],
    atmosphere: "#5ff2e0",
    bands: 14,
    bandMix: 0.85,
    cloud: 0,
    light: [-0.6, 0.45, 0.65],
    spin: 0.06,
    seed: 2.9,
    ring: { inner: 1.35, outer: 2.1, color: "#bff7ee", tilt: 0.42 },
  },
  {
    id: "projects",
    section: "projects",
    position: [-13, -4, -236],
    radius: 8,
    colors: ["#5a1a0a", "#e0561f", "#ffd199"],
    atmosphere: "#ff7a3d",
    bands: 10,
    bandMix: 0.9,
    cloud: 0,
    light: [0.65, 0.4, 0.65],
    spin: 0.05,
    seed: 9.4,
  },
  {
    id: "contact",
    section: "contact",
    position: [9, 2, -292],
    radius: 6,
    colors: ["#5f7fa6", "#cfe0f2", "#ffffff"],
    atmosphere: "#9fd2ff",
    bands: 5,
    bandMix: 0.1,
    cloud: 0.4,
    light: [-0.6, 0.4, 0.7],
    spin: 0.04,
    seed: 5.6,
  },
];

/** Large decorative planet on the right of the opening view (not a destination). */
export const HORIZON_PLANET: DestinationConfig = {
  id: "projects",
  section: "top",
  position: [62, -26, -70],
  radius: 34,
  colors: ["#1c1830", "#7a4a52", "#e8b89a"],
  atmosphere: "#ff9966",
  bands: 6,
  bandMix: 0.1,
  cloud: 0.18,
  light: [0, 0, 1],
  spin: 0.006,
  seed: 12.2,
};
