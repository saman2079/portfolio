import { SkillGroup } from "@/types";

export const skillGroups: SkillGroup[] = [
  {
    category: "Frontend Core",
    items: [
      { name: "HTML5", level: 5 },
      { name: "CSS3", level: 5 },
      { name: "Sass / SCSS", level: 4 },
      { name: "JavaScript (ES6+)", level: 4 },
      { name: "TypeScript", level: 4 },
      { name: "React.js", level: 4 },
      { name: "Next.js", level: 4 },
      { name: "Tailwind CSS", level: 5 },
      { name: "Framer Motion", level: 3 },
    ],
  },
  {
    category: "Architecture & Rendering",
    items: [
      { name: "Component Architecture", level: 4 },
      { name: "Reusable Components", level: 5 },
      { name: "SSR", level: 4 },
      { name: "CSR", level: 4 },
      { name: "SSG / ISR", level: 4 },
      { name: "Code Splitting", level: 3 },
      { name: "Lazy Loading", level: 3 },
    ],
  },
  {
    category: "State, Data & Forms",
    items: [
      { name: "Redux Toolkit", level: 3 },
      { name: "Context API", level: 4 },
      { name: "Zustand", level: 4 },
      { name: "TanStack Query", level: 4 },
      { name: "React Hook Form", level: 3 },
      { name: "Zod", level: 3 },
      { name: "Axios / REST API", level: 4 },
      { name: "JWT Authentication", level: 3 },
    ],
  },
  {
    category: "Performance & Tooling",
    items: [
      { name: "Performance Optimization", level: 3 },
      { name: "SEO Optimization", level: 4 },
      { name: "Responsive Design", level: 5 },
      { name: "Git & GitHub", level: 4 },
      { name: "npm / pnpm", level: 4 },
      { name: "Vite", level: 3 },
    ],
  },
  {
    category: "Backend Familiarity",
    items: [
      { name: "Node.js", level: 3 },
      { name: "Express", level: 3 },
      { name: "MongoDB", level: 2 },
      { name: "PostgreSQL", level: 3 },
      { name: "Redis", level: 2 },
      { name: "Docker / Compose", level: 3 },
      { name: "Nginx", level: 2 },
    ],
  },
];