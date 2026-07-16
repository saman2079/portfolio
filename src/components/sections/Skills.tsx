"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EditorChrome } from "@/components/ui/EditorChrome";
import { skillGroups } from "@/data/skills";

export function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-4xl px-6 py-28">
      <SectionHeading
        eyebrow="skills"
        title="Tools I reach for"
        description="A focused stack, not a buzzword list — everything below is something I use and ship with regularly."
      />

      <div className="mt-16 overflow-hidden rounded-lg border border-ink-600 bg-ink-900 shadow-lg">
        <EditorChrome fileName="skills.config.ts" />
        <div className="grid gap-8 p-6 sm:grid-cols-3 sm:p-8">
          {skillGroups.map((group, groupIndex) => (
            <div key={group.category}>
              <p className="mb-4 font-mono text-xs uppercase tracking-wide text-paper-500">
                {group.category}
              </p>
              <ul className="space-y-4">
                {group.items.map((skill, i) => (
                  <li key={skill.name}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm text-paper-100">{skill.name}</span>
                      <span className="font-mono text-[11px] text-paper-500">{skill.level}/5</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: skill.level / 5 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.6, delay: groupIndex * 0.1 + i * 0.05, ease: "easeOut" }}
                        style={{ transformOrigin: "left" }}
                        className="h-full rounded-full bg-accent-blue"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
