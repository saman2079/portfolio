"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, LogOut, Navigation } from "lucide-react";
import { baseLive } from "@/lib/lab/baseStore";
import { atk, exitAttack, goToAttack } from "@/lib/lab/attackSim";
import { sim } from "@/lib/lab/waveSim";
import { raid, travelTo } from "@/lib/lab/raidSim";
import { BASES, scout, cooldownLeft } from "@/lib/lab/scoutSim";
import { useGame } from "@/lib/lab/gameStore";
import { WEAPONS, WEAPON_IDS, cycle, current, levelOf, ownedList, select, useArmoury, type WeaponId } from "@/lib/lab/weapons";
import { cn } from "@/lib/utils";

export interface AttackText {
  exit: string;
  go: string;
  keys: string;
  touch: string;
  kills: string;
  hp: string;
  wave: string;
  /** enemy base names, indexed by base id */
  names: string[];
  weapons: Record<WeaponId, string>;
  left: string;
  win: string;
  fail: string;
}

const KEYS: Record<string, "u" | "d" | "l" | "r"> = {
  KeyW: "u",
  ArrowUp: "u",
  KeyS: "d",
  ArrowDown: "d",
  KeyA: "l",
  ArrowLeft: "l",
  KeyD: "r",
  ArrowRight: "r",
};
const JOY_R = 52;

