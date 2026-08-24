"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "./store-provider";
type NavItem = { label: string; target: string; icon: string; sortOrder: number; enabled: boolean };
const defaults: NavItem[] = [
  { target: "/", icon: "fa-house", label: "Anasayfa", sortOrder: 1, enabled: true },
  { target: "/kategoriler", icon: "fa-magnifying-glass", label: "Kategoriler", sortOrder: 2, enabled: true },
  { target: "/favoriler", icon: "fa-heart", label: "Favorilerim", sortOrder: 3, enabled: true },
  { target: "/sepet", icon: "fa-cart-shopping", label: "Sepetim", sortOrder: 4, enabled: true },
  { target: "/hesabim", icon: "fa-user", label: "Hesabım", sortOrder: 5, enabled: true },
];
export function MobileNav() {
  const p = usePathname(),
    { cart } = useStore(),
    [compact, setCompact] = useState(false),
    [items, setItems] = useState<NavItem[]>(defaults);
  useEffect(() => {
    void fetch("/api/mobile-settings").then(async (response) => {
      if (!response.ok) return;
      const result = await response.json();
      const navigation = result.settings?.navigation_items;
      if (Array.isArray(navigation)) setItems(navigation.filter((item: NavItem) => item.enabled).sort((a: NavItem, b: NavItem) => a.sortOrder - b.sortOrder));
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    const update = () => setCompact(window.scrollY > 110);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <nav className={`bottom-nav ${compact ? "compact" : ""}`}>
      {items.map((item) => (
        <Link className={p === item.target ? "active" : ""} href={item.target} key={item.target}>
          <i className={`fa-solid ${item.icon}`} />
          <span>{item.label}</span>
          {item.target === "/sepet" && cart.length > 0 && <b>{cart.length}</b>}
        </Link>
      ))}
    </nav>
  );
}
