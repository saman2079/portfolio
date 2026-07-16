import { SkillGroup } from "@/types";

export const skillGroups: SkillGroup[] = [
  {
    category: "بنیادی",
    items: [
      { name: "HTML و CSS", level: 5 },
      { name: "JavaScript", level: 4 },
      { name: "TypeScript", level: 4 },
    ],
  },
  {
    category: "فریم‌ورک",
    items: [
      { name: "React", level: 4 },
      { name: "Next.js", level: 4 },
      { name: "Tailwind CSS", level: 5 },
    ],
  },
  {
    category: "ابزارها",
    items: [
      { name: "Git و GitHub", level: 4 },
      { name: "Docker", level: 3 },
      { name: "بک‌اند با کمک هوش مصنوعی", level: 3 },
    ],
  },
];