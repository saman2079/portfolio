import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import "../globals.css";
import "../universe.css";
import { StatusBar } from "@/components/os/StatusBar";
import { Dock } from "@/components/os/Dock";
import { UniverseRoot } from "@/components/universe/UniverseRoot";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/i18n/site";
import { dirOf, isLocale, locales, pathFor, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

// Vazirmatn covers Persian and Latin glyphs, so one typeface serves both languages.
const vazirmatn = localFont({
  src: [
    { path: "../../fonts/vazir/Vazirmatn-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/vazir/Vazirmatn-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#05070C",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  if (!isLocale(params.lang)) return {};
  const t = getDictionary(params.lang);
  const canonical = `${siteConfig.url}${pathFor(params.lang) === "/" ? "" : pathFor(params.lang)}`;

  return {
    metadataBase: new URL(siteConfig.url),
    title: t.meta.title,
    description: t.meta.description,
    keywords: t.meta.keywords,
    authors: [{ name: t.name }],
    alternates: {
      canonical,
      languages: { fa: siteConfig.url, en: `${siteConfig.url}/en`, "x-default": siteConfig.url },
    },
    openGraph: {
      type: "website",
      locale: t.meta.ogLocale,
      url: canonical,
      title: t.meta.title,
      description: t.meta.description,
      siteName: t.name,
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang: Locale = params.lang;
  const t = getDictionary(lang);

  return (
    <html lang={lang} dir={dirOf(lang)} className={vazirmatn.variable}>
      <body className="relative overflow-x-hidden">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-paper-100"
        >
          {t.ui.skipToContent}
        </a>

        {/* base grid texture */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
        {/* ambient light: static gradients, no blur filters */}
        <div aria-hidden className="os-backdrop pointer-events-none fixed inset-0" />

        {/* 3D universe: loads lazily, only on capable devices; the 2D page is the fallback */}
        <UniverseRoot
          lang={lang}
          name={t.name}
          role={t.role}
          tagline={t.tagline}
          content={{
            about: t.about,
            lab: { title: t.lab.title, description: t.lab.description },
            experience: t.experience,
            skills: t.skills,
            projects: t.projects,
            contact: t.contact,
            ui: { liveDemo: t.ui.liveDemo, source: t.ui.source, downloadResume: t.ui.downloadResume },
          }}
        />

        <StatusBar lang={lang} t={t} />
        <main id="main" tabIndex={-1} className="relative outline-none">
          {children}
        </main>
        <Footer lang={lang} t={t} />
        <Dock items={t.nav} label={t.ui.navLabel} />
      </body>
    </html>
  );
}
