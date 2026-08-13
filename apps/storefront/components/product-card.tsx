"use client";

import { useState } from "react";
import type { HomeProduct } from "@/data/home";

const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export function ProductCard({ product }: { product: HomeProduct }) {
  const [favorite, setFavorite] = useState(false);
  return (
    <article className="product-card">
      <button className={`favorite ${favorite ? "active" : ""}`} onClick={() => setFavorite((value) => !value)} aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"} aria-pressed={favorite}>♥</button>
      <div className={`product-visual ${product.tone}`} aria-hidden="true">{product.emoji}</div>
      <span className="badge">{product.badge}</span>
      <div className="product-body">
        <h3>{product.name}</h3>
        <div className="rating"><span>★</span> {product.rating} <small>({product.reviews})</small></div>
        <div className="price-row">{product.oldPrice && <del>{money.format(product.oldPrice / 100)}</del>}<strong>{money.format(product.price / 100)}</strong></div>
      </div>
    </article>
  );
}
