"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HomeProduct } from "@/data/home";

const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export function ProductCard({ product }: { product: HomeProduct }) {
  const [favorite, setFavorite] = useState(false);
  return (
    <article className="product-card">
      <button className={`favorite ${favorite ? "active" : ""}`} onClick={() => setFavorite((value) => !value)} aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"} aria-pressed={favorite}><i className={`${favorite ? "fa-solid" : "fa-regular"} fa-heart`}/></button>
      <Link href={`/urun/${product.id}`} className="product-visual"><Image src={product.image} alt={product.name} fill sizes="(max-width:768px) 185px, 240px" /></Link>
      <span className={`badge ${product.badge.includes("İndirim") ? "discount" : product.badge.includes("Sepette") ? "cart-discount" : "advantage"}`}><i className={`fa-solid ${product.badge.includes("İndirim") ? "fa-arrow-down" : product.badge.includes("Sepette") ? "fa-basket-shopping" : "fa-bolt"}`}/>{product.badge}</span>
      <div className="product-body">
        <h3>{product.name}</h3>
        <div className="rating"><span>★</span> {product.rating} <small>({product.reviews})</small></div>
        <div className="price-row">{product.oldPrice && <del>{money.format(product.oldPrice / 100)}</del>}<strong>{money.format(product.price / 100)}</strong></div>
      </div>
    </article>
  );
}
