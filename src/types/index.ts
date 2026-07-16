export type ProjectStatus = "منتشر شده" | "در حال توسعه" | "آرشیو شده";

export interface Project {
  slug: string;
  title: string;
  description: string;
  stack: string[];
  repoUrl?: string;
  liveUrl?: string;
  fileName: string; // shown in the fake editor tab, e.g. "landing-page.tsx"
  year: string;
  status: ProjectStatus;
  featured?: boolean;
}

export interface SkillGroup {
  category: string;
  items: Skill[];
}

export interface Skill {
  name: string;
  level: 1 | 2 | 3 | 4 | 5; // out of 5, rendered as a proficiency bar
}

export interface NavLink {
  label: string;
  href: string;
}