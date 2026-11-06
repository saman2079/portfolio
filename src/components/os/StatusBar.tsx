import { Languages } from "lucide-react";
import { pathFor, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { ResumeButton } from "@/components/ui/ResumeButton";
import { StatusClock } from "./StatusClock";

/** Top bar of the OS shell: brand, availability, local time, language, résumé. */
export function StatusBar({ lang, t }: { lang: Locale; t: Dictionary }) {
  const other: Locale = lang === "fa" ? "en" : "fa";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink-950/75 backdrop-blur-md">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <a
          href="#top"
          dir="ltr"
          className="flex items-center gap-2 font-mono text-[13px] font-semibold tracking-wide text-paper-100 transition-colors hover:text-signal"
        >
          <span aria-hidden className="h-2 w-2 rounded-full bg-signal shadow-signal" />
          SAMAN.OS
        </a>

        <nav aria-label={t.ui.navLabel} className="hidden items-center gap-1 xl:flex">
          {t.nav.map((item) => <a key={item.href} href={item.href} className="rounded-md px-2 py-1.5 text-[11px] text-paper-400 transition hover:bg-white/5 hover:text-cyan-200">{item.label}</a>)}
        </nav>
        <p className="hidden min-w-0 truncate text-xs text-paper-300 lg:block">
          <span className="text-signal">●</span> {t.availability}
        </p>

        <div className="flex items-center gap-3">
          <StatusClock lang={lang} label={t.ui.statusLocation} />
          <a
            href={pathFor(other)}
            hrefLang={other}
            lang={other}
            aria-label={t.ui.switchTo}
            title={t.ui.switchTo}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-white/10 px-2.5 text-xs font-semibold text-paper-300 transition-colors hover:border-signal/50 hover:text-paper-100"
          >
            <Languages size={14} aria-hidden />
            {t.ui.langLabel}
          </a>
          <ResumeButton
            lang={lang}
            label={t.ui.downloadResume}
            variant="ghost"
            className="hidden !min-h-8 !px-3 !py-1 text-xs sm:inline-flex"
          />
        </div>
      </div>
    </header>
  );
}
