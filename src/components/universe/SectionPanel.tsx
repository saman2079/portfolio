"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowUpRight, Download, ExternalLink, Github, Send, X } from "lucide-react";
import { resumeFor, type Locale } from "@/i18n/config";
import { siteConfig } from "@/i18n/site";
import { universeText } from "@/i18n/universe";
import type { Dictionary } from "@/i18n/types";
import { DESTINATIONS, type DestinationId } from "@/lib/universe/destinations";
import { stationU, useFlight } from "@/lib/store/flightStore";
import { universeStore, useUniverse } from "@/lib/store/universeStore";
import { cn } from "@/lib/utils";

/** The slice of the site dictionary the in-universe panels show (all real content, nothing extra). */
export interface UniverseContent {
  about: Dictionary["about"];
  lab: { title: string; description: string };
  experience: Dictionary["experience"];
  skills: Dictionary["skills"];
  projects: Dictionary["projects"];
  contact: Dictionary["contact"];
  ui: { liveDemo: string; source: string; downloadResume: string };
}

const chip = "rounded-md border border-cyan-300/25 bg-cyan-400/5 px-2 py-0.5 font-mono text-[11px] text-cyan-100";
const link =
  "inline-flex min-h-9 items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-3 text-xs font-semibold text-paper-100 transition hover:border-cyan-300/60";

