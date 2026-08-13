"use client";

import { FormEvent, useState } from "react";
import { categories } from "@/data/home";

export function SiteHeader() {
  const [query, setQuery] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); }
  return <>
    <div className="topbar"><div><span><i className="fa-solid fa-mobile-screen-button"/> App’i İndir, Özel Kuponları Kaçırma!</span><a className="discount-link" href="#urunler">İndirimli Ürünlere Git</a></div><nav aria-label="Yardımcı menü"><a href="#yardim">Yardım & Destek</a><a href="#kampanyalar">Kampanyalar</a><a href="#satici">Satıcı Ol</a></nav></div>
    <header className="site-header">
      <a className="logo" href="/" aria-label="BişeyEksik ana sayfa"><img className="logo-icon" src="/img/sepet.png" alt=""/><img className="logo-wordmark" src="/img/anayazi.png" alt="BişeyEksik"/></a>
      <form className="search" role="search" onSubmit={submit}><span aria-hidden="true"><i className="fa-solid fa-magnifying-glass"/></span><label className="sr-only" htmlFor="site-search">Ürün ara</label><input id="site-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Görselle Ara"/><button>Ara</button></form>
      <nav className="actions" aria-label="Hesap işlemleri"><a href="#favoriler"><i className="fa-regular fa-heart"/><span>Favorilerim</span></a><a href="#hesap"><i className="fa-solid fa-user"/><span>Hesabım</span></a><a href="#sepet"><i className="fa-solid fa-cart-shopping"/><span>Sepetim</span></a></nav>
    </header>
    <nav className="categories" aria-label="Ürün kategorileri"><button className="all-categories"><i className="fa-solid fa-bars"/> Tüm Kategoriler</button>{categories.map((category, index) => <a href="#urunler" key={`${category}-${index}`}>{category}</a>)}</nav>
  </>;
}
