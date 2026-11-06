export const HUES = ["blue", "cyan", "violet", "amber", "green"] as const;
export type LabHue = (typeof HUES)[number];

/** Neon space palette shared by the 3D core and the Interactive Lab. */
export const hueColors: Record<LabHue, string> = {
  blue: "#4F8CFF",
  cyan: "#38BDF8",
  violet: "#A855F7",
  amber: "#F0A7FF",
  green: "#7C8CFF",
};

export const SHAPES = ["orb", "ring", "prism"] as const;
export type CoreShape = (typeof SHAPES)[number];
