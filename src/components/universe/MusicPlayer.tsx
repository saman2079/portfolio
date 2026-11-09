"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { FastForward, Pause, Play, Rewind, Volume2, VolumeX, X } from "lucide-react";
import { music } from "@/lib/audio/music";
import { cn } from "@/lib/utils";

const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: ((i * 97) % 100) / 100,
  y: ((i * 53) % 100) / 100,
  z: 0.3 + ((i * 31) % 70) / 100,
}));
const BARS = 56;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** A black hole whose accretion disc and radial spectrum follow the music. */
function paint(c: HTMLCanvasElement, t: number, bars: number[], level: number) {
  const x = c.getContext("2d");
  if (!x) return;
  const w = c.width;
  const h = c.height;
  x.globalCompositeOperation = "source-over";
  x.fillStyle = "#02050b";
  x.fillRect(0, 0, w, h);

  for (let i = 0; i < STARS.length; i++) {
    const s = STARS[i];
    if (!s) continue;
    const px = (((s.x - t * 0.012 * s.z * (1 + level * 4)) % 1) + 1) % 1;
    x.fillStyle = `rgba(200,225,255,${0.25 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)) * s.z})`;
    x.fillRect(px * w, s.y * h, s.z * 1.8, s.z * 1.8);
  }

  const cx = w / 2;
  const cy = h * 0.52;
  const R = h * 0.12 * (1 + level * 0.4);
  x.globalCompositeOperation = "lighter";

  // spectrum: rays leaving the disc, seen in perspective
  for (let k = 0; k < BARS; k++) {
    const a = (k / BARS) * Math.PI * 2 + t * 0.12;
    const v = bars[k] ?? 0;
    const r0 = h * 0.4;
    const r1 = r0 + h * 0.03 + v * h * 0.22;
    x.strokeStyle = `hsla(${190 + v * 80},100%,${55 + v * 25}%,${0.35 + v * 0.6})`;
    x.lineWidth = Math.max(1.5, w / 190);
    x.beginPath();
    x.moveTo(cx + Math.cos(a) * r0 * 1.9, cy + Math.sin(a) * r0 * 0.42);
    x.lineTo(cx + Math.cos(a) * r1 * 1.9, cy + Math.sin(a) * r1 * 0.42);
    x.stroke();
  }

  // accretion disc: thin tilted rings that turn at different speeds
  x.save();
  x.translate(cx, cy);
  x.rotate(-0.22);
  for (let i = 0; i < 26; i++) {
    const rr = R * 1.45 + i * R * 0.1;
    x.setLineDash([rr * 0.7, rr * 0.12 + (i % 4) * 5]);
    x.lineDashOffset = -t * (60 - i * 1.6);
    x.strokeStyle = `hsla(${26 + i * 1.6},100%,${52 + i}%,${(1 - i / 28) * (0.5 + level * 0.7)})`;
    x.lineWidth = 1.6;
    x.beginPath();
    x.ellipse(0, 0, rr * 2, rr * 0.46, 0, 0, Math.PI * 2);
    x.stroke();
  }
  x.setLineDash([]);
  x.restore();

  // light bent over and under the hole
  for (let j = 0; j < 5; j++) {
    x.strokeStyle = `rgba(255,${170 + j * 14},${90 + j * 22},${(0.55 - j * 0.09) * (0.7 + level)})`;
    x.lineWidth = 2.2 - j * 0.3;
    x.beginPath();
    x.arc(cx, cy, R * (1.1 + j * 0.07), Math.PI * 1.05, Math.PI * 1.95);
    x.stroke();
    x.beginPath();
    x.arc(cx, cy, R * (1.1 + j * 0.07), Math.PI * 0.12, Math.PI * 0.88);
    x.stroke();
  }

  x.globalCompositeOperation = "source-over";
  x.fillStyle = "#000";
  x.beginPath();
  x.arc(cx, cy, R, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = "rgba(255,236,200,0.9)";
  x.shadowColor = "rgba(255,170,80,0.9)";
  x.shadowBlur = 14 + level * 30;
  x.lineWidth = 1.5;
  x.beginPath();
  x.arc(cx, cy, R * 1.02, 0, Math.PI * 2);
  x.stroke();
  x.shadowBlur = 0;
}

export function MusicPlayer({ lang }: { lang: "fa" | "en" }) {
  const m = useSyncExternalStore(music.subscribe, music.get, music.get);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fa = lang === "fa";

  useEffect(() => {
    if (!m.open) return;
    const c = canvas.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(288 * dpr);
    c.height = Math.round(150 * dpr);
    const bars = new Array<number>(BARS).fill(0);
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      const level = music.spectrum(bars, t);
      paint(c, t, bars, level);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [m.open]);

  if (!m.open) return null;
  const btn =
    "grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/5 text-paper-100 transition hover:border-cyan-300/70 hover:text-cyan-200";
  return (
    <div
      dir="ltr"
      role="region"
      aria-label={fa ? "پخش‌کنندهٔ آهنگ" : "Music player"}
      className="universe-glass pointer-events-auto absolute inset-x-3 top-20 z-20 mx-auto w-[min(18rem,calc(100%-1.5rem))] overflow-hidden rounded-2xl border border-cyan-300/30 p-2 shadow-[0_0_40px_rgba(56,189,248,0.2)] sm:inset-x-auto sm:end-3 sm:mx-0 sm:top-24"
    >
      <canvas ref={canvas} className="block h-[150px] w-full rounded-xl" aria-hidden />
      <div className="mt-2 flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-paper-100">Cornfield Chase</p>
          <p className="truncate text-[11px] text-paper-300">Hans Zimmer</p>
        </div>
        <button type="button" onClick={music.close} aria-label={fa ? "بستن پنل (آهنگ ادامه دارد)" : "Close panel (music keeps playing)"} className="grid h-7 w-7 place-items-center rounded-full text-paper-300 hover:text-paper-100">
          <X size={14} aria-hidden />
        </button>
      </div>

      <div className="mt-1 flex items-center gap-2 px-1 text-[10px] tabular-nums text-paper-300">
        <span className="w-8 text-end">{fmt(m.time)}</span>
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.floor(m.duration))}
          step={1}
          value={Math.min(m.time, m.duration)}
          onChange={(e) => music.seek(Number(e.target.value))}
          aria-label={fa ? "جلو و عقب بردن آهنگ" : "Seek"}
          className="h-1 flex-1 cursor-pointer accent-cyan-300"
        />
        <span className="w-8">{fmt(m.duration)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 px-1 pb-1">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => music.skip(-10)} aria-label={fa ? "۱۰ ثانیه عقب" : "Back 10 seconds"} className={btn}>
            <Rewind size={15} aria-hidden />
          </button>
          <button
            type="button"
            onClick={music.toggle}
            aria-label={m.playing ? (fa ? "توقف" : "Pause") : fa ? "پخش" : "Play"}
            className={cn(btn, "h-10 w-10 border-cyan-300/60 bg-cyan-400/15 text-cyan-100")}
          >
            {m.playing ? <Pause size={17} aria-hidden /> : <Play size={17} aria-hidden />}
          </button>
          <button type="button" onClick={() => music.skip(10)} aria-label={fa ? "۱۰ ثانیه جلو" : "Forward 10 seconds"} className={btn}>
            <FastForward size={15} aria-hidden />
          </button>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <button
            type="button"
            onClick={() => music.setVolume(m.volume > 0 ? 0 : 0.6)}
            aria-label={fa ? "صدا" : "Mute"}
            className="text-paper-300 hover:text-paper-100"
          >
            {m.volume > 0 ? <Volume2 size={15} aria-hidden /> : <VolumeX size={15} aria-hidden />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={m.volume}
            onChange={(e) => music.setVolume(Number(e.target.value))}
            aria-label={fa ? "بلندی صدا" : "Volume"}
            className="h-1 min-w-0 flex-1 cursor-pointer accent-cyan-300"
          />
        </div>
      </div>
    </div>
  );
}
