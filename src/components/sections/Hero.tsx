import { FrameSequenceHero } from "@/components/hero/FrameSequenceHero";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";

export function Hero({ t, lang }: { t: Dictionary; lang: Locale }) {
  return (
    <section id="top" aria-label={t.role}>
      <FrameSequenceHero t={t} lang={lang} />
    </section>
  );
}
