"use client";

import { FormEvent, useState } from "react";
import { categories } from "@/data/home";

export function SiteHeader() {
  const [query, setQuery] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); }
  return <>
    <div className="topbar"><span>📱 App’i İndir, Özel Kuponları Kaçırma!</span><nav aria-label="Yardımcı menü"><a href="#kampanyalar">Kampanyalar</a><a href="#yardim">Yardım & Destek</a><a href="#satici">Satıcı Ol</a></nav></div>
    <header className="site-header">
      <a className="logo" href="/" aria-label="BişeyEksik ana sayfa"><span className="logo-mark">✓</span><span>bişey<span>eksik</span></span></a>
      <form className="search" role="search" onSubmit={submit}><span aria-hidden="true">⌕</span><label className="sr-only" htmlFor="site-search">Ürün ara</label><input id="site-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün, kategori veya marka ara"/><button>Ara</button></form>
      <nav className="actions" aria-label="Hesap işlemleri"><a href="#favoriler">♡ <span>Favorilerim</span></a><a href="#hesap">♙ <span>Hesabım</span></a><a href="#sepet">🛒 <span>Sepetim</span></a></nav>
    </header>
    <nav className="categories" aria-label="Ürün kategorileri"><button className="all-categories">☰ Tüm Kategoriler</button>{categories.map((category) => <a href="#urunler" key={category}>{category}</a>)}</nav>
  </>;
}
