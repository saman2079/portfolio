"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        isScrolled ? "bg-ink-950/80 backdrop-blur-md border-b border-ink-600" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="#top"
          className="font-mono text-sm text-paper-100 transition-colors hover:text-accent-blue"
        >
          <span className="text-accent-green">const</span>{" "}
          <span className="text-accent-blue">dev</span>{" "}
          <span className="text-paper-300">=</span>{" "}
          <span className="text-accent-violet">&ldquo;{siteConfig.name}&rdquo;</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {siteConfig.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-mono text-sm text-paper-300 transition-colors hover:text-paper-100"
            >
              {item.label}
            </a>
          ))}
          <a
            href={`mailto:${siteConfig.email}`}
            className="rounded-md border border-accent-blue/40 bg-accent-blue/10 px-4 py-1.5 font-mono text-sm text-accent-blue transition-colors hover:bg-accent-blue/20"
          >
            Say hi
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((v) => !v)}
          className="text-paper-100 md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-ink-600 bg-ink-950 px-6 py-4 md:hidden">
          {siteConfig.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className="rounded px-2 py-2 font-mono text-sm text-paper-300 hover:bg-ink-800 hover:text-paper-100"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
