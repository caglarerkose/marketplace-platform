import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { products, quickLinks } from "@/data/home";

export default function HomePage() {
  return <>
    <SiteHeader />
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-content"><span className="eyebrow">BİŞEYEKSİK FIRSATLARI</span><h1 id="hero-title">Aradığın ne varsa<br/><em>hepsi burada.</em></h1><p>Sevdiğin markalarda kaçırılmayacak fiyatları keşfet.</p><a className="hero-cta" href="#urunler">Fırsatları İncele →</a></div>
        <div className="hero-art" aria-hidden="true"><span className="hero-orbit">%</span><div className="hero-bag">🛍️</div><span className="spark one">✦</span><span className="spark two">●</span></div>
        <div className="hero-count">1 / 5</div>
      </section>
      <section className="quick-links" aria-label="Hızlı keşif">{quickLinks.map(([icon, label]) => <a href="#urunler" key={label}><span>{icon}</span><strong>{label}</strong></a>)}</section>
      <section className="product-section" id="urunler">
        <div className="section-head"><div><span className="eyebrow orange">SANA ÖZEL</span><h2>Kaçırılmayacak fırsatlar</h2></div><a href="#tum-urunler">Tümünü Gör →</a></div>
        <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id}/>)}</div>
      </section>
      <section className="benefits"><div><span>↩</span><strong>Kolay İade</strong><small>14 gün içinde ücretsiz</small></div><div><span>🔒</span><strong>Güvenli Ödeme</strong><small>256-bit SSL koruması</small></div><div><span>🚚</span><strong>Hızlı Teslimat</strong><small>Türkiye’nin her yerine</small></div><div><span>☎</span><strong>7/24 Destek</strong><small>Her zaman yanınızdayız</small></div></section>
    </main>
  </>;
}
