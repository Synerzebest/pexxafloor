import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/metadata";
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    // Keep noindex pages crawlable so crawlers can read their directive.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
