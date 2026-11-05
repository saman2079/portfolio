import { ArrowUpRight, Github } from "lucide-react";
import { EditorChrome } from "./EditorChrome";
import type { Project } from "@/i18n/types";

interface ProjectCardProps {
  project: Project;
  labels: { liveDemo: string; source: string };
}

export function ProjectCard({ project, labels }: ProjectCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-ink-600 bg-ink-900/80 transition-all duration-300 hover:-translate-y-1 hover:border-accent-blue/40 hover:shadow-glow">
      <EditorChrome fileName={project.fileName} />

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold text-paper-100">{project.title}</h3>
          <span className="shrink-0 rounded-full border border-accent-green/30 bg-accent-green/10 px-2.5 py-0.5 text-[11px] text-accent-green">
            {project.status}
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-paper-300">{project.description}</p>

        <ul className="mt-4 flex flex-wrap gap-2" dir="ltr">
          {project.stack.map((tech) => (
            <li
              key={tech}
              className="rounded border border-ink-600 bg-ink-800 px-2 py-0.5 font-mono text-[11px] text-accent-cyan"
            >
              {tech}
            </li>
          ))}
        </ul>

        {(project.liveUrl || project.repoUrl) && (
          <div className="mt-6 flex items-center gap-5 border-t border-ink-600 pt-4">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent-blue transition-colors hover:text-paper-100"
              >
                {labels.liveDemo} <ArrowUpRight size={14} className="rtl:-scale-x-100" />
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs text-paper-300 transition-colors hover:text-paper-100"
              >
                <Github size={14} /> {labels.source}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
