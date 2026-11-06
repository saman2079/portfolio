import { Window } from "@/components/os/Window";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Dictionary } from "@/i18n/types";

export function About({ t }: { t: Dictionary }) {
  const { about } = t;
  return (
    <section id="about" className="mx-auto max-w-5xl scroll-mt-16 px-5 py-20 sm:px-6 sm:py-28">
      <SectionHeading index={1} eyebrow={about.eyebrow} title={about.title} description={about.description} />

      <Reveal className="mx-auto mt-10 max-w-3xl space-y-4 text-center leading-8 text-paper-300">
        {about.bio.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </Reveal>

      <Reveal className="mt-12">
        <Window title="stats.json">
          <dl className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
            {about.stats.map((stat) => (
              <div key={stat.label} className="p-8 text-center">
                <dd className="text-gradient font-display text-3xl font-bold">{stat.value}</dd>
                <dt className="mt-2 text-xs text-paper-500">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </Window>
      </Reveal>
    </section>
  );
}
