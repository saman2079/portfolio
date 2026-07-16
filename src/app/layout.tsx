import type { Metadata } from "next";
import { Vazirmatn, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/data/site";
import localFont from "next/font/local";

// Vazirmatn covers both display headings and body copy — a single,
// well-hinted variable Persian typeface avoids mismatched x-heights that


export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.role}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["برنامه‌نویس فرانت‌اند", "React", "Next.js", "TypeScript", "پرتفولیو"],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.role}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  robots: { index: true, follow: true },
};

const vazirmatn = localFont({
  src: [
    {
      path: "../fonts/Vazirmatn-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Vazirmatn-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

const mono = localFont({
  src: "../fonts/JetBrainsMono-Regular.woff2",
  variable: "--font-mono",
  weight: "400",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fa"
      // dir="rtl"
      className={`${vazirmatn.variable} ${mono.variable} ${mono.variable}`}
    >
      <body className="relative overflow-x-hidden">
        {/* base grid texture */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
        {/* ambient premium glows — soft, blurred color blobs behind everything */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 right-1/4 h-[32rem] w-[32rem] rounded-full bg-accent-blue/10 blur-[120px]" />
          <div className="absolute top-1/3 -left-40 h-[28rem] w-[28rem] rounded-full bg-accent-violet/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-accent-cyan/10 blur-[110px]" />
        </div>

        <Header />
        <main className="relative">{children}</main>
        <Footer />
      </body>
    </html>
  );
}