import { ProductCard } from "@/components/product-card";
import { HeroSlider } from "@/components/hero-slider";
import { products, quickLinks } from "@/data/home";

export default function HomePage() {
  return <>
    <main>
      <HeroSlider />
      <section className="quick-links" aria-label="Hızlı keşif">{quickLinks.map(([icon, label, tone]) => <a href="#urunler" key={label}><span className={tone}><i className={`fa-solid ${icon}`}/></span><strong>{label}</strong></a>)}</section>
      <section className="product-section" id="urunler">
        <div className="section-head"><div className="personal-title"><i className="fa-solid fa-wand-magic-sparkles"/><strong>ÇAĞLAR ERKÖSE, Sana Özel Ürünler</strong><span className="timer">23 : 53 : 56</span></div><a href="#tum-urunler">Tümünü Gör &gt;</a></div>
        <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id}/>)}</div>
      </section>
      <section className="benefits"><div><span><i className="fa-solid fa-rotate-left"/></span><strong>Kolay İade</strong><small>14 gün içinde ücretsiz</small></div><div><span><i className="fa-solid fa-lock"/></span><strong>Güvenli Ödeme</strong><small>256-bit SSL koruması</small></div><div><span><i className="fa-solid fa-truck-fast"/></span><strong>Hızlı Teslimat</strong><small>Türkiye’nin her yerine</small></div><div><span><i className="fa-solid fa-headset"/></span><strong>7/24 Destek</strong><small>Her zaman yanınızdayız</small></div></section>
    </main>
  </>;
}
