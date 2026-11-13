"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Crosshair, MapPin, Move, Radar, RotateCcw, Swords, X, Zap } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { universeText } from "@/i18n/universe";
import { baseLive, baseStore, links, power, useBase } from "@/lib/lab/baseStore";
import { cn } from "@/lib/utils";
import {
  MAX_LEVEL,
  SHOP,
  TYPES,
  bufferSize,
  caps as resourceCaps,
  gameStore,
  perMinute,
  stored,
  upgradeCost,
  useGame,
  type BuildingType,
  type Res,
} from "@/lib/lab/gameStore";
import { atk, enterAttack, useAttackOn } from "@/lib/lab/attackSim";
import { callWave, sim } from "@/lib/lab/waveSim";
import { AttackUi } from "./AttackUi";
import { ScoutUi } from "./ScoutUi";
import { BASES, SCOUT_COST, cooldownLeft, enterScout, scout, useScoutFound, useScoutOn } from "@/lib/lab/scoutSim";
import { travelTo } from "@/lib/lab/raidSim";
import { MAX_LEVEL, WEAPONS, WEAPON_IDS, buy, current, dmgMul, gapMul, levelOf, owned, select, upgrade, upgradeCost as weaponUpgradeCost, useArmoury } from "@/lib/lab/weapons";
import { HUES } from "./Buildings";
import { TYPE_HUE } from "./GameBuildings";

/** crystal ◆ and energy ⚡ amounts, in their colours (zero amounts are left out) */
function Cost({ cost }: { cost: Res }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px]" dir="ltr">
      {cost.c > 0 && <span className="text-cyan-300">◆{cost.c}</span>}
      {cost.e > 0 && <span className="text-orange-300">⚡{cost.e}</span>}
      {cost.c <= 0 && cost.e <= 0 && <span className="text-emerald-300">0</span>}
    </span>
  );
}

