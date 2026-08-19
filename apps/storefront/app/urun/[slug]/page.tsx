"use client";

import Image from "next/image";
import { notFound, useParams, useRouter } from "next/navigation";
import { MouseEvent, TouchEvent, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ProductRow } from "@/components/product-row";
import { ProductTitle } from "@/components/product-title";
import { useStore } from "@/components/store-provider";
import { formatTL, productGallery, products } from "@/data/catalog";

const reviews = [
  ["M*** K***", "Ürün çok hızlı ve özenli paketlenmişti. Beklentilerimi tamamen karşıladı."],
  ["N*** S***", "Kalitesi gerçekten çok iyi, günlük kullanımda oldukça başarılı."],
  ["S*** N***", "Orijinal kutusunda ve sağlam şekilde elime ulaştı. Tavsiye ederim."],
];

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const product = products.find((item) => item.id === slug);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [variant, setVariant] = useState("Standart Paket");
  const [following, setFollowing] = useState(false);
  const [touchX, setTouchX] = useState<number | null>(null);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });
  const { addCart, toggleFavorite, favorites } = useStore();

  if (!product) return notFound();

  const gallery = productGallery(product);
  const moveGallery = (direction: number) =>
    setGalleryIndex((current) => (current + direction + gallery.length) % gallery.length);
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

  return (
    <div className="container page detail-page trendy-detail">
      <div className="breadcrumb">Ana Sayfa <i className="fa-solid fa-chevron-right" /> {product.category} <i className="fa-solid fa-chevron-right" /> {product.name}</div>
      <div className="trendy-product-shell">
        <section className="trendy-gallery-column">
          <div className={`trendy-main-image ${zoom.active ? "is-zoomed" : ""}`} onMouseMove={handleZoom} onMouseLeave={() => setZoom((current) => ({ ...current, active: false }))} onTouchStart={(event) => setTouchX(event.touches[0]?.clientX ?? null)} onTouchEnd={handleTouchEnd}>
            <span className="gallery-campaign">YARIN KARGODA</span>
            <button className={`detail-favorite ${favorites.includes(product.id) ? "active" : ""}`} onClick={() => toggleFavorite(product.id)} aria-label="Favoriye ekle"><i className="fa-solid fa-heart" /></button>
            <Image key={gallery[galleryIndex]} src={gallery[galleryIndex]} width={560} height={560} priority style={{ transformOrigin: `${zoom.x}% ${zoom.y}%` }} alt={`${product.name} görünüm ${galleryIndex + 1}`} />
            <button className="gallery-prev" onClick={() => moveGallery(-1)} aria-label="Önceki görsel">‹</button>
            <button className="gallery-next" onClick={() => moveGallery(1)} aria-label="Sonraki görsel">›</button>
            <small>{galleryIndex + 1} / {gallery.length}</small>
          </div>
          <div className="trendy-thumbs">
            {gallery.map((image, index) => <button key={`${image}-${index}`} className={index === galleryIndex ? "active" : ""} onMouseEnter={() => setGalleryIndex(index)} onFocus={() => setGalleryIndex(index)} onClick={() => setGalleryIndex(index)}><Image src={image} width={64} height={64} alt={`Ürün görseli ${index + 1}`} /></button>)}
          </div>
        </section>

        <section className="trendy-buy-column">
          <div className="detail-heading"><h1><ProductTitle name={product.name} /></h1></div>
          <div className="trendy-rating"><b>{product.rating}</b><span>★★★★★</span><button>{product.reviewCount} Değerlendirme</button><button>42 Soru & Cevap</button></div>
          <div className="trendy-price">{product.price !== product.originalPrice && <del>{formatTL(product.originalPrice)}</del>}<strong>{formatTL(product.price)}</strong></div>
          <div className="trendy-benefit"><i className="fa-solid fa-truck-fast" /><b>Hızlı Teslimat</b> Yarın kargoda</div>
          <div className="trendy-campaigns">
            <h3>Ürünün Kampanyaları</h3>
            <button><i className="fa-solid fa-box" /><span><b>350 TL ve Üzeri Kargo Bedava</b>Satıcı karşılar</span><i className="fa-solid fa-chevron-right" /></button>
            <button><i className="fa-solid fa-tag" /><span><b>Sepette ekstra avantajlı fiyat</b>Fırsatı sepette gör</span><i className="fa-solid fa-chevron-right" /></button>
            <button><i className="fa-solid fa-credit-card" /><span><b>Peşin fiyatına 6 taksit</b>Seçili banka kartlarında</span><i className="fa-solid fa-chevron-right" /></button>
          </div>
          <div className="variants trendy-variants"><strong>Paket Seçimi</strong>{["Standart Paket", "Avantaj Paketi", "Premium Paket"].map((item) => <button className={variant === item ? "active" : ""} onClick={() => setVariant(item)} key={item}>{item}</button>)}</div>
          <div className="detail-actions trendy-actions"><div><small>Ödenecek Tutar</small><strong>{formatTL(product.price)}</strong></div><button className="buy" onClick={buyNow}><i className="fa-solid fa-bolt" />Hemen Al</button><button className="add" onClick={() => addCart(product)}><i className="fa-solid fa-cart-shopping" />Sepete Ekle</button></div>
          <div className="trendy-delivery-box"><i className="fa-solid fa-location-dot" /> Konumunu seç, tahmini teslimat tarihini öğren <i className="fa-solid fa-chevron-right" /></div>
          <h3 className="features-title">Öne Çıkan Özellikler</h3>
          <div className="trendy-features"><span>Garanti Süresi<b>2 Yıl</b></span><span>Stok Adedi<b>{product.stock} adet</b></span><span>Gönderim<b>Hızlı Teslimat</b></span><span>Garanti Tipi<b>Distribütör</b></span></div>
        </section>

        <aside className="trendy-seller-column">
          <article className="seller-card"><header><div><b>TeknoMarket</b><span>9.7</span><small>5,3M Takipçi</small></div><i className="fa-solid fa-circle-check" /></header><p><i className="fa-solid fa-truck-fast" /> Hızlı Satıcı</p><button onClick={() => setFollowing(!following)}><i className="fa-solid fa-store" />{following ? "Takip Ediliyor" : "Takip Et"}</button><button><i className="fa-solid fa-message" />Satıcı Soruları (1628)<i className="fa-solid fa-chevron-right" /></button><a href="/arama?q=TeknoMarket">MAĞAZAYA GİT <i className="fa-solid fa-chevron-right" /></a></article>
          <small className="other-seller-title">ÜRÜNÜN DİĞER SATICILARI</small>
          {["Vatan Bilgisayar", "BiDoluŞey"].map((seller, index) => <article className="other-seller" key={seller}><b>{seller} <em>{index ? "8.8" : "8.9"}</em></b><p><i className="fa-solid fa-truck-fast" /> Sipariş verirsen yarın kargoda!</p><small>Kargo Bedava</small><strong>{formatTL(product.price + (index + 1) * 250)}</strong></article>)}
        </aside>
      </div>

      <section className="trendy-description"><nav><button className="active">Ürün Bilgileri</button><button>Ürün Özellikleri</button><button>İade Koşulları</button></nav><div><h2><ProductTitle name={product.name} /></h2><p>Bu ürün, yüksek kalite standartlarına uygun olarak listelenmiştir. Güvenli alışveriş, hızlı teslimat ve kolay iade avantajlarıyla sunulur.</p><ul><li>Dayanıklı ve kaliteli malzeme</li><li>2 yıl garanti</li><li>14 gün içinde kolay iade</li><li>Güvenli ve özenli paketleme</li></ul></div></section>
      <ProductRow title="Benzer Ürünler" products={products.filter((item) => item.id !== product.id).slice(0, 6)} tone="blue" />

      <section className="trendy-reviews">
        <h2>Ürün Değerlendirmeleri</h2>
        <div className="review-summary"><span>★★★★★</span><b>{product.rating}</b><i /><strong>{product.reviewCount} Değerlendirme</strong><i /><strong>2977 Yorum</strong></div>
        <div className="review-grid"><article className="review-insight"><h3><i className="fa-solid fa-wand-magic-sparkles" /> Değerlendirme Özeti</h3><ul><li>Ürünün kalitesi ve hızlı teslimatı kullanıcılar tarafından beğeniliyor.</li><li>Paketleme ve kullanım kolaylığı olumlu değerlendiriliyor.</li></ul></article>{reviews.map(([user, text]) => <article className="review-card" key={user}><span>★★★★★</span><small>{user} · 22 Mayıs 2026</small><p>{text}</p><footer><b>TeknoMarket</b> satıcısından alındı <i className="fa-regular fa-thumbs-up" /></footer></article>)}</div>
        <button className="show-all">TÜM YORUMLARI GÖSTER <i className="fa-solid fa-chevron-right" /></button>
      </section>

      <section className="trendy-questions"><h2>Ürün Soru ve Cevapları</h2><nav>{["Tümü (578)", "Uyumluluk (430)", "Ürün İçeriği (29)", "Garanti Kapsamı (28)", "Kargo (15)"].map((item) => <button key={item}>{item} <i className="fa-solid fa-chevron-right" /></button>)}</nav><div>{["Ürün kutusunda garanti belgesi var mı?", "Hızlı teslimat hangi şehirlerde geçerli?", "Farklı renk seçeneği mevcut mu?"].map((question) => <article key={question}><b>{question}</b><small>M*** K*** · 14 Nisan 2026</small><p><BrandLogo className="inline-brand-logo" /> satıcısının cevabı</p><span>Merhaba, ürün açıklamasında belirtilen tüm özellikler gönderilen pakete dahildir.</span></article>)}</div></section>
    </div>
  );
}
