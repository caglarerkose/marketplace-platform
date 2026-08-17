"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation } from "@/data/admin";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
      <header className="topbar">
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <span className="brand-mark">➜</span><span>bişey<span>eksik</span></span><small>admin</small>
        </Link>
        <div className="top-search"><span>⌕</span><input aria-label="Panelde ara" placeholder="Sipariş, satıcı veya ürün ara" /></div>
        <div className="top-actions">
          <button aria-label="Bildirimler" className="icon-button">♢<b>12</b></button>
          <button aria-label="Mesajlar" className="icon-button">✉<b>5</b></button>
          <div className="admin-profile"><span>A</span><div><strong>Admin</strong><small>Sistem Yöneticisi</small></div></div>
          <button aria-label="Menüyü aç" className="menu-button" onClick={() => setOpen(!open)}>☰</button>
        </div>
      </header>
      <aside className={open ? "sidebar open" : "sidebar"}>
        <p className="nav-title">YÖNETİM</p>
        <nav>
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return <Link className={active ? "nav-link active" : "nav-link"} href={item.href} key={item.href} onClick={() => setOpen(false)}><i>{item.icon}</i><span>{item.label}</span>{item.badge ? <b>{item.badge}</b> : null}</Link>;
          })}
        </nav>
        <div className="side-promo"><small>YENİ ÖZELLİK</small><strong>Gelişmiş Raporlar</strong><p>Satış ve performans verilerinizi tek ekrandan inceleyin.</p><Link href="/raporlar">Keşfet</Link></div>
        <div className="support"><strong>7/24 Yönetici Desteği</strong><span>destek@biseyeksik.com</span></div>
      </aside>
      {open && <button aria-label="Menüyü kapat" className="backdrop" onClick={() => setOpen(false)} />}
      <main>{children}</main>
    </div>
  );
}