/** DOM side of the base builder: the bar of buildings, drag handling, score and info card. */
export function BuilderUi({ lang }: { lang: Locale }) {
  const u = universeText[lang].builder;
  const mode = useBase((s) => s.mode);
  const skills = useBase((s) => s.skills);
  const placed = useBase((s) => s.placed);
  const dragging = useBase((s) => s.dragging);
  const selected = useBase((s) => s.selected);
  const chip = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"skills" | "game">("game");
  const [, tick] = useState(0);
  const [panel, setPanel] = useState<null | "armory" | "bases">(null);
  useArmoury();
  const g = useGame((s) => s);
  const gt = u.game;
  const attackOn = useAttackOn();
  const scoutOn = useScoutOn();
  const foundCount = useScoutFound();

  // open the colony (save, command centre), tick once a second so stored amounts count up
  useEffect(() => {
    if (!mode) return;
    gameStore.init();
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        gameStore.cancel();
        if (baseLive.armedTap) {
          baseLive.armedTap = false;
          baseStore.endDrag();
        }
        setPanel(null);
        gameStore.select(null);
        baseStore.select(null);
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("keydown", key);
      gameStore.cancel();
    };
  }, [mode]);

  // pointer handling for every kind of drag (bar → grid, grid → grid, grid → bar)
  useEffect(() => {
    if (!mode) return;
    const place = (x: number, y: number) => {
      if (chip.current) chip.current.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
    };
    // what was selected just before a press, so a press that selected something is not mistaken for an empty-ground tap
    const snap = { g: null as string | null, b: null as number | null };
    const before = () => {
      snap.g = gameStore.get().selected;
      snap.b = baseStore.get().selected;
    };
    window.addEventListener("pointerdown", before, true);
    const down = (e: PointerEvent) => {
      if (atk.on || scout.on) return;
      baseLive.px = e.clientX;
      baseLive.py = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (atk.on || scout.on) return;
      baseLive.px = e.clientX;
      baseLive.py = e.clientY;
      place(e.clientX, e.clientY);
      const c = baseLive.candidate;
      if (c && baseStore.get().dragging === null && Math.hypot(e.clientX - c.x, e.clientY - c.y) > 6) {
        baseStore.startDrag(c.index);
      }
    };
    const up = (e: PointerEvent) => {
      if (atk.on || scout.on) return;
      const st = baseStore.get();
      const c = baseLive.candidate;
      baseLive.candidate = null;
      if (gameStore.get().armed) {
        // a colony building is waiting: a tap on the map drops it on the cell under the pointer
        if ((e.target as HTMLElement | null)?.tagName === "CANVAS" && st.hover) gameStore.placeAt(st.hover.gx, st.hover.gz);
        return;
      }
      if (st.dragging !== null) {
        const over = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-base-palette]");
        if (baseLive.armedTap) {
          // a skill is in hand (picked with a tap): a tap on the map builds it there
          if (!over && (e.target as HTMLElement | null)?.tagName === "CANVAS" && st.hover && st.hover.ok) {
            baseStore.place(st.dragging, st.hover.gx, st.hover.gz);
            baseLive.armedTap = false;
            baseStore.endDrag();
            tick((n) => n + 1);
          }
          return;
        }
        if (over) {
          const from = baseLive.fromBar;
          baseLive.fromBar = null;
          if (from && Math.hypot(e.clientX - from.x, e.clientY - from.y) < 10) {
            // a tap on the bar, not a drag: keep the skill in hand
            baseLive.armedTap = true;
            tick((n) => n + 1);
            return;
          }
          if (st.placed[st.dragging]) baseStore.remove(st.dragging);
        } else if (st.hover && st.hover.ok) {
          baseStore.place(st.dragging, st.hover.gx, st.hover.gz);
        }
        baseLive.fromBar = null;
        baseStore.endDrag();
      } else if (c) {
        baseStore.select(st.selected === c.index ? null : c.index);
      } else if ((e.target as HTMLElement | null)?.tagName === "CANVAS" && snap.g === gameStore.get().selected && snap.b === baseStore.get().selected) {
        // a tap on empty ground (nothing got selected by the press) closes whatever card is open
        gameStore.select(null);
        baseStore.select(null);
      }
    };
    const cancel = () => {
      baseLive.candidate = null;
      baseLive.fromBar = null;
      baseLive.armedTap = false;
      baseStore.endDrag();
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointerdown", before, true);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      baseLive.armedTap = false;
      baseLive.fromBar = null;
    };
  }, [mode]);

  if (!mode) return null;
  if (attackOn) return <AttackUi t={{ ...gt.attack, names: gt.scout.names, weapons: gt.armory.names }} />;
  if (scoutOn) return <ScoutUi t={gt.scout} />;

  const total = skills.length;
  const count = Object.keys(placed).filter((k) => Number(k) < total).length;
  const done = total > 0 && count === total;
  const caps = lang === "en" ? "uppercase tracking-[0.14em]" : "";
  const sel = selected !== null ? skills[selected] : undefined;
  const nameOf = (i: number) => u.names[i % 9] ?? skills[i]?.name ?? "";
  const cap = resourceCaps(g.buildings);
  const gsel = g.selected ? g.buildings.find((b) => b.id === g.selected) : undefined;
  const gdef = gsel ? TYPES[gsel.type] : undefined;
  const up = gsel ? upgradeCost(gsel) : null;
  const inHand = baseLive.armedTap && dragging !== null;
  const hasCard = Boolean(gsel && gdef) || Boolean(sel && selected !== null && tab === "skills");
  const canUp = Boolean(up && g.res.c >= up.c && g.res.e >= up.e);

  const tb = "inline-flex size-11 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition sm:size-auto sm:min-h-10 sm:justify-start sm:px-3";
  const toolbar = [
    { key: "attack", Icon: Crosshair, label: gt.attack.enter, cls: "border-red-400/80 bg-red-500/10 text-red-300 hover:bg-red-500/20", on: () => enterAttack() },
    { key: "scout", Icon: Radar, label: gt.scout.enter, extra: `⚡${SCOUT_COST.e}`, cls: "border-cyan-400/80 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20", on: () => enterScout() },
    { key: "armory", Icon: Swords, label: gt.armory.title, cls: "border-orange-400/80 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20", on: () => setPanel((v) => (v === "armory" ? null : "armory")) },
    ...(foundCount > 0
      ? [{ key: "bases", Icon: MapPin, label: gt.scout.bases, extra: `${foundCount}/${BASES.length}`, cls: "border-red-300/50 bg-black/40 text-red-200 hover:bg-red-500/10", on: () => setPanel((v) => (v === "bases" ? null : "bases")) }]
      : []),
    { key: "reset", Icon: RotateCcw, label: u.reset, cls: "border-white/25 bg-black/40 text-paper-100 hover:border-cyan-300/60", on: () => baseStore.reset() },
    { key: "exit", Icon: X, label: u.exit, cls: "border-orange-400/80 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20", on: () => baseStore.setMode(false) },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-20 text-paper-100">
      {/* top: score, resources and short-lived banners in one column, so nothing can overlap */}
      <div className="absolute inset-x-0 top-20 flex flex-col items-center gap-2 ps-3 pe-14 sm:top-24 sm:px-3">
        <div className="universe-glass pointer-events-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-4 py-2">
          <div className="flex items-center gap-3">
            <div>
              <p className={cn("text-[10px] text-cyan-200", caps)}>{u.power}</p>
              <p dir="ltr" className="font-mono text-base font-bold leading-none text-orange-300">
                {power(skills, placed)}
              </p>
            </div>
            <div className="min-w-20">
              <p className={cn("text-[10px] text-cyan-200", caps)}>
                {u.online} <span dir="ltr">{count}/{total}</span>
              </p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-orange-300 transition-[width] duration-300 rtl:bg-gradient-to-l"
                  style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs" dir="ltr">
            <span className="inline-flex items-center gap-1 text-cyan-300" title={gt.crystal}>
              ◆ {Math.floor(g.res.c)}
              <span className="text-paper-300">/{cap.c}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-orange-300" title={gt.energy}>
              <Zap size={12} aria-hidden /> {Math.floor(g.res.e)}
              <span className="text-paper-300">/{cap.e}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 border-s border-white/15 ps-3 text-red-300" title={gt.wave}>
              ⚔ {g.wave}
              <span className="text-paper-300">{sim.active ? `×${sim.enemies.length + sim.queue.length}` : `${Math.max(0, Math.ceil(sim.timer))}s`}</span>
              {!sim.active && (
                <button type="button" onClick={() => callWave()} className="rounded border border-red-300/40 px-1.5 py-0.5 font-sans text-[10px] text-red-200 hover:bg-red-400/15">
                  {gt.callWave}
                </button>
              )}
            </span>
          </div>
        </div>

        {/* what is in hand: tap the map to build it */}
        {(g.armed || inHand) && (
          <div className="universe-glass pointer-events-auto flex items-center gap-3 border-orange-400/50 px-4 py-2 text-xs text-white">
            <span>{gt.placing.replace("{name}", g.armed ? gt.names[g.armed.type] : dragging !== null ? nameOf(dragging) : "")}</span>
            <button
              type="button"
              onClick={() => {
                gameStore.cancel();
                if (baseLive.armedTap) {
                  baseLive.armedTap = false;
                  baseStore.endDrag();
                  tick((n) => n + 1);
                }
              }}
              className="rounded-md border border-white/25 px-2 py-1 text-paper-100 hover:border-orange-300"
            >
              {gt.cancel}
            </button>
          </div>
        )}
        {sim.result && Date.now() - sim.result.at < 7000 && (
          <div className={cn("rounded-md border bg-black/75 px-3 py-1.5 text-xs backdrop-blur", sim.result.win ? "border-emerald-300/50 text-emerald-200" : "border-red-400/50 text-red-200")}>
            {(sim.result.win ? gt.repelled : gt.raided).replace("{n}", String(sim.result.wave))}
            <span dir="ltr" className="ms-2 font-mono">
              {sim.result.c !== 0 && `◆${sim.result.c > 0 ? "+" : ""}${sim.result.c} `}
              {sim.result.e !== 0 && `⚡${sim.result.e > 0 ? "+" : ""}${sim.result.e}`}
            </span>
          </div>
        )}
        {done && (
          <div className="universe-glass flex items-center gap-3 border-emerald-300/40 px-4 py-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-400/20 text-emerald-300">
              <Check size={16} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-white">{u.complete}</p>
              <p className="text-xs text-paper-300">{u.completeSub.replace("{n}", String(total))}</p>
            </div>
          </div>
        )}
      </div>

      {/* tools: one column of buttons, icon-only on phones */}
      <div className="pointer-events-auto absolute end-3 top-44 flex flex-col gap-2 sm:top-48">
        {toolbar.map(({ key, Icon, label, extra, cls, on }) => (
          <button key={key} type="button" onClick={on} title={label} aria-label={label} className={cn(tb, cls)}>
            <Icon size={16} aria-hidden />
            <span className="hidden sm:inline">{label}</span>
            {extra && <span dir="ltr" className="hidden font-mono text-[10px] opacity-80 sm:inline">{extra}</span>}
          </button>
        ))}
      </div>

      {/* bottom: a message, at most one card or panel, then the bar of buildings */}
      <div className="absolute inset-x-3 bottom-3 flex flex-col gap-2 sm:inset-x-auto sm:start-1/2 sm:w-[min(52rem,92vw)] sm:-translate-x-1/2 rtl:sm:translate-x-1/2">
        {g.toast && (
          <div className="pointer-events-none flex justify-center">
            <div className="rounded-md border border-red-400/50 bg-black/75 px-3 py-1.5 text-xs text-red-200 backdrop-blur">{gt.toast[g.toast]}</div>
          </div>
        )}

        {panel === "armory" && (
          <div className="universe-glass pointer-events-auto max-h-[46vh] overflow-y-auto p-3 text-xs">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-orange-200">{gt.armory.title}</p>
              <button type="button" onClick={() => setPanel(null)} aria-label="close" className="grid size-8 place-items-center rounded-md text-paper-300 hover:text-paper-100">
                <X size={16} aria-hidden />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {WEAPON_IDS.map((id) => {
                const w = WEAPONS[id];
                const own = owned(id);
                const lvl = levelOf(id);
                const next = lvl < MAX_LEVEL ? weaponUpgradeCost(id, lvl + 1) : null;
                const dmg = Math.round(w.dmg * dmgMul(lvl));
                const rate = (1 / (w.gap * gapMul(lvl))).toFixed(1);
                return (
                  <div key={id} className={cn("rounded-lg border p-2.5", current() === id ? "border-orange-300/70" : "border-white/10")}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-paper-100">{gt.armory.names[id]}</p>
                      {own && <span dir="ltr" className="font-mono text-[10px] text-orange-200">{gt.armory.level} {lvl}/{MAX_LEVEL}</span>}
                    </div>
                    <p className="mt-0.5 text-[11px] text-paper-300">{gt.armory.info[id]}</p>
                    <p dir="ltr" className="mt-1 font-mono text-[10px] text-paper-300">
                      {gt.armory.dmg} {dmg}{w.pellets > 1 ? `×${w.pellets}` : ""} · {gt.armory.rate} {rate} · {gt.armory.range} {Math.round(w.speed * w.life)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {!own ? (
                        <button type="button" onClick={() => buy(id)} className="min-h-9 rounded-lg border border-cyan-400/80 bg-cyan-500/10 px-3 font-semibold text-cyan-200">
                          {gt.armory.buy} <Cost cost={w.price} />
                        </button>
                      ) : (
                        <>
                          {current() === id ? (
                            <span className="inline-flex min-h-9 items-center px-1 text-orange-200">{gt.armory.equipped}</span>
                          ) : (
                            <button type="button" onClick={() => select(id)} className="min-h-9 rounded-lg border border-white/25 px-3 text-paper-100">
                              {gt.armory.equip}
                            </button>
                          )}
                          {next ? (
                            <button type="button" onClick={() => upgrade(id)} className="min-h-9 rounded-lg border border-emerald-400/80 bg-emerald-500/10 px-3 font-semibold text-emerald-200">
                              {gt.armory.upgrade} <Cost cost={next} />
                            </button>
                          ) : (
                            <span className="inline-flex min-h-9 items-center px-1 text-paper-300">{gt.armory.max}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {panel === "bases" && (
          <div className="universe-glass pointer-events-auto max-h-[46vh] overflow-y-auto p-3 text-xs">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-red-200">{gt.scout.bases}</p>
              <button type="button" onClick={() => setPanel(null)} aria-label="close" className="grid size-8 place-items-center rounded-md text-paper-300 hover:text-paper-100">
                <X size={16} aria-hidden />
              </button>
            </div>
            <div className="space-y-2">
              {BASES.filter((b) => scout.found.includes(b.id)).map((b) => {
                const cd = cooldownLeft(b.id);
                return (
                  <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 p-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-paper-100">{gt.scout.names[b.id]}</p>
                      <p className="text-[10px] text-paper-300">
                        {cd > 0 ? gt.scout.cooldown.replace("{m}", String(Math.ceil(cd / 60000))) : `${gt.scout.power} ${"★".repeat(b.power)}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={cd > 0}
                      onClick={() => {
                        setPanel(null);
                        travelTo(b.id);
                      }}
                      className="inline-flex min-h-9 shrink-0 items-center rounded-lg border border-red-400/80 bg-red-500/10 px-3 font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {gt.scout.attack}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* colony building card */}
        {!panel && gsel && gdef && (
          <div data-base-ui className="universe-glass pointer-events-auto max-h-[40vh] w-full self-start overflow-y-auto p-3 sm:w-72">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">{gt.names[gsel.type]}</p>
                <p className="mt-0.5 text-[11px] text-paper-300">{gt.info[gsel.type]}</p>
              </div>
              <button type="button" onClick={() => gameStore.select(null)} aria-label="close" className="grid size-8 shrink-0 place-items-center rounded-md text-paper-300 hover:text-paper-100">
                <X size={16} aria-hidden />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1.5" dir="ltr">
              {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((n) => (
                <span
                  key={n}
                  className={cn("h-1.5 flex-1 rounded-full", n <= gsel.level ? "shadow-[0_0_8px]" : "bg-white/10")}
                  style={n <= gsel.level ? { background: TYPE_HUE[gsel.type], color: TYPE_HUE[gsel.type] } : undefined}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-paper-300">
              {u.level} <span dir="ltr">{gsel.level}/{MAX_LEVEL}</span>
              {gdef.produces && (
                <span dir="ltr" className="ms-2 font-mono">
                  +{perMinute(gsel).toFixed(1)} {gt.perMin}
                </span>
              )}
            </p>
            {gdef.produces && (
              <button
                type="button"
                onClick={() => gameStore.collect(gsel.id)}
                className="mt-2 flex w-full items-center justify-between rounded-md border border-cyan-300/40 bg-cyan-400/10 px-2.5 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20"
              >
                <span>{gt.collect}</span>
                <span dir="ltr" className="font-mono">
                  {Math.floor(stored(gsel))}/{Math.floor(bufferSize(gsel))}
                </span>
              </button>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                disabled={!up}
                onClick={() => gameStore.upgrade(gsel.id)}
                className={cn(
                  "inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2 text-xs",
                  canUp ? "border-orange-400/70 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20" : "border-white/15 text-paper-300",
                  !up && "opacity-50"
                )}
              >
                <ArrowUp size={12} aria-hidden />
                {up ? <Cost cost={up} /> : gt.max}
              </button>
              <button type="button" onClick={() => gameStore.armMove(gsel.id)} className="inline-flex min-h-8 items-center gap-1 rounded-md border border-white/20 px-2 text-xs text-paper-100 hover:border-cyan-300/60">
                <Move size={12} aria-hidden /> {gt.move}
              </button>
              {gsel.type !== "hq" && (
                <button type="button" onClick={() => gameStore.sell(gsel.id)} className="inline-flex min-h-8 items-center rounded-md border border-white/20 px-2 text-xs text-red-200 hover:border-red-300/60">
                  {gt.sell}
                </button>
              )}
            </div>
          </div>
        )}

        {/* skill card */}
        {!panel && !gsel && sel && selected !== null && tab === "skills" && (
          <div className="universe-glass pointer-events-auto w-full self-start p-3 sm:w-72">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">{nameOf(selected)}</p>
                <p className="mt-0.5 text-xs text-cyan-200" dir="ltr">
                  {sel.name}
                </p>
              </div>
              <button type="button" onClick={() => baseStore.select(null)} aria-label="close" className="grid size-8 shrink-0 place-items-center rounded-md text-paper-300 hover:text-paper-100">
                <X size={16} aria-hidden />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1.5" dir="ltr">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={cn("h-1.5 flex-1 rounded-full", n <= sel.level ? "bg-orange-300 shadow-[0_0_8px_rgba(251,146,60,0.8)]" : "bg-white/10")} />
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-paper-300">
              {u.level} <span dir="ltr">{sel.level}/5</span>
            </p>
          </div>
        )}

        {/* the bar of buildings = the skills */}
        <div data-base-palette className="universe-glass pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 pt-2" role="tablist">
            {(["game", "skills"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => {
                  gameStore.cancel();
                  baseLive.armedTap = false;
                  baseStore.endDrag();
                  setTab(k);
                }}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[11px] font-semibold transition",
                  tab === k ? "border-orange-400/70 bg-orange-500/10 text-orange-200" : "border-white/15 text-paper-300 hover:border-cyan-300/50"
                )}
              >
                {k === "game" ? gt.tabGame : gt.tabSkills}
              </button>
            ))}
            {tab === "skills" && <p className="ms-2 hidden truncate text-[11px] text-paper-300 sm:block">{u.hint}</p>}
          </div>
          {tab === "game" && (
            <ul className="flex gap-2 overflow-x-auto px-3 pb-3 pt-2">
              {SHOP.map((type: BuildingType) => {
                const def = TYPES[type];
                const n = g.buildings.filter((b) => b.type === type).length;
                const can = g.res.c >= def.cost.c && g.res.e >= def.cost.e && n < def.max;
                const hue = TYPE_HUE[type];
                return (
                  <li key={type} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setPanel(null);
                        gameStore.arm(type);
                      }}
                      className={cn(
                        "flex w-28 select-none flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-start transition",
                        g.armed?.type === type && !g.armed.moveId ? "border-orange-400" : "border-white/20 hover:border-cyan-300/60",
                        can ? "bg-white/5" : "bg-white/[0.02] opacity-55"
                      )}
                    >
                      <span className="flex w-full items-center gap-2">
                        <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: hue, boxShadow: `0 0 10px ${hue}` }} />
                        <span className="truncate text-xs font-semibold text-white">{gt.names[type]}</span>
                      </span>
                      <Cost cost={def.cost} />
                      <span dir="ltr" className="text-[10px] text-paper-300">
                        {n}/{def.max}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {tab === "skills" && (
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
                        gameStore.cancel();
                        setPanel(null);
                        // tapping the skill that is already in hand puts it back
                        if (baseLive.armedTap && baseStore.get().dragging === i) {
                          baseLive.armedTap = false;
                          baseStore.endDrag();
                          tick((n) => n + 1);
                          return;
                        }
                        baseLive.px = e.clientX;
                        baseLive.py = e.clientY;
                        baseLive.fromBar = { x: e.clientX, y: e.clientY };
                        baseStore.startDrag(i);
                        if (chip.current) chip.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
                      }}
                      style={{ touchAction: "pan-x" }}
                      className={cn(
                        "flex w-28 cursor-pointer select-none flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-start transition",
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
          )}
        </div>
      </div>

      {/* chip that follows the pointer while dragging */}
      <div
        ref={chip}
        className={cn(
          "fixed start-0 top-0 z-40 rounded-md border border-orange-400/70 bg-black/70 px-2.5 py-1 text-xs font-semibold text-orange-200 backdrop-blur",
          (dragging === null || inHand) && "hidden"
        )}
      >
        {dragging !== null ? nameOf(dragging) : ""}
      </div>
    </div>
  );
}
