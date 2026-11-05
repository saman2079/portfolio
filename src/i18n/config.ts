export const locales = ["fa", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fa";

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const dirOf = (locale: Locale) => (locale === "fa" ? "rtl" : "ltr");

/** Persian lives at "/" (rewritten to /fa), English at "/en". */
export const pathFor = (locale: Locale) => (locale === "fa" ? "/" : "/en");

export const resumeFor = (locale: Locale) =>
  locale === "fa"
    ? "/resume/Saman-Sadegh-Elahi-Resume-FA.pdf"
    : "/resume/Saman-Sadegh-Elahi-Resume-EN.pdf";
