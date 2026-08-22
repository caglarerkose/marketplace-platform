"use client";

import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { useStore } from "@/components/store-provider";

export default function Favorites() {
  const { favorites, favoriteProducts } = useStore();
  const items = favoriteProducts.filter((product) => favorites.includes(product.id));
  return <div className="container page favorites-page"><div className="title"><h1>Favorilerim <span className="backend-check" title="Canlı veriye bağlı">✓</span></h1><p>Beğendiğin ürünleri burada saklayabilirsin.</p></div>{items.length ? <div className="vertical-grid favorites-grid">{items.map((product) => <ProductCard product={product} key={product.id} />)}</div> : <div className="empty"><i className="fa-regular fa-heart" /><h2>Favori listen henüz boş</h2><p>Beğendiğin ürünlerin kalp ikonuna dokunarak listeni oluştur.</p><Link href="/">Ürünleri Keşfet</Link></div>}</div>;
}
