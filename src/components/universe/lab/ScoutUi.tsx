"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { BASES, DURATION, exitScout, scout, useScoutFound, useScoutLast } from "@/lib/lab/scoutSim";
import { baseLive } from "@/lib/lab/baseStore";

export interface ScoutText {
  exit: string;
  keys: string;
  touch: string;
  battery: string;
  found: string;
  /** "{name}" is replaced by the base's name */
  discovered: string;
  names: string[];
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

/** DOM side of the drone flight: keyboard or on-screen joystick, battery, discoveries. */
export function ScoutUi({ t }: { t: ScoutText }) {
  const found = useScoutFound();
  const last = useScoutLast();
  const [, tick] = useState(0);
  const [coarse, setCoarse] = useState(false);
  const [banner, setBanner] = useState<number>(-1);
  const thumb = useRef<HTMLDivElement>(null);
  const joyId = useRef<number | null>(null);

  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    const id = window.setInterval(() => tick((n) => n + 1), 200);
    const key = (down: boolean) => (e: KeyboardEvent) => {
      const k = KEYS[e.code];
      if (k) {
        scout.keys[k] = down;
        e.preventDefault();
      } else if (e.code === "Escape" && down) exitScout();
    };
    const kd = key(true);
    const ku = key(false);
    const pm = (e: PointerEvent) => {
      baseLive.px = e.clientX;
      baseLive.py = e.clientY;
    };
    const blur = () => {
      scout.keys = { u: false, d: false, l: false, r: false };
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("pointermove", pm);
    window.addEventListener("blur", blur);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("pointermove", pm);
      window.removeEventListener("blur", blur);
      scout.joy = { x: 0, y: 0 };
    };
  }, []);

  // show the "discovered" banner for a few seconds after each find
  useEffect(() => {
    if (last < 0) return;
    setBanner(last);
    const id = window.setTimeout(() => setBanner(-1), 3500);
    return () => window.clearTimeout(id);
  }, [last, found]);

  const moveJoy = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > JOY_R) {
      dx = (dx / d) * JOY_R;
      dy = (dy / d) * JOY_R;
    }
    scout.joy = { x: dx / JOY_R, y: dy / JOY_R };
    if (thumb.current) thumb.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const endJoy = () => {
    joyId.current = null;
    scout.joy = { x: 0, y: 0 };
    if (thumb.current) thumb.current.style.transform = "translate(0px, 0px)";
  };

  const pct = Math.max(0, (scout.left / DURATION) * 100);
  // an arrow toward the nearest base that is still hidden (the camera looks toward -z, which is screen-up)
  let compass: { angle: number; dist: number } | null = null;
  let best = Infinity;
  for (const b of BASES) {
    if (scout.found.includes(b.id)) continue;
    const dx = b.x - scout.x;
    const dz = b.z - scout.z;
    const d = Math.hypot(dx, dz);
    if (d < best) {
      best = d;
      compass = { angle: Math.atan2(dx, -dz), dist: Math.round(d) };
    }
  }
  return (
    <div className="pointer-events-none absolute inset-0 z-20 text-paper-100">
      <div className="absolute inset-x-0 top-20 flex flex-col items-center gap-2 px-4 sm:top-24">
        <div className="universe-glass pointer-events-auto flex items-center gap-4 px-4 py-2 text-xs">
          <div className="min-w-28">
            <p className="text-[10px] text-cyan-200">{t.battery}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div dir="ltr" className="font-mono text-red-300">
            {t.found} {found}/{BASES.length}
          </div>
        </div>
        {banner >= 0 && (
          <div className="universe-glass border-red-400/60 px-4 py-2 text-xs font-semibold text-red-200">
            {t.discovered.replace("{name}", t.names[banner] ?? "")}
            <span dir="ltr" className="ms-3 font-mono text-paper-100">
              +{scout.reward.c} ◆ +{scout.reward.e} ⚡
            </span>
          </div>
        )}
      </div>

      {compass && (
        <div className="absolute inset-x-0 top-40 flex justify-center sm:top-44">
          <div className="universe-glass flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-200">
            <span style={{ display: "inline-block", transform: `rotate(${compass.angle}rad)` }} aria-hidden>
              ▲
            </span>
            <span dir="ltr" className="font-mono">{compass.dist} m</span>
          </div>
        </div>
      )}

      <div className="pointer-events-auto absolute end-3 top-36 sm:end-5 sm:top-40">
        <button
          type="button"
          onClick={() => exitScout()}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-orange-400/80 bg-orange-500/10 px-3 text-xs font-semibold text-orange-300 transition hover:bg-orange-500/20"
        >
          <LogOut size={14} aria-hidden /> {t.exit}
        </button>
      </div>

      {coarse ? (
        <>
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
          <p className="absolute inset-x-0 bottom-3 text-center text-[11px] text-paper-300">{t.touch}</p>
        </>
      ) : (
        <p className="absolute inset-x-0 bottom-6 text-center text-xs text-paper-300">{t.keys}</p>
      )}
    </div>
  );
}
