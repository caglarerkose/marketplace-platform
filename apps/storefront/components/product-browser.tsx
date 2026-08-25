"use client";
import { useMemo, useState } from "react";
import { ProductCard } from "./product-card";
import { productFlags, type Product } from "@/data/catalog";
type Filter = "all" | "fast" | "free" | "discount";
type Sort = "default" | "price-low" | "price-high" | "rating-high";
export function ProductBrowser({
  items,
  title,
  description,
}: {
  items: Product[];
  title: string;
  description: string;
}) {
  const [filter, setFilter] = useState<Filter>("all"),
    [sort, setSort] = useState<Sort>("default");
  const result = useMemo(() => {
    const filtered = items.filter((p) => {
      const f = productFlags(p);
      return (
        filter === "all" ||
        (filter === "fast" && f.isFastDelivery) ||
        (filter === "free" && f.isFreeShipping) ||
        (filter === "discount" && f.hasDiscount)
      );
    });
    if (sort === "price-low")
      return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "price-high")
      return [...filtered].sort((a, b) => b.price - a.price);
    if (sort === "rating-high")
      return [...filtered].sort((a, b) => b.reviewCount - a.reviewCount);
    return filtered;
  }, [items, filter, sort]);
  return (
    <div className="container page">
      <div className="title">
          <h1>
            {title}{" "}

          </h1>
        <p>{description}</p>
      </div>
      <div className="toolbar">
        <strong>{result.length} ürün listeleniyor</strong>
        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
          >
            <option value="all">Tümü</option>
            <option value="fast">Hızlı Teslimat</option>
            <option value="free">Kargo Bedava</option>
            <option value="discount">İndirimli Ürünler</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            <option value="default">Varsayılan Sıralama</option>
            <option value="price-low">Fiyat: Artan</option>
            <option value="price-high">Fiyat: Azalan</option>
            <option value="rating-high">En Çok Yorum Alan</option>
          </select>
        </div>
      </div>
      {result.length ? (
        <div className="vertical-grid">
          {result.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <i className="fa-solid fa-magnifying-glass" />
          <h2>Ürün bulunamadı</h2>
          <p>Filtreyi değiştirerek yeniden deneyebilirsiniz.</p>
        </div>
      )}
    </div>
  );
}
