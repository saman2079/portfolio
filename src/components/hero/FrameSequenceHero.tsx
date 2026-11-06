"use client";

import { ArrowDown, Github, Linkedin } from "lucide-react";
import { ResumeButton } from "@/components/ui/ResumeButton";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";

/**
 * Cinematic SAMAN.OS hero.
 * The old scroll-scrubbed laptop sequence is intentionally removed; the
 * persistent Three.js world now supplies the living visual behind the page.
 */
export function FrameSequenceHero({ t, lang }: { t: Dictionary; lang: Locale }) {
  return (
    <div className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden px-6 pb-28 pt-28 text-center">
      <div aria-hidden className="hero-nebula pointer-events-none absolute inset-0" />
      <div aria-hidden className="hero-orbit hero-orbit--one pointer-events-none absolute left-1/2 top-1/2" />
      <div aria-hidden className="hero-orbit hero-orbit--two pointer-events-none absolute left-1/2 top-1/2" />
      <div aria-hidden className="hero-crosshair pointer-events-none absolute left-1/2 top-1/2" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-[#0B1022]/70 px-4 py-2 font-mono text-[11px] tracking-[0.22em] text-cyan-200 shadow-[0_0_30px_rgba(139,92,246,0.12)] backdrop-blur-xl" dir="ltr">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" />
          SAMAN.OS <span className="text-violet-300">/</span> PORTFOLIO INTERFACE
        </p>
        <p className="font-mono text-xs text-cyan-200 sm:text-sm" dir="ltr">
          <span className="text-paper-500">$</span> {t.hero.whoami}
        </p>
        <h1 className="mt-4 text-balance font-display text-display-lg font-bold text-white drop-shadow-[0_0_32px_rgba(139,92,246,0.32)]">
          {t.name}
        </h1>
        <p className="mt-3 bg-gradient-to-r from-cyan-200 via-violet-300 to-fuchsia-300 bg-clip-text font-display text-lg font-bold text-transparent sm:text-2xl">
          {t.role}
        </p>
        <p className="mt-6 max-w-2xl text-balance text-sm leading-8 text-slate-300 sm:text-base">
          {t.tagline}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ResumeButton lang={lang} label={t.ui.downloadResume} />
          <a
            href="#contact"
            className="rounded-xl border border-violet-300/25 bg-violet-400/10 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(139,92,246,0.14)] backdrop-blur-xl transition hover:border-cyan-200/50 hover:bg-violet-400/15"
          >
            {t.ui.contactMe}
          </a>
        </div>
        <div className="mt-7 flex items-center gap-4 text-slate-400">
          <a href="https://github.com/saman2079" target="_blank" rel="noreferrer" aria-label="GitHub" className="transition hover:text-cyan-200"><Github size={18} /></a>
          <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="transition hover:text-violet-200"><Linkedin size={18} /></a>
        </div>
      </div>

      <a href="#about" className="absolute bottom-28 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] tracking-[0.2em] text-slate-400 transition hover:text-cyan-200" dir="ltr">
        <span>EXPLORE SYSTEM</span>
        <ArrowDown size={16} className="animate-bounce" />
      </a>
    </div>
  );
}
