"use client";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/catalog";
import { formatTL } from "@/data/catalog";
import { useState } from "react";
import { useStore } from "./store-provider";
import { ProductTitle } from "./product-title";

export function ProductCard({ product }: { product: Product }) {
  const { favorites, toggleFavorite } = useStore();
  const [image, setImage] = useState(product.image || "/img/urun.jpg");
  return <article className={`product-card mode-${product.priceMode}`}>
    <button className={favorites.includes(product.id) ? "fav active" : "fav"} onClick={() => toggleFavorite(product)} aria-label="Favoriye ekle"><i className="fa-solid fa-heart" /></button>
    <Link href={`/urun/${product.id}`}>
      <Image className="product-img" src={image} width={260} height={260} alt={product.name} onError={() => setImage("/img/urun.jpg")} />
      <span className="product-badge"><i className={`fa-solid ${product.priceMode === "percent" ? "fa-arrow-down" : product.priceMode === "cart-discount" ? "fa-basket-shopping" : "fa-bolt"}`} />{product.badge}</span>
      <div className="product-info"><h3><ProductTitle name={product.name} /></h3>{product.sellerName && <p className="shipping">{product.sellerName}</p>}<div className="price">{product.price !== product.originalPrice && <del>{formatTL(product.originalPrice)}</del>}<strong>{formatTL(product.price)}</strong></div></div>
    </Link>
  </article>;
}
