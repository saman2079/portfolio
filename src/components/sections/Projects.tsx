"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { projects } from "@/data/projects";

export function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-5xl px-6 py-28">
      <SectionHeading
        eyebrow="projects"
        title="A few things I've built"
        description="Selected work — from dashboards to small tools. Each card opens straight to the source or a live demo."
      />

      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        {projects.map((project, i) => (
          <motion.div
            key={project.slug}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
          >
            <ProjectCard project={project} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
