import type { CSSProperties } from "react";
import { hueColors } from "@/lib/lab/palette";
import type { LabState } from "@/lib/store/labStore";

function ring(count: number, radius: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + offset;
    return {
      key: i,
      left: `${(50 + radius * Math.cos(angle)).toFixed(2)}%`,
      top: `${(50 + radius * Math.sin(angle)).toFixed(2)}%`,
    };
  });
}

// Computed once at module load; identical on server and client.
const OUTER = ring(10, 46);
const INNER = ring(8, 34, 0.4);

/**
 * Pure-CSS view of the Lab state. It only reads the state — which is exactly
 * what the 3D scene will do later — and animates transform/opacity only.
 */
export function CorePreview({ state, label }: { state: LabState; label: string }) {
  const duration = state.speed === 0 ? 24 : 24 - state.speed * 0.22;
  const style = {
    "--lab-color": hueColors[state.hue],
    "--lab-glow": String(state.light / 100),
    "--lab-speed": `${duration.toFixed(2)}s`,
    "--lab-dot": `${(2 + state.particleSize * 1.2).toFixed(1)}px`,
    "--lab-play": state.speed === 0 ? "paused" : "running",
  } as CSSProperties;

  return (
    <div className="lab-stage" style={style} role="img" aria-label={label}>
      <div className="lab-halo" aria-hidden />
      <div className={`lab-core lab-core--${state.shape}`} aria-hidden />
      <div className="lab-orbit" aria-hidden>
        {OUTER.map((dot) => (
          <span key={dot.key} className="lab-dot" style={{ left: dot.left, top: dot.top }} />
        ))}
      </div>
      <div className="lab-orbit lab-orbit--b" aria-hidden>
        {INNER.map((dot) => (
          <span key={dot.key} className="lab-dot" style={{ left: dot.left, top: dot.top }} />
        ))}
      </div>
    </div>
  );
}
