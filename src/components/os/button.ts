import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "ghost" | "outline";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-signal text-ink-950 shadow-signal hover:-translate-y-0.5 hover:shadow-[0_0_48px_-6px_rgba(94,230,214,0.65)]",
  ghost: "border border-signal/40 bg-signal/10 text-signal hover:bg-signal/20",
  outline: "border border-white/15 bg-white/5 text-paper-100 hover:bg-white/10",
};

/** One source of truth for button styling, usable on <a> and <button>. */
export function buttonClasses(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "group inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-300",
    variants[variant],
    className
  );
}
