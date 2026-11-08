"use client";

import { useEffect, useRef } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { universeText } from "@/i18n/universe";
import { baseLive, baseStore, links, power, useBase } from "@/lib/lab/baseStore";
import { cn } from "@/lib/utils";
import { HUES } from "./Buildings";

/** DOM side of the base builder: the bar of buildings, drag handling, score and info card. */
export function BuilderUi({ lang }: { lang: Locale }) {
  const u = universeText[lang].builder;
  const mode = useBase((s) => s.mode);
  const skills = useBase((s) => s.skills);
  const placed = useBase((s) => s.placed);
  const dragging = useBase((s) => s.dragging);
  const selected = useBase((s) => s.selected);
  const chip = useRef<HTMLDivElement>(null);

  // pointer handling for every kind of drag (bar → grid, grid → grid, grid → bar)
  useEffect(() => {
    if (!mode) return;
    const place = (x: number, y: number) => {
      if (chip.current) chip.current.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
    };
    const move = (e: PointerEvent) => {
      baseLive.px = e.clientX;
      baseLive.py = e.clientY;
      place(e.clientX, e.clientY);
      const c = baseLive.candidate;
      if (c && baseStore.get().dragging === null && Math.hypot(e.clientX - c.x, e.clientY - c.y) > 6) {
        baseStore.startDrag(c.index);
      }
    };
    const up = (e: PointerEvent) => {
      const st = baseStore.get();
      const c = baseLive.candidate;
      baseLive.candidate = null;
      if (st.dragging !== null) {
        const over = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-base-palette]");
        if (over) {
          if (st.placed[st.dragging]) baseStore.remove(st.dragging);
        } else if (st.hover && st.hover.ok) {
          baseStore.place(st.dragging, st.hover.gx, st.hover.gz);
        }
        baseStore.endDrag();
      } else if (c) {
        baseStore.select(st.selected === c.index ? null : c.index);
      }
    };
    const cancel = () => {
      baseLive.candidate = null;
      baseStore.endDrag();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [mode]);

  if (!mode) return null;

  const total = skills.length;
  const count = Object.keys(placed).filter((k) => Number(k) < total).length;
  const done = total > 0 && count === total;
  const caps = lang === "en" ? "uppercase tracking-[0.14em]" : "";
  const sel = selected !== null ? skills[selected] : undefined;
  const nameOf = (i: number) => u.names[i % 9] ?? skills[i]?.name ?? "";

  return (
    <div className="pointer-events-none absolute inset-0 z-20 text-paper-100">
      {/* score */}
      <div className="absolute inset-x-0 top-20 flex justify-center px-4 sm:top-24">
        <div className="universe-glass pointer-events-auto flex items-center gap-5 px-5 py-2.5">
          <div>
            <p className={cn("text-[10px] text-cyan-200", caps)}>{u.power}</p>
            <p dir="ltr" className="font-mono text-lg font-bold text-orange-300">
              {power(skills, placed)}
            </p>
          </div>
          <div className="min-w-28">
            <p className={cn("text-[10px] text-cyan-200", caps)}>
              {u.online} <span dir="ltr">{count}/{total}</span>
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-orange-300 transition-[width] duration-300 rtl:bg-gradient-to-l"
                style={{ width: `${total ? (count / total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div dir="ltr" className="hidden font-mono text-[11px] text-paper-300 sm:block">
            {links(placed).length} links
          </div>
        </div>
      </div>

      {/* success banner */}
      {done && (
        <div className="absolute inset-x-0 top-40 flex justify-center px-4 sm:top-44">
          <div className="universe-glass flex items-center gap-3 border-emerald-300/40 px-5 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-400/20 text-emerald-300">
              <Check size={18} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-white">{u.complete}</p>
              <p className="text-xs text-paper-300">{u.completeSub.replace("{n}", String(total))}</p>
            </div>
          </div>
        </div>
      )}

      {/* info card */}
      {sel && selected !== null && (
        <div className="universe-glass pointer-events-auto absolute start-3 top-44 hidden w-60 p-4 sm:block">
          <p className="text-sm font-bold text-white">{nameOf(selected)}</p>
          <p className="mt-0.5 text-xs text-cyan-200" dir="ltr">
            {sel.name}
          </p>
          <div className="mt-3 flex items-center gap-1.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={cn("h-1.5 flex-1 rounded-full", n <= sel.level ? "bg-orange-300 shadow-[0_0_8px_rgba(251,146,60,0.8)]" : "bg-white/10")}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-paper-300">
            {u.level} <span dir="ltr">{sel.level}/5</span>
          </p>
        </div>
      )}

      {/* top-corner buttons */}
      <div className="pointer-events-auto absolute bottom-[8.5rem] end-3 flex gap-2 sm:bottom-40 sm:end-5">
        <button
          type="button"
          onClick={() => baseStore.reset()}
          className="universe-glass inline-flex min-h-10 items-center gap-1.5 px-3 text-xs text-paper-100 transition hover:border-cyan-300/60"
        >
          <RotateCcw size={14} aria-hidden /> {u.reset}
        </button>
        <button
          type="button"
          onClick={() => baseStore.setMode(false)}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-orange-400/80 bg-orange-500/10 px-3 text-xs font-semibold text-orange-300 transition hover:bg-orange-500/20"
        >
          <X size={14} aria-hidden /> {u.exit}
        </button>
      </div>

      {/* the bar of buildings = the skills */}
      <div
        data-base-palette
        className="universe-glass pointer-events-auto absolute inset-x-3 bottom-3 sm:inset-x-auto sm:start-1/2 sm:w-[min(52rem,92vw)] sm:-translate-x-1/2 rtl:sm:translate-x-1/2"
      >
        <p className="px-4 pt-2 text-[11px] text-paper-300">{u.hint}</p>
        <ul className="flex gap-2 overflow-x-auto px-3 pb-3 pt-2">
          {skills.map((s, i) => {
            const isPlaced = Boolean(placed[i]);
            const hue = HUES[i % 9] ?? "#22d3ee";
            return (
              <li key={s.name} className="shrink-0">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    if (e.button > 0) return;
                    baseLive.px = e.clientX;
                    baseLive.py = e.clientY;
                    baseStore.startDrag(i);
                    if (chip.current) chip.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
                  }}
                  style={{ touchAction: "pan-x" }}
                  className={cn(
                    "flex w-28 cursor-grab select-none flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-start transition active:cursor-grabbing",
                    isPlaced ? "border-white/10 bg-white/[0.03] opacity-60" : "border-white/20 bg-white/5 hover:border-cyan-300/60",
                    dragging === i && "border-orange-400"
                  )}
                >
                  <span className="flex w-full items-center gap-2">
                    <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: hue, boxShadow: `0 0 10px ${hue}` }} />
                    <span className="truncate text-xs font-semibold text-white">{nameOf(i)}</span>
                  </span>
                  <span dir="ltr" className="w-full truncate text-[10px] text-paper-300">
                    {s.name}
                  </span>
                  <span className="flex gap-0.5" dir="ltr">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={cn("h-1 w-3 rounded-full", n <= s.level ? "bg-cyan-300" : "bg-white/10")} />
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* chip that follows the pointer while dragging */}
      <div
        ref={chip}
        className={cn(
          "fixed start-0 top-0 z-40 rounded-md border border-orange-400/70 bg-black/70 px-2.5 py-1 text-xs font-semibold text-orange-200 backdrop-blur",
          dragging === null && "hidden"
        )}
      >
        {dragging !== null ? nameOf(dragging) : ""}
      </div>
    </div>
  );
}
