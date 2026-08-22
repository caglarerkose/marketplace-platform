"use client";

import Image from "next/image";
import { notFound, useParams, useRouter } from "next/navigation";
import { MouseEvent, TouchEvent, useEffect, useState } from "react";
import { ProductRow } from "@/components/product-row";
import { ProductTitle } from "@/components/product-title";
import { useStore } from "@/components/store-provider";
import { formatTL, productGallery, type Product } from "@/data/catalog";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null | undefined>();
  const [related, setRelated] = useState<Product[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });
  const { addCart, toggleFavorite, favorites } = useStore();

  useEffect(() => {
    let active = true;
    fetch(`/api/catalog-products/${encodeURIComponent(slug)}`).then(async (response) => {
      const result = await response.json();
      if (!active) return;
      if (!response.ok) { setProduct(null); return; }
      setProduct(result.product); setRelated(result.related || []);
    }).catch(() => { if (active) setProduct(null); });
    return () => { active = false; };
  }, [slug]);

  if (product === undefined) return <div className="container page"><div className="empty"><i className="fa-solid fa-spinner fa-spin" /><h2>Ürün yükleniyor</h2></div></div>;
  if (product === null) return notFound();

  const gallery = productGallery(product);
  const moveGallery = (direction: number) => setGalleryIndex((current) => (current + direction + gallery.length) % gallery.length);
  const buyNow = () => { addCart(product); router.push("/odeme"); };
  const handleTouchEnd = (event: TouchEvent) => {
    if (touchX === null) return;
    const distance = (event.changedTouches[0]?.clientX ?? touchX) - touchX;
    if (Math.abs(distance) > 45) moveGallery(distance < 0 ? 1 : -1);
    setTouchX(null);
  };
  const handleZoom = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setZoom({ active: true, x: ((event.clientX - bounds.left) / bounds.width) * 100, y: ((event.clientY - bounds.top) / bounds.height) * 100 });
  };

  return <div className="container page detail-page trendy-detail">
    <div className="breadcrumb">Ana Sayfa <i className="fa-solid fa-chevron-right" /> {product.category} <i className="fa-solid fa-chevron-right" /> {product.name}</div>
    <div className="trendy-product-shell">
      <section className="trendy-gallery-column">
        <div className={`trendy-main-image ${zoom.active ? "is-zoomed" : ""}`} onMouseMove={handleZoom} onMouseLeave={() => setZoom((current) => ({ ...current, active: false }))} onTouchStart={(event) => setTouchX(event.touches[0]?.clientX ?? null)} onTouchEnd={handleTouchEnd}>
          <button className={`detail-favorite ${favorites.includes(product.id) ? "active" : ""}`} onClick={() => toggleFavorite(product)} aria-label="Favoriye ekle"><i className="fa-solid fa-heart" /></button>
          <Image key={gallery[galleryIndex]} src={gallery[galleryIndex]} width={560} height={560} priority style={{ transformOrigin: `${zoom.x}% ${zoom.y}%` }} alt={`${product.name} görünüm ${galleryIndex + 1}`} />
          {gallery.length > 1 && <><button className="gallery-prev" onClick={() => moveGallery(-1)} aria-label="Önceki görsel">‹</button><button className="gallery-next" onClick={() => moveGallery(1)} aria-label="Sonraki görsel">›</button></>}
          <small>{galleryIndex + 1} / {gallery.length}</small>
        </div>
        {gallery.length > 1 && <div className="trendy-thumbs">{gallery.map((image, index) => <button key={`${image}-${index}`} className={index === galleryIndex ? "active" : ""} onMouseEnter={() => setGalleryIndex(index)} onFocus={() => setGalleryIndex(index)} onClick={() => setGalleryIndex(index)}><Image src={image} width={64} height={64} alt={`Ürün görseli ${index + 1}`} /></button>)}</div>}
      </section>
      <section className="trendy-buy-column">
        <div className="detail-heading"><h1><ProductTitle name={product.name} /></h1></div>
        <div className="trendy-price">{product.price !== product.originalPrice && <del>{formatTL(product.originalPrice)}</del>}<strong>{formatTL(product.price)}</strong></div>
        {product.variantLabel && <div className="variants trendy-variants"><strong>Varyant</strong><button className="active">{product.variantLabel}</button></div>}
        <div className="detail-actions trendy-actions"><div><small>Ürün Fiyatı</small><strong>{formatTL(product.price)}</strong></div><button className="buy" onClick={buyNow}><i className="fa-solid fa-bolt" />Hemen Al</button><button className="add" onClick={() => addCart(product)}><i className="fa-solid fa-cart-shopping" />Sepete Ekle</button></div>
      </section>
      <aside className="trendy-seller-column"><article className="seller-card"><header><div><b>{product.sellerName || "Mağaza"}</b><small>Onaylı mağaza</small></div><i className="fa-solid fa-circle-check" /></header></article></aside>
    </div>
    <section className="trendy-description"><nav><button className="active">Ürün Bilgileri</button></nav><div><h2><ProductTitle name={product.name} /></h2><p>{product.description || "Bu ürün için açıklama girilmemiştir."}</p></div></section>
    {related.length > 0 && <ProductRow title="Benzer Ürünler" products={related} tone="blue" />}
  </div>;
}
