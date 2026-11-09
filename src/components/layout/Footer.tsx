import { Github, Mail, Send } from "lucide-react";
import { siteConfig } from "@/i18n/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

export function Footer({ t }: { lang: Locale; t: Dictionary }) {
  const year = new Date().getFullYear();
  const linkClass = "text-paper-500 transition-colors hover:text-paper-100";

  return (
    <footer className="border-t border-ink-600 bg-ink-900">
      {/* Status-bar strip — echoes VS Code's blue bottom bar. */}
      <div
        dir="ltr"
        className="flex items-center justify-between gap-3 bg-signal px-5 py-1.5 font-mono text-[11px] font-medium text-ink-950 sm:px-6"
      >
        <span>main*</span>
        <span className="truncate">{t.availability}</span>
        <span>UTF-8</span>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 pb-28 pt-8 sm:flex-row">
        <p className="text-center text-xs text-paper-500">
          © {year} {t.name} · {t.footer.built}
          <br />
          <a
            href="https://sketchfab.com/3d-models/sci-fi-spaceship-cockpit-02-c6825892999242319c1a29326c4e7713"
            target="_blank"
            rel="noreferrer noopener"
            dir="ltr"
            className="underline-offset-2 hover:underline"
          >
            3D model "Sci-fi Spaceship Cockpit 02" by NotARealStudio — CC BY 4.0
          </a>
          {" · "}
          <a
            href="https://sketchfab.com/3d-models/space-vector-exploration-interior-redesign-0630b4fcda0845679432568b449a0490"
            target="_blank"
            rel="noreferrer noopener"
            dir="ltr"
            className="underline-offset-2 hover:underline"
          >
            3D model "Space Vector Exploration, Interior Redesign" by ReiSakisaka — CC BY 4.0
          </a>
          {" · "}
          <a
            href="https://sketchfab.com/3d-models/various-planets-73c6c24e7c40409cafc6adacd5d71ff5"
            target="_blank"
            rel="noreferrer noopener"
            dir="ltr"
            className="underline-offset-2 hover:underline"
          >
            3D model "Various Planets" by feivelyn — CC BY 4.0
          </a>
        </p>

        <div className="flex items-center gap-5">
          <a href={siteConfig.social.github} target="_blank" rel="noreferrer noopener" aria-label="GitHub" className={linkClass}>
            <Github size={18} />
          </a>
          <a href={siteConfig.social.telegram} target="_blank" rel="noreferrer noopener" aria-label="Telegram" className={linkClass}>
            <Send size={18} />
          </a>
          <a href={`mailto:${siteConfig.email}`} aria-label="Email" className={linkClass}>
            <Mail size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
