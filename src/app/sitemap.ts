import type { MetadataRoute } from "next";
import { siteConfig } from "@/i18n/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: { fa: siteConfig.url, en: `${siteConfig.url}/en` } },
    },
    {
      url: `${siteConfig.url}/en`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: { fa: siteConfig.url, en: `${siteConfig.url}/en` } },
    },
  ];
}
