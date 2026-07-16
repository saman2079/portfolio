"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CodeEditorScreen } from "./CodeEditorScreen";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * A scroll-pinned laptop that opens as the user scrolls through the hero.
 * The outer wrapper is 300vh tall; the inner content sticks to the top of
 * the viewport for that whole span, and every visual property (lid angle,
 * scale, glow, code reveal) is derived from scroll progress across it.
 */
export function LaptopScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Lid: closed (folded flat, facing the viewer) -> open (upright).
  const lidRotateX = useTransform(scrollYProgress, [0.05, 0.45], [100, -8]);
  // Whole laptop settles slightly and comes closer as it opens.
  const sceneRotateX = useTransform(scrollYProgress, [0, 0.45], [18, 6]);
  const sceneScale = useTransform(scrollYProgress, [0, 0.45, 1], [0.82, 1, 1.04]);
  const sceneY = useTransform(scrollYProgress, [0, 0.45], [40, 0]);
  // Screen brightness ramps in just after the lid starts lifting.
  const screenOpacity = useTransform(scrollYProgress, [0.15, 0.45], [0, 1]);
  const glowOpacity = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]);
  // Code types out across the second half of the pinned scroll span.
  const typingProgress = useTransform(scrollYProgress, [0.5, 0.95], [0, 1]);
  // Intro copy fades as soon as scrolling starts.
  const introOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.12], [0, -24]);
  const scrollCueOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

  if (prefersReducedMotion) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <StaticLaptop />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-6">
        <motion.div
          style={{ opacity: introOpacity, y: introY }}
          className="pointer-events-none absolute top-24 z-10 text-center sm:top-28"
        >
          <HeroIntro />
        </motion.div>

        <div className="perspective-1200 relative flex h-full w-full items-center justify-center">
          <motion.div
            style={{
              rotateX: sceneRotateX,
              scale: sceneScale,
              y: sceneY,
            }}
            className="preserve-3d relative w-[min(90vw,640px)]"
          >
            {/* ambient glow behind the screen once it's open */}
            <motion.div
              style={{ opacity: glowOpacity }}
              className="absolute -inset-10 -z-10 rounded-full bg-accent-blue/20 blur-3xl"
              aria-hidden
            />

            {/* base / keyboard deck */}
            <div className="relative aspect-[16/10.5] w-full">
              <div className="absolute inset-x-0 bottom-0 h-[10%] rounded-b-xl rounded-t-sm bg-gradient-to-b from-ink-600 to-ink-700 shadow-laptop" />
              <div className="absolute inset-x-[3%] bottom-[8%] h-[46%] rounded-t-md bg-ink-700">
                <div className="absolute inset-x-[6%] top-[10%] grid h-[55%] grid-cols-12 gap-[2px]">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <span key={i} className="rounded-[2px] bg-ink-600/70" />
                  ))}
                </div>
                <div className="absolute bottom-[8%] left-1/2 h-[6%] w-[18%] -translate-x-1/2 rounded-sm bg-ink-600" />
              </div>

              {/* lid, hinged at the bottom edge of the base */}
              <motion.div
                style={{ rotateX: lidRotateX }}
                className="preserve-3d absolute inset-x-[3%] bottom-[45%] aspect-[16/10] origin-bottom rounded-t-lg bg-ink-800 p-[3%] shadow-laptop"
              >
                <motion.div style={{ opacity: screenOpacity }} className="h-full w-full">
                  <CodeEditorScreen typingProgress={typingProgress} />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div
          style={{ opacity: scrollCueOpacity }}
          className="absolute bottom-10 flex flex-col items-center gap-2 text-paper-500"
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

function HeroIntro() {
  return (
    <div className="space-y-3">
      <p className="font-mono text-xs text-accent-green sm:text-sm">
        <span className="text-paper-500">$</span> whoami
      </p>
      <h1 className="text-balance font-display text-display-md font-bold text-paper-100 sm:text-display-lg">
        Frontend Developer
      </h1>
    </div>
  );
}

/** Non-animated fallback for prefers-reduced-motion, kept visually consistent. */
function StaticLaptop() {
  return (
    <div className="w-full space-y-8">
      <HeroIntro />
      <div className="mx-auto aspect-[16/10] w-full max-w-lg overflow-hidden rounded-lg bg-ink-800 shadow-laptop">
        <div className="flex items-center gap-1.5 bg-ink-800 px-3 py-2">
          <span className="editor-dot bg-accent-red/70" />
          <span className="editor-dot bg-accent-amber/70" />
          <span className="editor-dot bg-accent-green/70" />
        </div>
        <div className="p-4 text-left font-mono text-xs text-paper-300">
          <p>
            <span className="text-accent-violet">const</span> developer = {"{"}
          </p>
          <p className="pl-4">
            role: <span className="text-accent-green">&ldquo;Frontend Developer&rdquo;</span>,
          </p>
          <p>{"}"}</p>
        </div>
      </div>
    </div>
  );
}