/** DOM side of attack mode: keyboard + mouse input, PUBG-style joystick and fire button on touch, status. */
export function AttackUi({ t }: { t: AttackText }) {
  const wave = useGame((s) => s.wave);
  useArmoury();
  const [, tick] = useState(0);
  const [coarse, setCoarse] = useState(false);
  const thumb = useRef<HTMLDivElement>(null);
  const joyId = useRef<number | null>(null);

  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    const id = window.setInterval(() => tick((n) => n + 1), 200);
    const key = (down: boolean) => (e: KeyboardEvent) => {
      const k = KEYS[e.code];
      if (k) {
        atk.keys[k] = down;
        e.preventDefault();
      } else if (down && /^Digit[1-6]$/.test(e.code)) {
        const id = WEAPON_IDS[Number(e.code.slice(5)) - 1];
        if (id) select(id);
      } else if (e.code === "Space") {
        atk.fire = down;
        e.preventDefault();
      } else if (e.code === "Escape" && down) exitAttack();
    };
    const kd = key(true);
    const ku = key(false);
    const pm = (e: PointerEvent) => {
      baseLive.px = e.clientX;
      baseLive.py = e.clientY;
      if (e.pointerType === "mouse") atk.useMouse = true;
    };
    const pd = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      baseLive.px = e.clientX;
      baseLive.py = e.clientY;
      atk.useMouse = true;
      if ((e.target as HTMLElement | null)?.tagName === "CANVAS") atk.fire = true;
    };
    const pu = (e: PointerEvent) => {
      if (e.pointerType === "mouse") atk.fire = false;
    };
    const blur = () => {
      atk.keys = { u: false, d: false, l: false, r: false };
      atk.fire = false;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("pointermove", pm);
    window.addEventListener("pointerdown", pd);
    window.addEventListener("pointerup", pu);
    window.addEventListener("blur", blur);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("pointermove", pm);
      window.removeEventListener("pointerdown", pd);
      window.removeEventListener("pointerup", pu);
      window.removeEventListener("blur", blur);
      atk.joy = { x: 0, y: 0 };
      atk.fire = false;
    };
  }, []);

  const moveJoy = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > JOY_R) {
      dx = (dx / d) * JOY_R;
      dy = (dy / d) * JOY_R;
    }
    atk.joy = { x: dx / JOY_R, y: dy / JOY_R };
    if (thumb.current) thumb.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const endJoy = () => {
    joyId.current = null;
    atk.joy = { x: 0, y: 0 };
    if (thumb.current) thumb.current.style.transform = "translate(0px, 0px)";
  };

  const left = sim.enemies.length + sim.queue.length;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 text-paper-100">
      {/* status */}
      <div className="absolute inset-x-0 top-20 flex justify-center px-4 sm:top-24">
        <div className="universe-glass pointer-events-auto flex items-center gap-4 px-4 py-2 text-xs">
          <div className="min-w-24">
            <p className="text-[10px] text-cyan-200">{t.hp}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${Math.max(0, (atk.hp / atk.max) * 100)}%` }} />
            </div>
          </div>
          <div dir="ltr" className="font-mono text-red-300">
            ⚔ {wave} <span className="text-paper-300">{sim.active ? `×${left}` : `${Math.max(0, Math.ceil(sim.timer))}s`}</span>
          </div>
          {sim.defenders.length > 0 && (
            <div className="font-mono text-orange-200">
              {t.left} <span dir="ltr">{sim.defenders.length}</span>
            </div>
          )}
          <div dir="ltr" className="font-mono text-orange-300">
            {t.kills} {atk.kills}
          </div>
        </div>
      </div>

      {/* buttons */}
      <div className="pointer-events-auto absolute end-3 top-36 flex flex-col gap-2 sm:end-5 sm:top-40">
        <button
          type="button"
          onClick={() => goToAttack()}
          className="universe-glass inline-flex min-h-10 items-center gap-1.5 px-3 text-xs text-paper-100 transition hover:border-red-300/60"
        >
          <Navigation size={14} aria-hidden /> {t.go}
        </button>
        <button
          type="button"
          onClick={() => exitAttack()}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-orange-400/80 bg-orange-500/10 px-3 text-xs font-semibold text-orange-300 transition hover:bg-orange-500/20"
        >
          <LogOut size={14} aria-hidden /> {t.exit}
        </button>
        {BASES.filter((b) => scout.found.includes(b.id) && cooldownLeft(b.id) === 0).map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => travelTo(b.id)}
            className="universe-glass inline-flex min-h-10 items-center gap-1.5 px-3 text-xs text-red-200 transition hover:border-red-300/60"
          >
            ➤ {t.names[b.id]} <span dir="ltr">{"★".repeat(b.power)}</span>
          </button>
        ))}
      </div>

      {raid.result && Date.now() - raid.result.at < 5000 && (
        <div className="absolute inset-x-0 top-1/3 flex justify-center px-4">
          <div className="universe-glass border-emerald-300/60 px-6 py-4 text-center">
            <p className="text-lg font-bold text-emerald-300">
              {t.win} {t.names[raid.result.id] ?? ""}
            </p>
            <p dir="ltr" className="mt-1 font-mono text-sm text-paper-100">
              +{raid.result.c} ◆ &nbsp; +{raid.result.e} ⚡
            </p>
          </div>
        </div>
      )}

      {/* weapons you own: tap or press 1-6 */}
      {!coarse && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-14 flex justify-center gap-1.5 px-3">
          {ownedList().map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => select(id)}
              className={cn(
                "universe-glass min-h-9 px-2.5 text-[11px] transition",
                current() === id ? "border-orange-300/80 text-orange-200" : "text-paper-300 hover:border-orange-300/50"
              )}
            >
              <span dir="ltr" className="me-1 font-mono text-paper-300">{WEAPON_IDS.indexOf(id) + 1}</span>
              {t.weapons[id]}
            </button>
          ))}
        </div>
      )}

      {coarse ? (
        <>
          {/* joystick (left) and fire button (right), always on the physical sides like a shooter */}
          <div
            dir="ltr"
            className="pointer-events-auto absolute bottom-10 left-5 grid h-32 w-32 place-items-center rounded-full border border-white/25 bg-white/5 backdrop-blur-sm"
            style={{ touchAction: "none" }}
            onPointerDown={(e) => {
              joyId.current = e.pointerId;
              e.currentTarget.setPointerCapture(e.pointerId);
              moveJoy(e);
            }}
            onPointerMove={(e) => {
              if (joyId.current === e.pointerId) moveJoy(e);
            }}
            onPointerUp={endJoy}
            onPointerCancel={endJoy}
          >
            <div ref={thumb} className="h-14 w-14 rounded-full border border-cyan-300/70 bg-cyan-300/25 shadow-[0_0_18px_rgba(34,211,238,0.5)]" />
          </div>
          <button
            type="button"
            aria-label="fire"
            className="pointer-events-auto absolute bottom-12 right-6 grid h-24 w-24 place-items-center rounded-full border-2 border-orange-400/80 bg-orange-500/20 text-orange-200 shadow-[0_0_22px_rgba(251,146,60,0.45)] active:bg-orange-500/40"
            style={{ touchAction: "none" }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              atk.fire = true;
            }}
            onPointerUp={() => (atk.fire = false)}
            onPointerCancel={() => (atk.fire = false)}
          >
            <Crosshair size={34} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => cycle()}
            className="universe-glass pointer-events-auto absolute bottom-40 right-4 min-h-10 px-3 text-xs text-orange-200"
          >
            ⇄ {t.weapons[current()]} <span dir="ltr">L{levelOf(current())}</span>
          </button>
          <p className={cn("absolute inset-x-0 bottom-3 text-center text-[11px] text-paper-300")}>{t.touch}</p>
        </>
      ) : (
        <p className="absolute inset-x-0 bottom-6 text-center text-xs text-paper-300">{t.keys}</p>
      )}
    </div>
  );
}
