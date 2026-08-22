import "server-only";
import type { Product } from "@/data/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OfferRow = {
  id: string;
  price: number;
  list_price: number | null;
  stores: { name: string } | null;
  product_variants: {
    title: string;
    catalog_products: {
      slug: string;
      id: string;
      title: string;
      description: string | null;
      product_media: { url: string; is_primary: boolean; sort_order: number }[];
      categories: { name: string; slug: string } | null;
    };
  };
};

export async function getActiveProducts(): Promise<Product[]> {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.from("seller_offers")
    .select("id,price,list_price,stores(name),product_variants!inner(title,catalog_products!inner(id,slug,title,description,status,product_media(url,is_primary,sort_order),categories(name,slug)))")
    .eq("status", "active")
    .eq("product_variants.catalog_products.status", "active")
    .order("price", { ascending: true });
  if (error) return [];

  return ((data || []) as unknown as OfferRow[]).map((offer) => {
    const catalog = offer.product_variants.catalog_products;
    const media = [...(catalog.product_media || [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
    const price = Number(offer.price);
    const originalPrice = offer.list_price ? Number(offer.list_price) : price;
    const discountPercent = originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : undefined;
    return {
      id: catalog.slug,
      offerId: offer.id,
      productId: catalog.id,
      name: catalog.title,
      image: media[0]?.url || "/img/urun.jpg",
      gallery: media.map((item) => item.url),
      category: catalog.categories?.name || "Kategori",
      categorySlug: catalog.categories?.slug,
      rating: 0,
      reviewCount: 0,
      priceMode: discountPercent ? "percent" : "normal",
      originalPrice,
      discountPercent,
      price,
      badge: discountPercent ? `%${discountPercent} İndirim` : "Yeni Ürün",
      stock: 0,
      sellerName: offer.stores?.name || "Mağaza",
      description: catalog.description || undefined,
      variantLabel: offer.product_variants.title,
    } satisfies Product;
  });
}
