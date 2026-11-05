"use client";

import { useEffect, useState } from "react";
import { Languages, Menu, X } from "lucide-react";
import { siteConfig } from "@/i18n/site";
import { pathFor, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { ResumeButton } from "@/components/ui/ResumeButton";
import { cn } from "@/lib/utils";

export function Header({ lang, t }: { lang: Locale; t: Dictionary }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const other: Locale = lang === "fa" ? "en" : "fa";

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const langSwitch = (
    // Plain anchor: a full navigation so <html lang/dir> are re-rendered for the new language.
    <a
      href={pathFor(other)}
      hrefLang={other}
      lang={other}
      aria-label={t.ui.switchTo}
      title={t.ui.switchTo}
      className="inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-2.5 py-1.5 text-xs font-semibold text-paper-300 transition-colors hover:border-accent-blue/50 hover:text-paper-100"
    >
      <Languages size={14} />
      {t.ui.langLabel}
    </a>
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isScrolled || isMenuOpen
          ? "border-b border-ink-600 bg-ink-950/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
        <a
          href="#top"
          dir="ltr"
          className="font-mono text-sm text-paper-100 transition-colors hover:text-accent-blue"
        >
          <span className="text-accent-green">const</span> <span className="text-accent-blue">dev</span>{" "}
          <span className="text-paper-300">=</span>{" "}
          <span className="text-accent-violet">&ldquo;{t.name}&rdquo;</span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {t.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-paper-300 transition-colors hover:text-paper-100"
            >
              {item.label}
            </a>
          ))}
          {langSwitch}
          <ResumeButton lang={lang} label={t.ui.downloadResume} variant="ghost" className="!px-4 !py-1.5" />
          <a
            href={`mailto:${siteConfig.email}`}
            className="rounded-md bg-accent-blue px-4 py-1.5 text-sm font-semibold text-ink-950 transition-opacity hover:opacity-90"
          >
            {t.ui.sayHi}
          </a>
        </nav>

        <div className="flex items-center gap-3 lg:hidden">
          {langSwitch}
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            className="text-paper-100"
            aria-label={isMenuOpen ? t.ui.menuClose : t.ui.menuOpen}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-ink-600 px-5 py-4 sm:px-6 lg:hidden" aria-label="Mobile">
          {t.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className="rounded px-2 py-2.5 text-sm text-paper-300 hover:bg-ink-800 hover:text-paper-100"
            >
              {item.label}
            </a>
          ))}
          <ResumeButton lang={lang} label={t.ui.downloadResume} className="mt-2" />
        </nav>
      )}
    </header>
  );
}
