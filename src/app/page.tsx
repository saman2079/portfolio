import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";
import { Contact } from "@/components/sections/Contact";
import { Reveal } from "@/components/ui/Reveal";

export default function HomePage() {
  return (
    <>
      <Reveal delay={0.2}>
        <Hero />
      </Reveal>
      <Reveal delay={0.5}>
        <About />
      </Reveal>

      <Reveal delay={0.2}>
        <Skills />
      </Reveal>

      <Reveal delay={0.2}>
        <Projects />
      </Reveal>

      <Reveal delay={0.2}>
        <Contact />
      </Reveal>
    </>
  );
}
