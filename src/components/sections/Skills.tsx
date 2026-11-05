import { EditorChrome } from "@/components/ui/EditorChrome";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Dictionary } from "@/i18n/types";

/** Bars animate with a pure-CSS transform on first paint — no JS animation per bar. */
export function Skills({ t }: { t: Dictionary }) {
  const { skills } = t;
  return (
    <section id="skills" className="mx-auto max-w-5xl scroll-mt-16 px-5 py-20 sm:px-6 sm:py-28">
      <SectionHeading eyebrow={skills.eyebrow} title={skills.title} description={skills.description} />

      <Reveal className="mt-14 overflow-hidden rounded-xl border border-ink-600 bg-ink-900/80 shadow-lg">
        <EditorChrome fileName="skills.config.ts" />
        <div className="grid gap-10 p-6 sm:grid-cols-3 sm:p-8">
          {skills.groups.map((group) => (
            <div key={group.category}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-accent-violet">
                {group.category}
              </p>
              <ul className="space-y-4">
                {group.items.map((skill) => (
                  <li key={skill.name}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-sm text-paper-100">{skill.name}</span>
                      <span className="font-mono text-[11px] text-paper-500" dir="ltr">
                        {skill.level}/5
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-cyan rtl:bg-gradient-to-l"
                        style={{ width: `${(skill.level / 5) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
