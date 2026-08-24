import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// Per-domain robots.txt — allows crawling and points to this domain's sitemap.
export default function robots(): MetadataRoute.Robots {
  const host = headers().get("host") ?? "";
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: host ? `https://${host}/sitemap.xml` : undefined,
  };
}
