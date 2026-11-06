"use client";

import { ArrowDown, Github, Linkedin, RotateCcw } from "lucide-react";
import { ResumeButton } from "@/components/ui/ResumeButton";
import { Swatches } from "@/components/lab/controls/Swatches";
import { Slider } from "@/components/lab/controls/Slider";
import { Segmented } from "@/components/lab/controls/Segmented";
import { SHAPES } from "@/lib/lab/palette";
import { labStore, useLabState } from "@/lib/store/labStore";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";

function HeroLabs({ t }: { t: Dictionary["lab"] }) {
  const state = useLabState();
  return (
    <aside aria-label={t.eyebrow} className="hero-labs glass-panel relative z-20 w-full max-w-sm p-4 text-start sm:p-5">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <div><p className="font-mono text-[10px] tracking-[0.22em] text-cyan-200" dir="ltr">CORE / LABS</p><h2 className="mt-1 text-sm font-bold text-white">{t.title}</h2></div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 font-mono text-[9px] text-emerald-200">LIVE</span>
      </div>
      <div className="space-y-3">
        <Swatches legend={t.controls.color} names={t.hues} value={state.hue} onChange={(hue) => labStore.set({ hue })} />
        <Slider id="hero-lab-light" label={t.controls.light} min={0} max={100} value={state.light} onChange={(light) => labStore.set({ light })} />
        <Slider id="hero-lab-speed" label={t.controls.speed} min={0} max={100} value={state.speed} onChange={(speed) => labStore.set({ speed })} />
        <Slider id="hero-lab-particles" label={t.controls.particleSize} min={1} max={10} value={state.particleSize} onChange={(particleSize) => labStore.set({ particleSize })} />
        <Segmented legend={t.controls.shape} name="hero-lab-shape" options={SHAPES} labels={t.shapes} value={state.shape} onChange={(shape) => labStore.set({ shape })} />
        <button type="button" onClick={() => labStore.reset()} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-xs text-paper-300 transition hover:border-cyan-200/40 hover:text-white"><RotateCcw size={13} aria-hidden /> {t.controls.reset}</button>
      </div>
    </aside>
  );
}

export function FrameSequenceHero({ t, lang }: { t: Dictionary; lang: Locale }) {
  return (
    <div className="relative isolate mx-auto grid min-h-[100svh] w-full max-w-[90rem] grid-cols-1 items-center gap-8 overflow-hidden px-5 pb-28 pt-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,21rem)] lg:gap-12 lg:px-12">
      <div aria-hidden className="hero-nebula pointer-events-none absolute inset-0" />
      <div aria-hidden className="hero-orbit hero-orbit--one pointer-events-none absolute left-1/2 top-1/2" />
      <div aria-hidden className="hero-orbit hero-orbit--two pointer-events-none absolute left-1/2 top-1/2" />
      <div aria-hidden className="hero-crosshair pointer-events-none absolute left-1/2 top-1/2" />
      <div className="relative z-20 max-w-xl text-start">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-[#0B1022]/70 px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-cyan-200 shadow-[0_0_30px_rgba(139,92,246,0.12)] backdrop-blur-xl sm:text-[11px]" dir="ltr"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" /> SAMAN.OS <span className="text-violet-300">/</span> PORTFOLIO INTERFACE</p>
        <p className="font-mono text-xs text-cyan-200 sm:text-sm" dir="ltr"><span className="text-paper-500">$</span> {t.hero.whoami}</p>
        <h1 className="mt-4 text-balance font-display text-display-lg font-bold text-white drop-shadow-[0_0_32px_rgba(139,92,246,0.32)]">{t.name}</h1>
        <p className="mt-3 bg-gradient-to-r from-cyan-200 via-violet-300 to-fuchsia-300 bg-clip-text font-display text-lg font-bold text-transparent sm:text-2xl">{t.role}</p>
        <p className="mt-6 max-w-lg text-balance text-sm leading-8 text-slate-300 sm:text-base">{t.tagline}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3"><ResumeButton lang={lang} label={t.ui.downloadResume} /><a href="#contact" className="rounded-xl border border-violet-300/25 bg-violet-400/10 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(139,92,246,0.14)] backdrop-blur-xl transition hover:border-cyan-200/50 hover:bg-violet-400/15">{t.ui.contactMe}</a></div>
        <div className="mt-6 flex items-center gap-4 text-slate-400"><a href="https://github.com/saman2079" target="_blank" rel="noreferrer" aria-label="GitHub" className="transition hover:text-cyan-200"><Github size={18} /></a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="transition hover:text-violet-200"><Linkedin size={18} /></a><span className="font-mono text-[10px] tracking-widest text-slate-500" dir="ltr">DRAG THE CORE TO EXPLORE</span></div>
      </div>
      <div className="relative z-20 lg:justify-self-end"><HeroLabs t={t.lab} /></div>
      <a href="#about" className="absolute bottom-28 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] tracking-[0.2em] text-slate-400 transition hover:text-cyan-200" dir="ltr"><span>SCROLL TO EXPLORE</span><ArrowDown size={16} className="animate-bounce" /></a>
    </div>
  );
}
