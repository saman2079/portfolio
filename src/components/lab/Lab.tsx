"use client";

import { RotateCcw } from "lucide-react";
import { Window } from "@/components/os/Window";
import { buttonClasses } from "@/components/os/button";
import { SHAPES } from "@/lib/lab/palette";
import { labStore, useLabState } from "@/lib/store/labStore";
import type { Dictionary } from "@/i18n/types";
import { CorePreview } from "./CorePreview";
import { Segmented } from "./controls/Segmented";
import { Slider } from "./controls/Slider";
import { Swatches } from "./controls/Swatches";

/** The Interactive Lab: live controls on one side, the result on the other. */
export function Lab({ t }: { t: Dictionary["lab"] }) {
  const state = useLabState();

  const readout = [
    "const core = {",
    `  color: "${state.hue}",`,
    `  light: ${state.light},`,
    `  speed: ${state.speed},`,
    `  particles: ${state.particleSize},`,
    `  shape: "${state.shape}",`,
    "};",
  ].join("\n");

  return (
    <Window title={t.windowTitle} status="LIVE" bodyClassName="grid gap-6 p-4 sm:p-6 md:grid-cols-2 md:gap-8">
      <div className="space-y-4">
        <div className="mx-auto w-full max-w-[26rem]">
          <CorePreview state={state} label={t.previewLabel} />
        </div>
        <pre
          dir="ltr"
          className="overflow-x-auto rounded-lg border border-white/10 bg-ink-950 p-3 font-mono text-[11px] leading-relaxed text-paper-300"
        >
          <code>{readout}</code>
        </pre>
      </div>

      <div className="space-y-5">
        <Swatches
          legend={t.controls.color}
          names={t.hues}
          value={state.hue}
          onChange={(hue) => labStore.set({ hue })}
        />
        <Slider
          id="lab-light"
          label={t.controls.light}
          min={0}
          max={100}
          value={state.light}
          onChange={(light) => labStore.set({ light })}
        />
        <Slider
          id="lab-speed"
          label={t.controls.speed}
          min={0}
          max={100}
          value={state.speed}
          onChange={(speed) => labStore.set({ speed })}
        />
        <Slider
          id="lab-particles"
          label={t.controls.particleSize}
          min={1}
          max={10}
          value={state.particleSize}
          onChange={(particleSize) => labStore.set({ particleSize })}
        />
        <Segmented
          legend={t.controls.shape}
          name="lab-shape"
          options={SHAPES}
          labels={t.shapes}
          value={state.shape}
          onChange={(shape) => labStore.set({ shape })}
        />
        <button type="button" onClick={() => labStore.reset()} className={buttonClasses("outline", "w-full sm:w-auto")}>
          <RotateCcw size={15} aria-hidden />
          {t.controls.reset}
        </button>
      </div>
    </Window>
  );
}
