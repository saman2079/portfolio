import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import "../globals.css";
import { Header } from "@/components/layout/Header";
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
        {/* base grid texture */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
        {/* ambient glows — static, no blur animation, cheap to composite */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 end-1/4 h-[32rem] w-[32rem] rounded-full bg-accent-blue/10 blur-[120px]" />
          <div className="absolute top-1/3 -start-40 h-[28rem] w-[28rem] rounded-full bg-accent-violet/10 blur-[120px]" />
          <div className="absolute bottom-0 end-0 h-[24rem] w-[24rem] rounded-full bg-accent-cyan/10 blur-[110px]" />
        </div>

        <Header lang={lang} t={t} />
        <main className="relative">{children}</main>
        <Footer lang={lang} t={t} />
      </body>
    </html>
  );
}
