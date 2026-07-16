import { Github, Linkedin, Send } from "lucide-react";
import { siteConfig } from "@/data/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-600 bg-ink-900">
      {/* Status-bar strip — echoes VS Code's blue bottom bar, in the site's own accent. */}
      <div className="flex items-center justify-between bg-accent-blue px-6 py-1.5 font-mono text-[11px] font-medium text-ink-950">
        <span>main*</span>
        <span>{siteConfig.availability}</span>
        <span>UTF-8</span>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="font-mono text-xs text-paper-500">
          © {year} {siteConfig.name}. Built with Next.js &amp; Tailwind CSS.
        </p>

        <div className="flex items-center gap-4">
          <a
            href={siteConfig.social.github}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub"
            className="text-paper-500 transition-colors hover:text-paper-100"
          >
            <Github size={18} />
          </a>
          <a
            href={siteConfig.social.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="LinkedIn"
            className="text-paper-500 transition-colors hover:text-paper-100"
          >
            <Linkedin size={18} />
          </a>
          <a
            href={siteConfig.social.telegram}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Telegram"
            className="text-paper-500 transition-colors hover:text-paper-100"
          >
            <Send size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
