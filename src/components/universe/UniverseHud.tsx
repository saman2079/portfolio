"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Eye, Languages, Maximize2, Minimize2, Mouse, Rocket } from "lucide-react";
import { pathFor, resumeFor, type Locale } from "@/i18n/config";
import { universeText } from "@/i18n/universe";
import { DESTINATIONS } from "@/lib/universe/destinations";
import { setLitePreference } from "@/lib/three/preference";
import { worldStore } from "@/lib/store/worldStore";
import { useBase } from "@/lib/lab/baseStore";
import { universeStore, useUniverse } from "@/lib/store/universeStore";
import { setOutside, stationU, useFlight } from "@/lib/store/flightStore";
import { cn } from "@/lib/utils";
import { MusicPlayer } from "./MusicPlayer";

interface Props {
  lang: Locale;
  name: string;
  role: string;
  tagline: string;
}

/** DOM overlay on top of the canvas: brand, hero text, destinations and cockpit read-outs. */
export function UniverseHud({ lang, name, role, tagline }: Props) {
  const u = universeText[lang];
  const other: Locale = lang === "fa" ? "en" : "fa";
  const { panel } = useUniverse();
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

      {/* the name and role live on the cockpit screens; this keeps them for screen readers */}
      <h1 className="sr-only">
        {name} — {role}. {tagline}
      </h1>

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
          "pointer-events-auto absolute bottom-3 right-16 grid h-10 w-10 place-items-center rounded-full border bg-black/30 text-paper-100 backdrop-blur transition hover:border-cyan-300/60",
          flight.outside ? "border-cyan-300/70 text-cyan-200" : "border-white/20"
        )}
      >
        {flight.outside ? <Eye size={16} aria-hidden /> : <Rocket size={16} aria-hidden />}
      </button>

      {/* model credit (CC BY 4.0 requires attribution) */}
      <p
        dir="ltr"
        className="pointer-events-auto absolute bottom-1 left-3 block max-w-[60%] text-[8px] leading-tight text-paper-500 sm:max-w-[calc(100%-9rem)] sm:text-[9px]"
      >
        <a
          href="https://sketchfab.com/3d-models/sci-fi-spaceship-cockpit-02-c6825892999242319c1a29326c4e7713"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-paper-300"
        >
          3D model "Sci-fi Spaceship Cockpit 02" by NotARealStudio
        </a>
        {" · "}
        <a
          href="https://sketchfab.com/3d-models/space-vector-exploration-interior-redesign-0630b4fcda0845679432568b449a0490"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-paper-300"
        >
          "Space Vector Exploration, Interior Redesign" by ReiSakisaka
        </a>
        {" · "}
        <a
          href="https://sketchfab.com/3d-models/various-planets-73c6c24e7c40409cafc6adacd5d71ff5"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-paper-300"
        >
          "Various Planets" by feivelyn
        </a>
        {" · "}
        <a
          href="https://sketchfab.com/3d-models/landscape-of-an-alien-planet-skybox-676c023d919344efbfa9876c85db7d11"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-paper-300"
        >
          "Landscape of an alien planet (Skybox)" by Jungle Jim
        </a>
        {" · "}
        <a
          href="https://sketchfab.com/3d-models/alien-terrain-05-hdri-7ba0da88576d4f4592beaaa0e9e3ff2d"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-paper-300"
        >
          "Alien Terrain 05 HDRI" by Giimann
        </a>
        {" · "}
        <a
          href="https://sketchfab.com/3d-models/landscape-forest-mountains-94809d21d7aa4cfe9b658a111b35a42c"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-paper-300"
        >
          "landscape forest &amp; mountains" by dasy444
        </a>
        {" — CC BY 4.0"}
      </p>

      <MusicPlayer lang={typeof document !== "undefined" && document.documentElement.lang.startsWith("fa") ? "fa" : "en"} />

      {/* fullscreen */}
      {canFull && <button
        type="button"
        onClick={toggleFull}
        aria-label={full ? u.exitFullscreen : u.fullscreen}
        title={full ? u.exitFullscreen : u.fullscreen}
        className="pointer-events-auto absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/30 text-paper-100 backdrop-blur transition hover:border-cyan-300/60"
      >
        {full ? <Minimize2 size={16} aria-hidden /> : <Maximize2 size={16} aria-hidden />}
      </button>}
    </div>
  );
}
