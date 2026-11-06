export const HUES = ["blue", "cyan", "violet", "amber", "green"] as const;
export type LabHue = (typeof HUES)[number];

/** Same hues as the site's accent tokens, so the Lab feels like part of the design system. */
export const hueColors: Record<LabHue, string> = {
  blue: "#61AFEF",
  cyan: "#56B6C2",
  violet: "#C678DD",
  amber: "#E5C07B",
  green: "#98C379",
};

export const SHAPES = ["orb", "ring", "prism"] as const;
export type CoreShape = (typeof SHAPES)[number];
