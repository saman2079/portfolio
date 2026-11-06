import { Lab } from "@/components/lab/Lab";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Dictionary } from "@/i18n/types";

export function LabSection({ t }: { t: Dictionary }) {
  return (
    <section id="lab" className="mx-auto max-w-5xl scroll-mt-16 px-5 py-20 sm:px-6 sm:py-28">
      <SectionHeading index={2} eyebrow={t.lab.eyebrow} title={t.lab.title} description={t.lab.description} />
      <Reveal className="mt-12">
        <Lab t={t.lab} />
      </Reveal>
    </section>
  );
}
