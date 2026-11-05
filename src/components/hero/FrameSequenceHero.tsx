"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ResumeButton } from "@/components/ui/ResumeButton";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";

/** Number of frames in each set (public/frames/d = desktop 1280w, public/frames/m = mobile 720w). */
const FRAME_COUNT = 60;
const MOBILE_QUERY = "(max-width: 767px)";
/** The laptop sits slightly right of centre in the final frames; used when zooming on portrait screens. */
const PORTRAIT_ZOOM = 1.45;
const PORTRAIT_FOCUS_X = 0.58;
const MAX_DPR = 1.5;

type FrameSet = "d" | "m";

const framePath = (set: FrameSet, index: number) =>
  `/frames/${set}/f_${String(index).padStart(3, "0")}.webp`;

/** Load order: first frame, then a coarse pass (every 6th) so scrubbing works early, then the rest. */
const loadOrder = (() => {
  const order: number[] = [1];
  for (let i = 7; i <= FRAME_COUNT; i += 6) order.push(i);
  order.push(FRAME_COUNT);
  for (let i = 1; i <= FRAME_COUNT; i++) if (!order.includes(i)) order.push(i);
  return Array.from(new Set(order));
})();

interface Props {
  t: Dictionary;
  lang: Locale;
}

/**
 * Scroll-scrubbed canvas animation. Frames are small WebP files (~1.9 MB for both sets),
 * loaded progressively with limited concurrency. Drawing is coalesced into one rAF per
 * frame change, and the canvas resolution is capped so phones stay smooth.
 */
