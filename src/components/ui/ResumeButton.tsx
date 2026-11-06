import { Download } from "lucide-react";
import { resumeFor, type Locale } from "@/i18n/config";
import { buttonClasses, type ButtonVariant } from "@/components/os/button";

interface ResumeButtonProps {
  lang: Locale;
  label: string;
  variant?: ButtonVariant;
  className?: string;
}

/** Downloads the résumé that matches the page language (FA page → FA PDF, EN page → EN PDF). */
export function ResumeButton({ lang, label, variant = "primary", className }: ResumeButtonProps) {
  return (
    <a href={resumeFor(lang)} download className={buttonClasses(variant, className)}>
      <Download size={16} aria-hidden className="transition-transform group-hover:translate-y-0.5" />
      {label}
    </a>
  );
}
