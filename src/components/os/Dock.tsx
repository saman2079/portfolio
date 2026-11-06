"use client";

import { useEffect, useState } from "react";
import { Briefcase, Cpu, FlaskConical, FolderGit2, Home, Mail, User, type LucideIcon } from "lucide-react";
import type { NavLink } from "@/i18n/types";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  "#top": Home,
  "#about": User,
  "#lab": FlaskConical,
  "#experience": Briefcase,
  "#skills": Cpu,
  "#projects": FolderGit2,
  "#contact": Mail,
};

/**
 * Section navigation as an OS dock. Every item is a real link (keyboard and
 * screen-reader friendly) and always shows its short label, so nothing depends
 * on hover — it works identically on touch screens.
 */
export function Dock({ items, label }: { items: NavLink[]; label: string }) {
  const [active, setActive] = useState("#top");

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label={label}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <ul className="pointer-events-auto flex items-stretch gap-0.5 rounded-2xl border border-white/10 bg-ink-900/90 p-1 shadow-hud backdrop-blur-md sm:gap-1 sm:p-1.5">
        {items.map((item) => {
          const Icon = icons[item.href] ?? Home;
          const isActive = active === item.href;
          return (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "relative flex h-[3.25rem] w-[2.9rem] flex-col items-center justify-center gap-1 rounded-xl text-[10px] leading-none transition-colors sm:w-16 sm:text-[11px]",
                  isActive ? "bg-signal/10 text-signal" : "text-paper-500 hover:text-paper-100"
                )}
              >
                {isActive && (
                  <span aria-hidden className="absolute inset-x-3 top-0 h-px bg-signal shadow-signal" />
                )}
                <Icon size={18} aria-hidden />
                <span>{item.short}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
