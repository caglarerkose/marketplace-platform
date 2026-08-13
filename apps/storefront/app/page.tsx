import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { HeroSlider } from "@/components/hero-slider";
import { products, quickLinks } from "@/data/home";

export default function HomePage() {
  return <>
    <SiteHeader />
    <main>
      <HeroSlider />
      <section className="quick-links" aria-label="Hızlı keşif">{quickLinks.map(([icon, label]) => <a href="#urunler" key={label}><span>{icon}</span><strong>{label}</strong></a>)}</section>
      <section className="product-section" id="urunler">
        <div className="section-head"><div><span className="eyebrow orange">SANA ÖZEL</span><h2>Kaçırılmayacak fırsatlar</h2></div><a href="#tum-urunler">Tümünü Gör →</a></div>
        <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id}/>)}</div>
      </section>
      <section className="benefits"><div><span>↩</span><strong>Kolay İade</strong><small>14 gün içinde ücretsiz</small></div><div><span>🔒</span><strong>Güvenli Ödeme</strong><small>256-bit SSL koruması</small></div><div><span>🚚</span><strong>Hızlı Teslimat</strong><small>Türkiye’nin her yerine</small></div><div><span>☎</span><strong>7/24 Destek</strong><small>Her zaman yanınızdayız</small></div></section>
    </main>
  </>;
}
