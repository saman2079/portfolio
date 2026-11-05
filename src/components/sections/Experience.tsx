import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Dictionary } from "@/i18n/types";

export function Experience({ t }: { t: Dictionary }) {
  const { experience } = t;
  return (
    <section id="experience" className="mx-auto max-w-3xl scroll-mt-16 px-5 py-20 sm:px-6 sm:py-28">
      <SectionHeading eyebrow={experience.eyebrow} title={experience.title} description={experience.description} />

      <ol className="relative mt-14 space-y-10 border-s border-ink-600 ps-8">
        {experience.jobs.map((job) => (
          <li key={`${job.company}-${job.period}`} className="relative">
            <span
              aria-hidden
              className="absolute -start-[2.4rem] top-1.5 h-3 w-3 rounded-full border-2 border-accent-blue bg-ink-950 shadow-glow"
            />
            <Reveal>
              <p className="text-xs text-accent-green">{job.period}</p>
              <h3 className="mt-1 font-display text-lg font-bold text-paper-100">
                {job.role} <span className="text-paper-500">·</span>{" "}
                <span className="text-accent-blue">{job.company}</span>
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 ps-5 text-sm leading-7 text-paper-300 marker:text-accent-blue/60">
                {job.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
