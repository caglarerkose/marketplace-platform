"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { categories } from "@/data/home";

const dropdown = [
  ["fa-laptop", "Elektronik"], ["fa-house", "Ev & Yaşam"], ["fa-shirt", "Moda"],
  ["fa-baby", "Anne & Çocuk"], ["fa-spray-can-sparkles", "Kozmetik"],
  ["fa-car", "Oto & Yapı"], ["fa-screwdriver-wrench", "Hırdavat"], ["fa-tags", "Süper Fırsatlar"],
] as const;

export function SiteHeader() {
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const isProductDetail = pathname.startsWith("/urun/");
  const visibleCategories = isProductDetail ? ["Süper Fırsatlar", ...categories.filter((item) => item !== "Süper Fırsatlar")] : categories;
  function submit(event: FormEvent) { event.preventDefault(); }
  return <div className={`market-header-shell ${isProductDetail ? "context-product" : "context-default"}`}>
    <div className="topbar"><div><span><i className="fa-solid fa-mobile-screen-button"/> App’i İndir, Özel Kuponları Kaçırma!</span><a className="discount-link" href="#urunler">İndirimli Ürünlere Git</a></div><nav aria-label="Yardımcı menü"><a href="#yardim">Yardım & Destek</a><a href="#kampanyalar">Kampanyalar</a><a href="#satici">Satıcı Ol</a></nav></div>
    <header className="site-header">
      <button className="mobile-leading" type="button" aria-label={isProductDetail ? "Geri dön" : "Menüyü aç"} onClick={() => isProductDetail ? router.back() : router.push("/kategoriler")}><i className={`fa-solid ${isProductDetail ? "fa-arrow-left" : "fa-bars"}`}/></button>
      <Link className="logo" href="/" aria-label="BişeyEksik ana sayfa"><img className="logo-icon" src="/img/sepet.png" alt=""/><img className="logo-wordmark" src="/img/anayazi.png" alt="BişeyEksik"/></Link>
      <form className="search" role="search" onSubmit={submit}><span aria-hidden="true"><i className="fa-solid fa-magnifying-glass"/></span><label className="sr-only" htmlFor="site-search">Ürün ara</label><input id="site-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isProductDetail ? "Sizin neyiniz eksik?" : "Ürün, kategori veya marka ara"}/><button className="desktop-search-button">Ara</button><button className="mobile-camera-button" type="button" aria-label="Görselle ara"><i className="fa-solid fa-camera"/></button></form>
      <nav className="actions" aria-label="Hesap işlemleri"><Link href="/favoriler"><i className="fa-regular fa-heart"/><span>Favorilerim</span></Link><Link href="/hesabim"><i className="fa-solid fa-user"/><span>Hesabım</span></Link><Link href="/sepet"><i className="fa-solid fa-cart-shopping"/><span>Sepetim</span></Link></nav>
      <nav className="mobile-context-actions" aria-label="Mobil işlemler">{isProductDetail ? <><Link href="/sepet" aria-label="Sepet"><i className="fa-solid fa-cart-shopping"/></Link><button type="button" aria-label="Paylaş"><i className="fa-solid fa-share-nodes"/></button><Link href="/favoriler" aria-label="Favoriler"><i className="fa-solid fa-heart"/></Link></> : <><button type="button" aria-label="Mesajlar"><i className="fa-solid fa-message"/></button><button className="notification-action" type="button" aria-label="Bildirimler"><i className="fa-solid fa-bell"/><span/></button></>}</nav>
    </header>
    <div className="category-row"><div className="all-categories-wrap"><button className="all-categories"><i className="fa-solid fa-bars"/> Tüm Kategoriler</button><div className="category-dropdown">{dropdown.map(([icon,label])=><Link href={`/kategori/${encodeURIComponent(label.toLocaleLowerCase("tr-TR"))}`} key={label}><i className={`fa-solid ${icon}`}/>{label}</Link>)}</div></div><nav className="categories" aria-label="Ürün kategorileri">{visibleCategories.map((category, index) => <Link className={isProductDetail && index === 0 ? "active" : ""} href={`/kategori/${encodeURIComponent(category.toLocaleLowerCase("tr-TR"))}`} key={`${category}-${index}`}>{category}</Link>)}</nav></div>
  </div>;
}
