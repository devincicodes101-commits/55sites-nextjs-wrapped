import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getSiteConfig } from "@/lib/sites/registry";

// Per-domain sitemap so Google can discover + index every city site's pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const host = headers().get("host") ?? "";
  const base = `https://${host}`;
  const site = getSiteConfig();
  const now = new Date();

  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/areas`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  for (const svc of site.services ?? []) {
    if (svc.slug) {
      urls.push({
        url: `${base}/services/${svc.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return urls;
}
