"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, LogOut, Navigation } from "lucide-react";
import { baseLive } from "@/lib/lab/baseStore";
import { atk, exitAttack, goToAttack } from "@/lib/lab/attackSim";
import { sim } from "@/lib/lab/waveSim";
import { raid } from "@/lib/lab/raidSim";
import { useGame } from "@/lib/lab/gameStore";
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
          {raid.on ? (
            <div className="font-mono text-red-300">
              {t.names[raid.id] ?? ""} <span dir="ltr" className="text-paper-300">{t.left} {sim.enemies.length}/{raid.total}</span>
            </div>
          ) : (
            <div dir="ltr" className="font-mono text-red-300">
              ⚔ {wave} <span className="text-paper-300">{sim.active ? `×${left}` : `${Math.max(0, Math.ceil(sim.timer))}s`}</span>
            </div>
          )}
          <div dir="ltr" className="font-mono text-orange-300">
            {t.kills} {atk.kills}
          </div>
        </div>
      </div>

      {/* buttons */}
      <div className="pointer-events-auto absolute end-3 top-36 flex flex-col gap-2 sm:end-5 sm:top-40">
        {!raid.on && (
        <button
          type="button"
          onClick={() => goToAttack()}
          className="universe-glass inline-flex min-h-10 items-center gap-1.5 px-3 text-xs text-paper-100 transition hover:border-red-300/60"
        >
          <Navigation size={14} aria-hidden /> {t.go}
        </button>
        )}
        <button
          type="button"
          onClick={() => exitAttack()}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-orange-400/80 bg-orange-500/10 px-3 text-xs font-semibold text-orange-300 transition hover:bg-orange-500/20"
        >
          <LogOut size={14} aria-hidden /> {t.exit}
        </button>
      </div>

      {raid.result && (
        <div className="absolute inset-x-0 top-1/3 flex justify-center px-4">
          <div className={cn("universe-glass px-6 py-4 text-center", raid.result.win ? "border-emerald-300/60" : "border-red-400/60")}>
            <p className={cn("text-lg font-bold", raid.result.win ? "text-emerald-300" : "text-red-300")}>{raid.result.win ? t.win : t.fail}</p>
            {raid.result.win && (
              <p dir="ltr" className="mt-1 font-mono text-sm text-paper-100">
                +{raid.result.c} ◆ &nbsp; +{raid.result.e} ⚡
              </p>
            )}
          </div>
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
          <p className={cn("absolute inset-x-0 bottom-3 text-center text-[11px] text-paper-300")}>{t.touch}</p>
        </>
      ) : (
        <p className="absolute inset-x-0 bottom-6 text-center text-xs text-paper-300">{t.keys}</p>
      )}
    </div>
  );
}
