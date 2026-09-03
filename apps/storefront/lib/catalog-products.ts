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

  const { data: stockRows } = await client.rpc("search_active_offers", { p_query: null, p_category_slug: null, p_min_price: null, p_max_price: null, p_in_stock: false, p_sort: "newest", p_limit: 100, p_offset: 0 });
  const stocks = new Map<string, number>((stockRows || []).map((row: { offer_id: string; available_stock: number }) => [row.offer_id, Number(row.available_stock)]));

  const products = ((data || []) as unknown as OfferRow[]).map((offer) => {
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
      stock: stocks.get(offer.id) || 0,
      sellerName: offer.stores?.name || "Mağaza",
      description: catalog.description || undefined,
      variantLabel: offer.product_variants.title,
    } satisfies Product;
  });
  return applyCatalogRanking(products, "home");
}

type SearchRow = {
  offer_id:string; product_id:string; slug:string; title:string; description:string|null;
  variant_title:string; price:number; list_price:number|null; store_name:string;
  category_name:string; category_slug:string; image_url:string|null;
  available_stock:number; review_count:number; average_rating:number;
};

export async function searchActiveProducts(query: string): Promise<Product[]> {
  if (!query.trim()) return [];
  const client = await createSupabaseServerClient();
  const { data, error } = await client.rpc("search_active_offers", {
    p_query: query.trim(), p_category_slug: null, p_min_price: null, p_max_price: null,
    p_in_stock: false, p_sort: "relevance", p_limit: 100, p_offset: 0,
  });
  if (error) return [];
  const products = ((data || []) as SearchRow[]).map(row => {
    const price=Number(row.price),originalPrice=row.list_price?Number(row.list_price):price;
    const discountPercent=originalPrice>price?Math.round((1-price/originalPrice)*100):undefined;
    return {id:row.slug,offerId:row.offer_id,productId:row.product_id,name:row.title,image:row.image_url||"/img/urun.jpg",gallery:row.image_url?[row.image_url]:[],category:row.category_name,categorySlug:row.category_slug,rating:Number(row.average_rating),reviewCount:Number(row.review_count),priceMode:discountPercent?"percent":"normal",originalPrice,discountPercent,price,badge:discountPercent?`%${discountPercent} İndirim`:"Yeni Ürün",stock:Number(row.available_stock),sellerName:row.store_name,description:row.description||undefined,variantLabel:row.variant_title} satisfies Product;
  });
  return applyCatalogRanking(products, "search");
}

export async function applyCatalogRanking(products: Product[], placement: "home"|"category"|"search", categorySlug?: string): Promise<Product[]> {
  const client=await createSupabaseServerClient();
  const {data}=await client.from("catalog_ranking_rules").select("product_id,priority,categories(slug)").eq("placement",placement).eq("status","active").order("priority");
  const rules=(data||[]).filter(rule=>placement!=="category"||(rule.categories as unknown as {slug:string}|null)?.slug===categorySlug);
  const priorities=new Map(rules.map(rule=>[rule.product_id,Number(rule.priority)]));
  return products.map((product,index)=>({product,index})).sort((a,b)=>(priorities.get(a.product.productId||"")??100000)-(priorities.get(b.product.productId||"")??100000)||a.index-b.index).map(item=>item.product);
}
