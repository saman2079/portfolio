export interface Skill {
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
}
export interface SkillGroup {
  category: string;
  items: Skill[];
}
export interface Project {
  slug: string;
  title: string;
  description: string;
  stack: string[];
  repoUrl?: string;
  liveUrl?: string;
  fileName: string;
  year: string;
  status: string;
  featured?: boolean;
}
export interface Job {
  role: string;
  company: string;
  period: string;
  points: string[];
}

export interface Dictionary {
  meta: { title: string; description: string; keywords: string[]; ogLocale: string };
  name: string;
  role: string;
  tagline: string;
  availability: string;
  nav: { label: string; href: string }[];
  ui: {
    sayHi: string;
    downloadResume: string;
    resumeHint: string;
    contactMe: string;
    scrollToOpen: string;
    loadingScene: string;
    menuOpen: string;
    menuClose: string;
    langLabel: string;
    switchTo: string;
    liveDemo: string;
    source: string;
  };
  hero: { whoami: string };
  about: { eyebrow: string; title: string; description: string; bio: string[]; stats: { label: string; value: string }[] };
  experience: { eyebrow: string; title: string; description: string; jobs: Job[] };
  skills: { eyebrow: string; title: string; description: string; groups: SkillGroup[] };
  projects: { eyebrow: string; title: string; description: string; items: Project[] };
  contact: {
    eyebrow: string;
    title: string;
    description: string;
    namePlaceholder: string;
    messagePlaceholder: string;
    messageLabel: string;
    send: string;
    subject: string;
    anonymous: string;
  };
  footer: { built: string };
}
