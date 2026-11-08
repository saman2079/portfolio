import type { DestinationId } from "@/lib/universe/destinations";
import { SEGMENTS, flightLive, stationU } from "@/lib/store/flightStore";

/**
 * Scroll is the single source of truth for the flight: the tall hero section is
 * the "runway", scrollY/range is where the ship should be. Planet clicks just
 * animate the scroll position, so wheel, touch, keyboard and clicks all agree.
 */

let top = 0;
let range = 1;
let anim: number | null = null;
let idle: number | undefined;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function measure() {
  const hero = document.getElementById("top");
  if (!hero) return;
  top = hero.getBoundingClientRect().top + window.scrollY;
  range = Math.max(1, hero.offsetHeight - window.innerHeight);
}

function readScroll() {
  flightLive.targetU = clamp01((window.scrollY - top) / range);
}

function finish() {
  flightLive.flying = false;
  document.documentElement.style.scrollBehavior = "";
}

function cancel() {
  if (anim !== null) {
    cancelAnimationFrame(anim);
    anim = null;
  }
  finish();
}

/** Glide the scroll position (and with it the ship) to a point on the path. */
export function flyToU(u: number, quick = false) {
  measure();
  const from = window.scrollY;
  const to = top + clamp01(u) * range;
  const segments = Math.abs(clamp01(u) - flightLive.targetU) * SEGMENTS;
  const base = quick ? 0.9 : 1.6 + segments * 1.5;
  const duration = (Math.min(8, Math.max(0.9, base)) / Math.max(0.4, flightLive.speedMul)) * 1000;

  cancel();
  flightLive.flying = true;
  // the page uses smooth scrolling in CSS; programmatic frames must not be smoothed again
  document.documentElement.style.scrollBehavior = "auto";
  const t0 = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / duration);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    window.scrollTo(0, from + (to - from) * e);
    if (k < 1) {
      anim = requestAnimationFrame(step);
    } else {
      anim = null;
      finish();
    }
  };
  anim = requestAnimationFrame(step);
}

export function flyToStation(id: DestinationId) {
  flyToU(stationU(id));
}

/** After the user stops scrolling close to a planet, dock with it. */
function magnet() {
  if (!flightLive.enabled || anim !== null) return;
  if (window.scrollY > top + range + 4) return; // already in the 2D page
  const u = flightLive.targetU;
  const target = Math.round(u * SEGMENTS) / SEGMENTS;
  const gap = Math.abs(u - target);
  if (gap > 0.045 || gap < 0.002) return;
  flyToU(target, true);
}

export function attachFlight() {
  measure();
  readScroll();

  const onScroll = () => {
    readScroll();
    if (anim === null) {
      window.clearTimeout(idle);
      idle = window.setTimeout(magnet, 220);
    }
  };
  const onResize = () => {
    measure();
    readScroll();
  };
  const onUser = () => {
    if (anim !== null) cancel();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("wheel", onUser, { passive: true });
  window.addEventListener("touchstart", onUser, { passive: true });
  window.addEventListener("keydown", onUser);
  // layout (fonts, the tall hero) settles shortly after mount
  const settle = window.setTimeout(onResize, 800);

  return () => {
    window.clearTimeout(settle);
    window.clearTimeout(idle);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("wheel", onUser);
    window.removeEventListener("touchstart", onUser);
    window.removeEventListener("keydown", onUser);
    cancel();
  };
}
