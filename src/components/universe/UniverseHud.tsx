"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Download, Eye, Languages, Maximize2, Minimize2, Mouse, Rocket } from "lucide-react";
import { pathFor, resumeFor, type Locale } from "@/i18n/config";
import { universeText } from "@/i18n/universe";
import { DESTINATIONS } from "@/lib/universe/destinations";
import { setLitePreference } from "@/lib/three/preference";
import { worldStore } from "@/lib/store/worldStore";
import { useBase } from "@/lib/lab/baseStore";
import { universeStore, useUniverse } from "@/lib/store/universeStore";
import { setOutside, setSpeedMul, speedToT, stationU, tToSpeed, useFlight } from "@/lib/store/flightStore";
import { cn } from "@/lib/utils";

interface Props {
  lang: Locale;
  name: string;
  role: string;
  tagline: string;
}

function SpeedSlider({ label, value }: { label: string; value: number }) {
  return (
    <label className="flex items-center gap-3 text-[11px] text-paper-300">
      <span className="shrink-0">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        dir="ltr"
        value={Math.round(speedToT(value) * 100)}
        onChange={(e) => setSpeedMul(tToSpeed(Number(e.target.value) / 100))}
        aria-valuetext={`${value.toFixed(1)}x`}
        className="h-1 w-full min-w-24 cursor-pointer accent-cyan-300"
      />
      <span dir="ltr" className="w-9 shrink-0 text-end font-mono text-cyan-200">
        {value.toFixed(1)}x
      </span>
    </label>
  );
}


