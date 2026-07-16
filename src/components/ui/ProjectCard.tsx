import { ArrowUpRight, Github } from "lucide-react";
import { EditorChrome } from "./EditorChrome";
import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-ink-600 bg-ink-900 transition-colors hover:border-accent-blue/40">
      <EditorChrome fileName={project.fileName} />

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-lg font-semibold text-paper-100">{project.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-paper-300">{project.description}</p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <li
              key={tech}
              className="rounded border border-ink-600 bg-ink-800 px-2 py-0.5 font-mono text-[11px] text-accent-cyan"
            >
              {tech}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center gap-4 border-t border-ink-600 pt-4">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-mono text-xs text-accent-blue transition-colors hover:text-paper-100"
            >
              Live demo <ArrowUpRight size={14} />
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-mono text-xs text-paper-300 transition-colors hover:text-paper-100"
            >
              <Github size={14} /> Source
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
