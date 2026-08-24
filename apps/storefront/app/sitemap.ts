import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const base = "https://marketplace-platform-storefront.vercel.app";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = await createSupabaseServerClient(),
    [products, categories, pages] = await Promise.all([
      client
        .from("catalog_products")
        .select("slug,updated_at")
        .eq("status", "active"),
      client
        .from("categories")
        .select("slug,updated_at")
        .eq("status", "active"),
      client
        .from("storefront_pages")
        .select("slug,updated_at")
        .eq("status", "published"),
    ]);
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...(categories.data || []).map((x) => ({
      url: `${base}/kategori/${x.slug}`,
      lastModified: new Date(x.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...(products.data || []).map((x) => ({
      url: `${base}/urun/${x.slug}`,
      lastModified: new Date(x.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...(pages.data || []).map((x) => ({
      url: `${base}/sayfa/${x.slug}`,
      lastModified: new Date(x.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
