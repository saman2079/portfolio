import { Download } from "lucide-react";
import { resumeFor, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface ResumeButtonProps {
  lang: Locale;
  label: string;
  variant?: "solid" | "ghost";
  className?: string;
}

/** Downloads the résumé that matches the page language (FA page → FA PDF, EN page → EN PDF). */
export function ResumeButton({ lang, label, variant = "solid", className }: ResumeButtonProps) {
  return (
    <a
      href={resumeFor(lang)}
      download
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-300",
        variant === "solid"
          ? "bg-accent-blue text-ink-950 shadow-glow hover:-translate-y-0.5 hover:shadow-[0_0_48px_-6px_rgba(97,175,239,0.6)]"
          : "border border-accent-blue/40 bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20",
        className
      )}
    >
      <Download size={16} className="transition-transform group-hover:translate-y-0.5" />
      {label}
    </a>
  );
}
