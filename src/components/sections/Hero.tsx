import { FrameSequenceHero } from "@/components/hero/FrameSequenceHero";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";

/**
 * `legacy-hero` is the 2D hero. It is the fallback (no WebGL, reduced motion, SEO
 * before hydration) and it keeps the section's height; the universe cockpit
 * covers it while the 3D scene is active.
 */
export function Hero({ t, lang }: { t: Dictionary; lang: Locale }) {
  return (
    <section id="top" aria-label={t.role}>
      <div className="legacy-hero">
        <FrameSequenceHero t={t} lang={lang} />
      </div>
    </section>
  );
}
