"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/", "fa-house", "Ana Sayfa"],
  ["/kategoriler", "fa-border-all", "Kategoriler"],
  ["/favoriler", "fa-heart", "Favorilerim"],
  ["/sepet", "fa-cart-shopping", "Sepetim"],
  ["/hesabim", "fa-user", "Hesabım"],
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/urun/") || pathname === "/sepet" || pathname === "/odeme") return null;
  return <nav className="mobile-bottom-nav" aria-label="Mobil ana menü">{items.map(([href, icon, label]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}><i className={`fa-solid ${icon}`} /><span>{label}</span></Link>)}</nav>;
}
