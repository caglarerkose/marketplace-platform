import { Hero } from "@/components/hero";
import { ProductRow } from "@/components/product-row";
import { ProductCard } from "@/components/product-card";
import { getActiveProducts } from "@/lib/catalog-products";
import { getActiveAd } from "@/lib/ads";
import Link from "next/link";
import { StorefrontEditBridge } from "@/components/storefront-edit-bridge";
export default async function Home() {
  const [products, ad] = await Promise.all([
    getActiveProducts(),
    getActiveAd("home_promo"),
  ]);
  return (
    <div className="home container">
      <StorefrontEditBridge />
      <Hero />
      {products.length > 0 && (
        <>
          <ProductRow
            title="Kaçırılmayacak fırsatlar"
            products={products.slice(0, 7)}
          />
          <ProductRow
            title="Öne Çıkan Ürünler"
            products={
              products.slice(7, 14).length
                ? products.slice(7, 14)
                : products.slice(0, 7)
            }
            tone="blue"
          />
        </>
      )}
      <section className="promo">
        <div>
          <small>{ad?.label || "SERİ SONU"}</small>
          <h2>{ad?.title || "İNDİRİMLERİ"}</h2>
          <p>{ad?.body || "Seçili ürünlerde avantajlı fiyatları kaçırma."}</p>
          <Link href={ad ? (ad.target.startsWith("/") ? ad.target : `/arama?q=${encodeURIComponent(ad.target)}`) : "/arama?q=firsat"}>
            Fırsatları İncele
          </Link>
        </div>
      </section>
      <section className="all-products">
        <header>
          <h2>
            Tüm Ürünler{" "}

          </h2>
          <p>Senin için seçtiğimiz fırsatları keşfet</p>
        </header>
        {products.length ? (
          <div>
            {products.map((p) => (
              <ProductCard key={`${p.id}-${p.price}`} product={p} />
            ))}
          </div>
        ) : (
          <div className="storefront-empty-products">
            <i className="fa-solid fa-box-open" />
            <h3>Aktif ürün bulunmuyor</h3>
            <p>Onaylanan ürünler burada yayınlanacak.</p>
          </div>
        )}
      </section>
      <div className="bank-strip">
        <span>VISA</span>
        <span>Mastercard</span>
        <span>Maximum</span>
        <span>World</span>
        <span>Bonus</span>
        <span>Axess</span>
      </div>
    </div>
  );
}
