"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { siteConfig } from "@/data/site";
import { LaptopScene } from "./LaptopScene";

/**
 * Total number of frames in the rendered sequence. Matches the "Frame 1 ...
 * Frame 120" range from the animation brief (see README → "Cinematic hero").
 */
const FRAME_COUNT = 120;

/** public/frames/frame_0001.webp ... frame_0120.webp */
const framePath = (index: number) =>
  `/frames/frame_${String(index).padStart(4, "0")}.png`;
/**
 * Canvas-based scroll scrubber, the same technique Apple's product pages
 * use: preload every frame of a real rendered/filmed sequence, then on
 * scroll pick the matching frame and draw it to a full-bleed canvas. No 3D
 * engine runs in the browser — the realism comes entirely from the source
 * frames (see README for how to produce or source them).
 */
export function FrameSequenceHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [framesAvailable, setFramesAvailable] = useState<boolean | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const frameIndex = useTransform(scrollYProgress, [0, 1], [1, FRAME_COUNT]);
  const introOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.08], [0, -24]);
  const scrollCueOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  // Probe once: does frame_0001 actually exist? If the user hasn't dropped
  // rendered frames into /public/frames yet, fall back to the CSS laptop
  // instead of showing a wall of broken images.
  useEffect(() => {
    const probe = new Image();
    probe.onload = () => setFramesAvailable(true);
    probe.onerror = () => setFramesAvailable(false);
    probe.src = framePath(1);
  }, []);

  useEffect(() => {
    if (!framesAvailable) return;
    let cancelled = false;
    let loaded = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = framePath(i);
      const onSettled = () => {
        loaded += 1;
        if (cancelled) return;
        setLoadedCount(loaded);
        if (loaded === FRAME_COUNT) setIsReady(true);
      };
      img.onload = onSettled;
      img.onerror = onSettled;
      images.push(img);
    }
    imagesRef.current = images;

    return () => {
      cancelled = true;
    };
  }, [framesAvailable]);

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index - 1];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      drawHeight = height;
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
    } else {
      drawWidth = width;
      drawHeight = width / imgRatio;
      offsetY = (height - drawHeight) / 2;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  useMotionValueEvent(frameIndex, "change", (latest) => {
    drawFrame(Math.round(latest));
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isReady) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      drawFrame(Math.round(frameIndex.get()));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  if (prefersReducedMotion) {
    return <LaptopScene />;
  }

  // Still probing, or frames genuinely aren't there: use the CSS 3D laptop
  // so the hero is never broken while assets are being prepared.
  if (framesAvailable === false) {
    return <LaptopScene />;
  }

  return (
    <div ref={containerRef} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-ink-950">
        {!isReady && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
            <div className="h-1 w-48 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full bg-accent-blue transition-[width] duration-150"
                style={{ width: `${(loadedCount / FRAME_COUNT) * 100}%` }}
              />
            </div>
            <p className="font-mono text-xs text-paper-500">loading scene…</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          aria-label="Laptop opening animation"
        />

        <motion.div
          style={{ opacity: introOpacity, y: introY }}
          className="pointer-events-none absolute top-24 z-10 w-full text-center sm:top-28"
        >
          <p className="font-mono text-xs text-accent-green sm:text-sm">
            <span className="text-paper-500">$</span> whoami
          </p>
          <h1 className="mt-3 text-balance font-display text-display-md font-bold text-paper-100 sm:text-display-lg">
            {siteConfig.role}
          </h1>
        </motion.div>

        <motion.div
          style={{ opacity: scrollCueOpacity }}
          className="pointer-events-none absolute bottom-10 z-10 flex w-full flex-col items-center gap-2 text-paper-500"
        >
          <span className="font-mono text-[11px]">scroll to open</span>
          <span className="h-8 w-5 rounded-full border border-paper-500/40 p-1">
            <span className="block h-1.5 w-1.5 animate-bounce rounded-full bg-paper-500" />
          </span>
        </motion.div>
      </div>
    </div>
  );
}
