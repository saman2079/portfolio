import { notFound } from "next/navigation";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { LabSection } from "@/components/sections/LabSection";
import { Experience } from "@/components/sections/Experience";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";
import { Contact } from "@/components/sections/Contact";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";

export default function HomePage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang;
  const t = getDictionary(lang);

  return (
    <>
      <Hero lang={lang} t={t} />
      <About t={t} />
      <LabSection t={t} />
      <Experience t={t} />
      <Skills t={t} />
      <Projects t={t} />
      <Contact lang={lang} t={t} />
    </>
  );
}
