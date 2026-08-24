import type { MetadataRoute } from "next";
import { getSeoSettings } from "@/lib/seo-settings";
const base = "https://marketplace-platform-storefront.vercel.app";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSeoSettings();
  return {
    rules:
      settings?.index_enabled === false
        ? { userAgent: "*", disallow: "/" }
        : {
            userAgent: "*",
            allow: "/",
            disallow: ["/hesabim", "/odeme", "/api/"],
          },
    sitemap: `${base}/sitemap.xml`,
  };
}