/** DOM overlay on top of the canvas: brand, hero text, destinations and cockpit read-outs. */
export function UniverseHud({ lang, name, role, tagline }: Props) {
  const u = universeText[lang];
  const other: Locale = lang === "fa" ? "en" : "fa";
  const { hovered, panel } = useUniverse();
  const flight = useFlight();
  const [full, setFull] = useState(false);
  const [canFull, setCanFull] = useState(false);

  useEffect(() => {
    setCanFull(typeof document.documentElement.requestFullscreen === "function");
  }, []);

  useEffect(() => {
    const sync = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  // letter-spacing and upper-casing only suit Latin text; they would break Persian joins
  const caps = lang === "en" ? "uppercase tracking-[0.16em]" : "";
  const away = flight.land !== "idle";
  const landed = flight.land === "landed";
  const building = useBase((b) => b.mode);
  const started = flight.shipU > 0.035;
  const nearPlace = landed && flight.landId ? u.places[flight.landId].title : flight.nearId ? u.places[flight.nearId].title : null;
  const arrived = flight.arrivedId;
  const focus = DESTINATIONS.find((d) => d.id === (hovered ?? "projects")) ?? DESTINATIONS[0];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-paper-100">
      {/* top bar */}
      <header className="pointer-events-auto absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-6">
        <a href="#top" dir="ltr" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-400/10 font-mono text-lg font-bold text-cyan-200 shadow-[0_0_24px_rgba(56,189,248,0.3)]">
            S
          </span>
          <span className="leading-tight">
            <span className="block font-mono text-base font-semibold tracking-wider text-white sm:text-lg">SAMAN.OS</span>
            <span className={cn("block text-[10px] text-paper-300", lang === "en" && "uppercase tracking-[0.2em]")}>
              {u.logoSub}
            </span>
          </span>
        </a>

        <nav className={cn("flex items-center gap-3 text-xs sm:gap-6 sm:text-sm", caps)}>
          <span aria-current="page" className="border-b border-cyan-300 pb-1 text-cyan-300">
            {u.navExplore}
          </span>
          <a href={resumeFor(lang)} download className="pb-1 text-paper-100 transition hover:text-cyan-200">
            {u.navResume}
          </a>
          <button
            type="button"
            onClick={() => {
              setLitePreference(true);
              worldStore.fail("forced-off");
            }}
            className="hidden pb-1 text-paper-300 transition hover:text-cyan-200 sm:inline"
          >
            {u.lite}
          </button>
          <a
            href={pathFor(other)}
            hrefLang={other}
            lang={other}
            aria-label="Switch language"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-paper-100 transition hover:border-cyan-300/60"
          >
            <Languages size={14} aria-hidden />
            {other === "fa" ? "فا" : "EN"}
          </a>
        </nav>
      </header>

      {/* hero text */}
      <div
        className={cn(
          "absolute inset-x-0 top-24 px-5 transition-opacity duration-500 sm:top-auto sm:bottom-[31%] sm:inset-x-auto sm:start-[7%] sm:max-w-[30rem] sm:px-0",
          started && "opacity-0 [&_*]:!pointer-events-none"
        )}
      >
        <h1 className="text-balance font-display text-3xl font-bold leading-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.8)] sm:text-5xl">
          {name}
        </h1>
        <p className="mt-2 text-lg text-paper-100 sm:text-2xl">{role}</p>
        <p className="mt-3 max-w-md text-sm leading-7 text-paper-300">{tagline}</p>
        <div className="pointer-events-auto mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => universeStore.goTo("about")}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-lg border border-orange-400/80 bg-orange-500/10 px-5 text-sm font-semibold text-orange-300 shadow-[0_0_26px_rgba(251,146,60,0.35)] transition hover:bg-orange-500/20",
              caps
            )}
          >
            {u.explore}
            <ArrowUpRight size={16} aria-hidden className="rtl:-scale-x-100" />
          </button>
          <button
            type="button"
            onClick={() => setOutside(!flight.outside)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/50 bg-cyan-400/10 px-5 text-sm font-semibold text-cyan-200 backdrop-blur transition hover:bg-cyan-400/20",
              caps
            )}
          >
            {flight.outside ? u.cockpitView : u.outsideView}
            {flight.outside ? <Eye size={16} aria-hidden /> : <Rocket size={16} aria-hidden />}
          </button>
          <a
            href={resumeFor(lang)}
            download
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-5 text-sm font-semibold text-paper-100 backdrop-blur transition hover:border-cyan-300/60",
              caps
            )}
          >
            {u.viewResume}
            <Download size={16} aria-hidden />
          </a>
        </div>
      </div>

      {/* destinations (desktop) */}
      <div
        className={cn(
          "absolute bottom-[15%] end-[3%] hidden items-end gap-3 transition-opacity duration-300 md:flex",
          (panel || away) && "pointer-events-none opacity-0"
        )}
      >
        <div className="pointer-events-auto universe-glass w-52 p-3">
          <p className={cn("mb-2 px-1 text-[11px] text-cyan-200", caps)}>{u.destinations}</p>
          <ul>
            {DESTINATIONS.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => universeStore.goTo(d.id)}
                  onMouseEnter={() => universeStore.hover(d.id)}
                  onMouseLeave={() => universeStore.hover(null)}
                  onFocus={() => universeStore.hover(d.id)}
                  onBlur={() => universeStore.hover(null)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-start text-sm transition",
                    hovered === d.id ? "bg-orange-400/10 text-white" : "text-paper-300 hover:text-white"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 rounded-full border",
                      hovered === d.id
                        ? "border-orange-400 bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.9)]"
                        : "border-paper-500"
                    )}
                  />
                  {u.places[d.id].title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="universe-glass hidden w-48 overflow-hidden lg:block">
          <div
            aria-hidden
            className="h-28 transition-all duration-500"
            style={{
              background: focus
                ? `radial-gradient(circle at 34% 30%, ${focus.colors[2]} 0%, ${focus.colors[1]} 38%, ${focus.colors[0]} 72%, #02040a 100%)`
                : undefined,
            }}
          />
          <div className="p-3">
            <p className="text-sm font-bold text-white">{focus ? u.places[focus.id].title : ""}</p>
            <p className="mt-0.5 text-xs text-paper-300">{focus ? u.places[focus.id].sub : ""}</p>
          </div>
        </div>
      </div>

      {/* destinations (mobile) */}
      <div className={cn("pointer-events-auto absolute inset-x-0 bottom-[17%] flex gap-2 overflow-x-auto px-4 pb-1 md:hidden", (panel || away) && "hidden")}>
        {DESTINATIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => universeStore.goTo(d.id)}
            className="universe-glass shrink-0 px-3.5 py-2 text-xs text-paper-100"
          >
            {u.places[d.id].title}
          </button>
        ))}
      </div>

      {/* cockpit read-outs */}
      <div className="absolute bottom-[4%] start-[3%] hidden gap-6 md:flex">
        <div className="universe-glass px-4 py-2">
          <p className={cn("text-[10px] text-cyan-200", caps)}>{u.location}</p>
          <p className="text-sm font-semibold text-white">{nearPlace ?? u.deepSpace}</p>
        </div>
        <div className="universe-glass px-4 py-2">
          <p className={cn("text-[10px] text-cyan-200", caps)}>{u.distance}</p>
          <p className="text-sm font-semibold text-white" dir="ltr">
            {flight.nextDist === null ? "∞" : `${flight.nextDist} AU`}
          </p>
        </div>
        <div className="universe-glass min-w-44 px-4 py-2">
          <p className={cn("text-[10px] text-cyan-200", caps)}>{u.speed}</p>
          <p className="text-sm font-semibold text-white" dir="ltr">
            {Math.round(flight.speedNorm * 100)}%
          </p>
          <div aria-hidden className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)] transition-[width] duration-150"
              style={{ width: `${Math.round(flight.speedNorm * 100)}%` }}
            />
          </div>
          <div className="pointer-events-auto mt-2 w-44">
            <SpeedSlider label={u.flightSpeed} value={flight.speedMul} />
          </div>
        </div>
      </div>

      {/* throttle (mobile; on desktop it sits in the read-out and on the console lever) */}
      <div className={cn("universe-glass pointer-events-auto absolute inset-x-4 bottom-[9%] px-4 py-2 md:hidden", (panel || away) && "hidden")}>
        <SpeedSlider label={u.flightSpeed} value={flight.speedMul} />
      </div>

      {/* on the surface: take off / reopen the info card */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-16 flex justify-center gap-3 px-4 transition-all duration-500 sm:bottom-8",
          landed && !building ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        )}
      >
        {landed && flight.landId && !panel && (
          <button
            type="button"
            onClick={() => flight.landId && universeStore.openPanel(flight.landId)}
            className={cn(
              "pointer-events-auto universe-glass inline-flex min-h-11 items-center gap-2 px-5 text-sm font-semibold text-cyan-100",
              caps
            )}
          >
            {u.info}
          </button>
        )}
        <button
          type="button"
          onClick={() => universeStore.takeOff()}
          className={cn(
            "pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-lg border border-orange-400/80 bg-orange-500/10 px-5 text-sm font-semibold text-orange-300 shadow-[0_0_26px_rgba(251,146,60,0.35)] transition hover:bg-orange-500/20",
            caps
          )}
        >
          <Rocket size={16} aria-hidden />
          {u.takeOff}
        </button>
      </div>

      {/* arrival card */}
      <div
        className={cn(
          "absolute inset-x-0 top-20 flex justify-center px-4 transition-all duration-300 sm:top-24",
          arrived && !panel && !away ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        )}
        aria-live="polite"
      >
        {arrived && !panel && !away && (
          <div className="universe-glass pointer-events-auto flex items-center gap-4 px-5 py-3">
            <div>
              <p className={cn("text-[10px] text-cyan-200", caps)}>{u.arrived}</p>
              <p className="text-base font-bold text-white">{u.places[arrived].title}</p>
            </div>
            <button
              type="button"
              onClick={() => universeStore.land(arrived)}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-lg border border-orange-400/80 bg-orange-500/10 px-4 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20",
                caps
              )}
            >
              {u.enter}
              <ArrowUpRight size={15} aria-hidden className="rtl:-scale-x-100" />
            </button>
          </div>
        )}
      </div>

      {/* progress rail */}
      <ol className={cn("pointer-events-auto absolute start-3 top-1/2 hidden -translate-y-1/2 flex-col gap-3 sm:flex", away && "sm:hidden")}>
        {[null, ...DESTINATIONS].map((d, i) => {
          const at = d ? stationU(d.id) : 0;
          const here = Math.abs(flight.shipU - at) < 0.05;
          return (
            <li key={d ? d.id : "start"}>
              <button
                type="button"
                aria-label={d ? u.places[d.id].title : u.explore}
                title={d ? u.places[d.id].title : ""}
                onClick={() => (d ? universeStore.goTo(d.id) : window.scrollTo({ top: 0, behavior: "smooth" }))}
                className={cn(
                  "universe-rail-dot block h-2.5 w-2.5 rounded-full border",
                  here
                    ? "scale-150 border-orange-400 bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.9)]"
                    : flight.shipU > at
                      ? "border-cyan-300 bg-cyan-300/60"
                      : "border-paper-500 bg-transparent"
                )}
                data-i={i}
              />
            </li>
          );
        })}
      </ol>

      {/* scroll hint */}
      <div className={cn("absolute inset-x-0 bottom-3 hidden flex-col items-center gap-1 text-paper-300 transition-opacity duration-500 sm:flex", started && "opacity-0")}>
        <Mouse size={22} aria-hidden className="text-cyan-200" />
        <span className={cn("text-[10px]", caps)}>{u.scroll}</span>
        <span className={cn("hidden text-[10px] text-paper-500 sm:block", caps)}>{u.lookHint}</span>
      </div>

      {/* view toggle (stays available after the hero text has faded) */}
      <button
        type="button"
        onClick={() => setOutside(!flight.outside)}
        aria-pressed={flight.outside}
        aria-label={flight.outside ? u.cockpitView : u.outsideView}
        title={flight.outside ? u.cockpitView : u.outsideView}
        className={cn(
          "pointer-events-auto absolute bottom-3 end-16 grid h-10 w-10 place-items-center rounded-full border bg-black/30 text-paper-100 backdrop-blur transition hover:border-cyan-300/60",
          flight.outside ? "border-cyan-300/70 text-cyan-200" : "border-white/20"
        )}
      >
        {flight.outside ? <Eye size={16} aria-hidden /> : <Rocket size={16} aria-hidden />}
      </button>

      {/* model credit (CC BY 4.0 requires attribution) */}
      <a
        href="https://sketchfab.com/3d-models/warp-wagon-interior-35c5123c1adc4cac83712c6d0cc22540"
        target="_blank"
        rel="noreferrer noopener"
        dir="ltr"
        className="pointer-events-auto absolute bottom-1 start-3 hidden text-[9px] text-paper-500 hover:text-paper-300 sm:block"
      >
        3D models "Warp Wagon Interior" by Mattdude, "Large Wall-Mounted Computer Console" by Inditrion Dradnon — CC BY 4.0
      </a>

      {/* fullscreen */}
      {canFull && <button
        type="button"
        onClick={toggleFull}
        aria-label={full ? u.exitFullscreen : u.fullscreen}
        title={full ? u.exitFullscreen : u.fullscreen}
        className="pointer-events-auto absolute bottom-3 end-3 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/30 text-paper-100 backdrop-blur transition hover:border-cyan-300/60"
      >
        {full ? <Minimize2 size={16} aria-hidden /> : <Maximize2 size={16} aria-hidden />}
      </button>}
    </div>
  );
}
