import { EditorChrome } from "@/components/ui/EditorChrome";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Dictionary } from "@/i18n/types";

export function About({ t }: { t: Dictionary }) {
  const { about } = t;
  return (
    <section id="about" className="mx-auto max-w-5xl scroll-mt-16 px-5 py-20 sm:px-6 sm:py-28">
      <SectionHeading eyebrow={about.eyebrow} title={about.title} description={about.description} />

      <Reveal className="mx-auto mt-10 max-w-3xl space-y-4 text-center leading-8 text-paper-300">
        {about.bio.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Reveal>

      <Reveal className="mt-12 overflow-hidden rounded-xl border border-ink-600 bg-ink-900/80 shadow-lg">
        <EditorChrome fileName="stats.json" />
        <div className="grid grid-cols-1 divide-y divide-ink-600 sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
          {about.stats.map((stat) => (
            <div key={stat.label} className="p-8 text-center">
              <p className="text-gradient font-display text-3xl font-bold">{stat.value}</p>
              <p className="mt-2 text-xs text-paper-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
