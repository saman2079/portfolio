"use client";

import { motion } from "framer-motion";
import {
  Code2,
  Layers3,
  Database,
  Gauge,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EditorChrome } from "@/components/ui/EditorChrome";
import { skillGroups } from "@/data/skills";

const categoryIcons: Record<string, LucideIcon> = {
  "Frontend Core": Code2,
  "Architecture & Rendering": Layers3,
  "State, Data & Forms": Database,
  "Performance & Tooling": Gauge,
  "Backend Familiarity": Wrench,
};

const technologyIcons: Record<string, string> = {
  HTML5: "html5/html5-original",
  CSS3: "css3/css3-original",
  "Sass / SCSS": "sass/sass-original",
  "JavaScript (ES6+)": "javascript/javascript-original",
  TypeScript: "typescript/typescript-original",
  "React.js": "react/react-original",
  "Next.js": "nextjs/nextjs-original",
  "Tailwind CSS": "tailwindcss/tailwindcss-original",
  "Framer Motion": "framermotion/framermotion-original",
  "Redux Toolkit": "redux/redux-original",
  "Context API": "react/react-original",
  Zustand: "zustand/zustand-original",
  "TanStack Query": "react/react-original",
  "React Hook Form": "react/react-original",
  Zod: "typescript/typescript-original",
  "Axios / REST API": "axios/axios-plain",
  "Git & GitHub": "github/github-original",
  "npm / pnpm": "npm/npm-original-wordmark",
  Vite: "vitejs/vitejs-original",
  "Node.js": "nodejs/nodejs-original",
  Express: "express/express-original",
  MongoDB: "mongodb/mongodb-original",
  PostgreSQL: "postgresql/postgresql-original",
  Redis: "redis/redis-original",
  "Docker / Compose": "docker/docker-original",
  Nginx: "nginx/nginx-original",
};

export function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-7xl px-6 py-28">
      <SectionHeading
        eyebrow="skills"
        title="My frontend engineering toolkit"
        description="A practical overview of the technologies and concepts I use across production frontend projects, plus the backend and infrastructure tools I’m familiar with."
      />

      <div className="mt-16 overflow-hidden rounded-lg border border-ink-600 bg-ink-900 shadow-lg">
        <EditorChrome fileName="skills.config.ts" />
        <div className="grid gap-8 p-6 sm:grid-cols-2 xl:grid-cols-3 sm:p-8">
          {skillGroups.map((group, groupIndex) => {
            const CategoryIcon = categoryIcons[group.category] ?? Code2;

            return (
              <div key={group.category}>
                <div className="mb-5 flex items-center gap-2 text-paper-300">
                  <CategoryIcon aria-hidden="true" size={16} />
                  <p className="font-mono text-xs uppercase tracking-wide text-paper-300">
                    {group.category}
                  </p>
                </div>
                <ul className="space-y-4">
                  {group.items.map((skill, i) => {
                    const iconPath = technologyIcons[skill.name];

                    return (
                      <li key={skill.name}>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2 text-sm text-paper-100">
                            {iconPath ? (
                              <img
                                src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${iconPath}.svg`}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                className="h-4 w-4 shrink-0 object-contain"
                              />
                            ) : (
                              <Code2
                                aria-hidden="true"
                                size={15}
                                className="shrink-0 text-paper-500"
                              />
                            )}
                            <span>{skill.name}</span>
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-paper-500">
                            {skill.level}/5
                          </span>
                        </div>
                        <div
                          className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700"
                          aria-label={`${skill.name}: ${skill.level} out of 5`}
                          role="img"
                        >
                          <motion.div
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: skill.level / 5 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{
                              duration: 0.6,
                              delay: groupIndex * 0.1 + i * 0.05,
                              ease: "easeOut",
                            }}
                            style={{ transformOrigin: "left" }}
                            className="h-full rounded-full bg-accent-blue"
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
