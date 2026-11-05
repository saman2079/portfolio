import { Reveal } from "@/components/ui/Reveal";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Dictionary } from "@/i18n/types";

export function Projects({ t }: { t: Dictionary }) {
  const { projects } = t;
  return (
    <section id="projects" className="mx-auto max-w-5xl scroll-mt-16 px-5 py-20 sm:px-6 sm:py-28">
      <SectionHeading eyebrow={projects.eyebrow} title={projects.title} description={projects.description} />

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {projects.items.map((project, i) => (
          <Reveal key={project.slug} delay={(i % 2) * 0.08}>
            <ProjectCard project={project} labels={t.ui} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