export function FrameSequenceHero({ t, lang }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const currentRef = useRef(1);
  const lastDrawnRef = useRef(0);
  const rafRef = useRef(0);

  const [frameSet, setFrameSet] = useState<FrameSet | null>(null);
  const [firstReady, setFirstReady] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const frameIndex = useTransform(scrollYProgress, [0, 0.88], [1, FRAME_COUNT]);
  const introOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.1], [0, -28]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const ctaOpacity = useTransform(scrollYProgress, [0.78, 0.92], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.78, 0.92], [24, 0]);
  const ctaPointer = useTransform(scrollYProgress, (v) => (v > 0.84 ? "auto" : "none"));

  // Pick the frame set once on mount (and if the viewport crosses the breakpoint).
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const apply = () => setFrameSet(mq.matches ? "m" : "d");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const draw = useCallback((requested: number) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const frames = framesRef.current;

    // Nearest already-loaded frame, so scrubbing never shows a blank canvas.
    let img: HTMLImageElement | null = null;
    let used = requested;
    for (let off = 0; off < FRAME_COUNT && !img; off++) {
      for (const idx of [requested - off, requested + off]) {
        const candidate = frames[idx - 1];
        if (candidate) {
          img = candidate;
          used = idx;
          break;
        }
      }
    }
    if (!img) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const { width: cw, height: ch } = canvas;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const portrait = cw / ch < 1;

    let dw: number;
    let dh: number;
    let dx: number;
    let dy: number;

    if (portrait) {
      // Phones: zoom in on the laptop instead of letterboxing a tiny strip.
      dw = cw * PORTRAIT_ZOOM;
      dh = dw / imgRatio;
      dx = cw / 2 - dw * PORTRAIT_FOCUS_X;
      dy = (ch - dh) / 2;
    } else if (imgRatio > cw / ch) {
      dh = ch;
      dw = ch * imgRatio;
      dx = (cw - dw) / 2;
      dy = 0;
    } else {
      dw = cw;
      dh = cw / imgRatio;
      dx = 0;
      dy = (ch - dh) / 2;
    }

    ctx.fillStyle = "#05070C";
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
    lastDrawnRef.current = used === requested ? requested : 0;
  }, []);

  const schedule = useCallback(
    (index: number) => {
      currentRef.current = index;
      if (index === lastDrawnRef.current || rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        draw(currentRef.current);
      });
    },
    [draw]
  );

  useMotionValueEvent(frameIndex, "change", (v) => {
    schedule(Math.min(FRAME_COUNT, Math.max(1, Math.round(v))));
  });

  // Progressive loader: a few requests at a time, first frame first.
  useEffect(() => {
    if (!frameSet || reducedMotion) return;
    let cancelled = false;
    let cursor = 0;
    framesRef.current = new Array(FRAME_COUNT).fill(null);
    lastDrawnRef.current = 0;
    setFirstReady(false);

    const loadNext = () => {
      if (cancelled || cursor >= loadOrder.length) return;
      const index = loadOrder[cursor++];
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (cancelled) return;
        framesRef.current[index - 1] = img;
        if (index === 1) setFirstReady(true);
        // Redraw if this frame is the one (or the nearest one) currently needed.
        lastDrawnRef.current = 0;
        schedule(currentRef.current);
        loadNext();
      };
      img.onerror = loadNext;
      img.src = framePath(frameSet, index);
    };

    const CONCURRENCY = frameSet === "m" ? 3 : 4;
    for (let i = 0; i < CONCURRENCY; i++) loadNext();

    return () => {
      cancelled = true;
    };
  }, [frameSet, reducedMotion, schedule]);

  // Keep the canvas pixel size in sync with its box (DPR capped for performance).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        lastDrawnRef.current = 0;
        schedule(currentRef.current);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [reducedMotion, schedule]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const intro = (
    <>
      <p className="font-mono text-xs text-accent-green sm:text-sm" dir="ltr">
        <span className="text-paper-500">$</span> {t.hero.whoami}
      </p>
      <h1 className="mt-3 text-balance font-display text-display-lg font-bold text-paper-100">{t.name}</h1>
      <p className="text-gradient mt-2 font-display text-lg font-bold sm:text-2xl">{t.role}</p>
    </>
  );

  const cta = (
    <>
      <p className="text-balance text-sm text-paper-300 sm:text-base">{t.tagline}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <ResumeButton lang={lang} label={t.ui.downloadResume} />
        <a
          href="#contact"
          className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-paper-100 backdrop-blur transition-colors hover:bg-white/10"
        >
          {t.ui.contactMe}
        </a>
      </div>
    </>
  );

  // Reduced motion: a single still of the opened laptop, no scroll scrubbing.
  if (reducedMotion) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-6 pb-16 pt-28 text-center">
        <div>{intro}</div>
        <picture>
          <source media={MOBILE_QUERY} srcSet={framePath("m", FRAME_COUNT)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={framePath("d", FRAME_COUNT)}
            alt=""
            width={1280}
            height={647}
            className="mx-auto w-full max-w-4xl rounded-xl"
          />
        </picture>
        <div>{cta}</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-[230vh] md:h-[260vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-ink-950 [height:100svh]">
        <canvas
          ref={canvasRef}
          className={`h-full w-full transition-opacity duration-700 ${firstReady ? "opacity-100" : "opacity-0"}`}
          aria-hidden
        />
        {/* vignette keeps text readable over the render */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,7,12,0.65)_100%)]"
        />

        {!firstReady && (
          <p className="absolute inset-x-0 top-1/2 z-10 text-center font-mono text-xs text-paper-500" dir="ltr">
            {t.ui.loadingScene}
          </p>
        )}

        <motion.div
          style={{ opacity: introOpacity, y: introY }}
          className="pointer-events-none absolute inset-x-0 top-24 z-10 px-6 text-center sm:top-28"
        >
          {intro}
        </motion.div>

        <motion.div
          style={{ opacity: ctaOpacity, y: ctaY, pointerEvents: ctaPointer }}
          className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent px-6 pb-8 pt-16 text-center sm:pb-12"
        >
          {cta}
        </motion.div>

        <motion.div
          style={{ opacity: cueOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2 text-paper-500 sm:bottom-10"
        >
          <span className="font-mono text-[11px]">{t.ui.scrollToOpen}</span>
          <ArrowDown size={16} className="animate-bounce" />
        </motion.div>
      </div>
    </div>
  );
}