function About({ c }: { c: UniverseContent["about"] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-paper-100">{c.description}</p>
      {c.bio.map((p) => (
        <p key={p} className="text-sm leading-7 text-paper-300">
          {p}
        </p>
      ))}
      <dl className="grid grid-cols-3 gap-2 pt-2">
        {c.stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
            <dd dir="ltr" className="font-mono text-lg font-bold text-orange-300">
              {s.value}
            </dd>
            <dt className="mt-1 text-[11px] leading-4 text-paper-300">{s.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Experience({ c }: { c: UniverseContent["experience"] }) {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-7 text-paper-300">{c.description}</p>
      <ol className="space-y-5 border-s border-cyan-300/25 ps-4">
        {c.jobs.map((job) => (
          <li key={`${job.company}-${job.period}`} className="relative">
            <span aria-hidden className="absolute -start-[1.32rem] top-1.5 h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.9)]" />
            <p className="text-sm font-bold text-white">{job.role}</p>
            <p className="text-xs text-cyan-200">
              {job.company} · <span dir="ltr">{job.period}</span>
            </p>
            <ul className="mt-2 list-disc space-y-1 ps-4 text-[13px] leading-6 text-paper-300">
              {job.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Skills({ c }: { c: UniverseContent["skills"] }) {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-7 text-paper-300">{c.description}</p>
      {c.groups.map((g) => (
        <div key={g.category}>
          <h3 className="mb-2 text-xs font-semibold text-orange-300">{g.category}</h3>
          <ul className="space-y-3">
            {g.items.map((s) => (
              <li key={s.name}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm text-paper-100">
                  <span>{s.name}</span>
                  <span aria-hidden dir="ltr" className="font-mono text-[11px] text-paper-500">
                    {s.level}/5
                  </span>
                </div>
                <div
                  role="meter"
                  aria-label={s.name}
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-valuenow={s.level}
                  className="h-1.5 overflow-hidden rounded-full bg-white/10"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-500 rtl:bg-gradient-to-l"
                    style={{ width: `${(s.level / 5) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Projects({ c, ui }: { c: UniverseContent["projects"]; ui: UniverseContent["ui"] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-paper-300">{c.description}</p>
      {c.items.map((p) => (
        <article key={p.slug} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-white">{p.title}</h3>
            <span dir="ltr" className="shrink-0 font-mono text-[11px] text-paper-500">
              {p.year} · {p.status}
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-6 text-paper-300">{p.description}</p>
          <ul dir="ltr" className="mt-3 flex flex-wrap gap-1.5">
            {p.stack.map((s) => (
              <li key={s} className={chip}>
                {s}
              </li>
            ))}
          </ul>
          {(p.liveUrl || p.repoUrl) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {p.liveUrl && (
                <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className={link}>
                  <ExternalLink size={13} aria-hidden /> {ui.liveDemo}
                </a>
              )}
              {p.repoUrl && (
                <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className={link}>
                  <Github size={13} aria-hidden /> {ui.source}
                </a>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

/** No backend by design (same as the 2D page): submitting opens the visitor's mail client. */
function Contact({ c, ui, lang }: { c: UniverseContent["contact"]; ui: UniverseContent["ui"]; lang: Locale }) {
  const u = universeText[lang];
  const name = useRef<HTMLInputElement>(null);
  const message = useRef<HTMLTextAreaElement>(null);
  const field =
    "mt-1.5 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-paper-100 outline-none placeholder:text-paper-500 focus:border-cyan-300";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`${c.subject} ${name.current?.value || c.anonymous}`);
    const body = encodeURIComponent(message.current?.value ?? "");
    window.location.href = `mailto:${siteConfig.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-paper-300">{c.description}</p>
      <form onSubmit={submit} className="space-y-3">
        <input ref={name} placeholder={c.namePlaceholder} autoComplete="name" className={field} />
        <textarea ref={message} required rows={4} placeholder={c.messagePlaceholder} className={cn(field, "resize-none")} />
        <button
          type="submit"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-orange-400/80 bg-orange-500/10 px-4 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20"
        >
          {c.send} <Send size={14} aria-hidden className="rtl:-scale-x-100" />
        </button>
      </form>
      <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
        <a href={`mailto:${siteConfig.email}`} className={link}>
          {u.email}
        </a>
        <a href={siteConfig.social.telegram} target="_blank" rel="noopener noreferrer" className={link}>
          {u.telegram}
        </a>
        <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className={link}>
          <Github size={13} aria-hidden /> {u.github}
        </a>
        <a href={resumeFor(lang)} download className={link}>
          <Download size={13} aria-hidden /> {ui.downloadResume}
        </a>
      </div>
    </div>
  );
}

/** Content card that opens beside the planet the ship has docked at. */
export function SectionPanel({ lang, content }: { lang: Locale; content: UniverseContent }) {
  const u = universeText[lang];
  const { panel, pending } = useUniverse();
  const flight = useFlight();
  const scroller = useRef<HTMLDivElement>(null);

  // landed: let the descent settle, then open the planet's card
  const landState = flight.land;
  const landId = flight.landId;
  useEffect(() => {
    if (landState === "landed" && landId) {
      const timer = window.setTimeout(() => universeStore.openPanel(landId), 2400);
      return () => window.clearTimeout(timer);
    }
    if (landState === "ascending" || landState === "idle") universeStore.closePanel();
  }, [landState, landId]);

  // the pilot takes over by scrolling: forget the pending arrival
  useEffect(() => {
    if (!pending) return;
    const cancel = () => universeStore.cancelPending();
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    const timer = window.setTimeout(cancel, 25000);
    return () => {
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.clearTimeout(timer);
    };
  }, [pending]);

  // close when the ship leaves the planet, or on Escape
  useEffect(() => {
    if (!panel) return;
    if (flight.land === "idle" && Math.abs(flight.shipU - stationU(panel)) > 0.1) universeStore.closePanel();
  }, [panel, flight.shipU, flight.land]);
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") universeStore.closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [panel]);

  const id: DestinationId | null = panel;
  const cfg = DESTINATIONS.find((d) => d.id === id);
  const caps = lang === "en" ? "uppercase tracking-[0.16em]" : "";

  let body: ReactNode = null;
  if (id === "about") body = <About c={content.about} />;
  else if (id === "experience") body = <Experience c={content.experience} />;
  else if (id === "skills") body = <Skills c={content.skills} />;
  else if (id === "projects") body = <Projects c={content.projects} ui={content.ui} />;
  else if (id === "contact") body = <Contact c={content.contact} ui={content.ui} lang={lang} />;
  else if (id === "lab")
    body = (
      <div className="space-y-4">
        <p className="text-sm leading-7 text-paper-300">{content.lab.description}</p>
        <button
          type="button"
          onClick={() => universeStore.openClassic("lab")}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-orange-400/80 bg-orange-500/10 px-4 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20"
        >
          {u.openLab} <ArrowUpRight size={15} aria-hidden className="rtl:-scale-x-100" />
        </button>
      </div>
    );

  return (
    <aside
      role="dialog"
      aria-label={id ? u.places[id].title : undefined}
      aria-hidden={!id}
      data-open={id ? "true" : "false"}
      className={cn(
        "universe-glass pointer-events-none absolute z-20 flex flex-col overflow-hidden opacity-0 transition-all duration-500",
        "inset-x-3 bottom-3 max-h-[72svh] translate-y-6 rounded-2xl",
        "sm:inset-x-auto sm:end-5 sm:top-24 sm:bottom-5 sm:max-h-none sm:w-[28rem] sm:translate-y-0 sm:translate-x-6 rtl:sm:-translate-x-6",
        "data-[open=true]:pointer-events-auto data-[open=true]:translate-x-0 data-[open=true]:translate-y-0 data-[open=true]:opacity-100 rtl:sm:data-[open=true]:translate-x-0"
      )}
    >
      {cfg && id && (
        <>
          <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <span
              aria-hidden
              className="h-9 w-9 shrink-0 rounded-full shadow-[0_0_18px_rgba(125,211,252,0.35)]"
              style={{ background: `radial-gradient(circle at 34% 30%, ${cfg.colors[2]}, ${cfg.colors[1]} 45%, ${cfg.colors[0]})` }}
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-lg font-bold text-white">{u.places[id].title}</h2>
              <p className={cn("text-[10px] text-cyan-200", caps)}>{u.places[id].sub}</p>
            </div>
            <button
              type="button"
              onClick={() => universeStore.closePanel()}
              aria-label={u.close}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-paper-100 transition hover:border-cyan-300/60"
            >
              <X size={16} aria-hidden />
            </button>
          </header>
          <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {body}
          </div>
          {id !== "lab" && (
            <footer className="border-t border-white/10 px-5 py-3">
              <button
                type="button"
                onClick={() => universeStore.openClassic(id)}
                className="inline-flex items-center gap-1.5 text-xs text-paper-300 transition hover:text-cyan-200"
              >
                {u.openClassic} <ArrowUpRight size={13} aria-hidden className="rtl:-scale-x-100" />
              </button>
            </footer>
          )}
        </>
      )}
    </aside>
  );
}
