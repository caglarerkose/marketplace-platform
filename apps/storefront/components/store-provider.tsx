"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/data/catalog";

export type CartItem = { product: Product; quantity: number; selected: boolean };
type ShoppingState = { cart: CartItem[]; favorites: string[]; favoriteProducts: Product[] };
type Store = {
  cart: CartItem[]; favorites: string[]; favoriteProducts: Product[];
  addCart: (product: Product) => void; removeCart: (id: string) => void;
  quantity: (id: string, delta: number) => void; toggleSelected: (id: string) => void;
  selectAll: (selected: boolean) => void; toggleFavorite: (product: Product | string) => void;
  toast: string; clearToast: () => void; lastAdded: Product | null; closeAdded: () => void;
};
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [toast, setToast] = useState("");
  const [lastAdded, setLastAdded] = useState<Product | null>(null);
  const authenticated = useRef(false);
  const hydrated = useRef(false);

  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 1800); };
  const sync = (body: Record<string, unknown>) => {
    if (!authenticated.current) return;
    void fetch("/api/customer/shopping-state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then((response) => { if (!response.ok) flash("İşlem kaydedilemedi."); })
      .catch(() => flash("İşlem kaydedilemedi."));
  };

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("bx-cart") || "[]"));
      setFavorites(JSON.parse(localStorage.getItem("bx-favorites") || "[]"));
      setFavoriteProducts(JSON.parse(localStorage.getItem("bx-favorite-products") || "[]"));
    } catch { /* Bozuk tarayıcı verisi alışveriş akışını engellememeli. */ }
    void fetch("/api/customer/shopping-state").then(async (response) => {
      if (!response.ok) return;
      const state = (await response.json()) as ShoppingState;
      authenticated.current = true;
      setCart(state.cart); setFavorites(state.favorites); setFavoriteProducts(state.favoriteProducts);
    }).finally(() => { hydrated.current = true; });
  }, []);

  useEffect(() => { if (hydrated.current) localStorage.setItem("bx-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem("bx-favorites", JSON.stringify(favorites));
    localStorage.setItem("bx-favorite-products", JSON.stringify(favoriteProducts));
  }, [favorites, favoriteProducts]);

  const toggleFavorite = (product: Product | string) => {
    const id = typeof product === "string" ? product : product.id;
    const removing = favorites.includes(id);
    setFavorites((current) => removing ? current.filter((itemId) => itemId !== id) : [...current, id]);
    if (typeof product !== "string") setFavoriteProducts((current) => removing ? current.filter((item) => item.id !== id) : [...current.filter((item) => item.id !== id), product]);
    if (typeof product === "string") sync({ action: "toggle_favorite", slug: product });
    else if (product.productId) sync({ action: "toggle_favorite", productId: product.productId });
    flash(removing ? "Favorilerden çıkarıldı" : "Favorilere eklendi");
  };
  const addCart = (product: Product) => {
    setCart((current) => { const existing = current.find((item) => item.product.id === product.id); return existing ? current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { product, quantity: 1, selected: true }]; });
    if (product.offerId) sync({ action: "add_cart", offerId: product.offerId });
    setLastAdded(product); flash("Ürün sepete eklendi");
  };
  const removeCart = (id: string) => {
    const item = cart.find((entry) => entry.product.id === id);
    setCart((current) => current.filter((entry) => entry.product.id !== id));
    if (item?.product.offerId) sync({ action: "remove_cart", offerId: item.product.offerId });
  };
  const quantity = (id: string, delta: number) => {
    const item = cart.find((entry) => entry.product.id === id); if (!item) return;
    const nextQuantity = Math.max(1, item.quantity + delta);
    setCart((current) => current.map((entry) => entry.product.id === id ? { ...entry, quantity: nextQuantity } : entry));
    if (item.product.offerId) sync({ action: "update_quantity", offerId: item.product.offerId, quantity: nextQuantity });
  };
  const toggleSelected = (id: string) => {
    const item = cart.find((entry) => entry.product.id === id); if (!item) return;
    setCart((current) => current.map((entry) => entry.product.id === id ? { ...entry, selected: !entry.selected } : entry));
    if (item.product.offerId) sync({ action: "toggle_selected", offerId: item.product.offerId, selected: !item.selected });
  };
  const selectAll = (selected: boolean) => { setCart((current) => current.map((item) => ({ ...item, selected }))); sync({ action: "select_all", selected }); };

  const value = useMemo<Store>(() => ({ cart, favorites, favoriteProducts, addCart, removeCart, quantity, toggleSelected, selectAll, toggleFavorite, toast, clearToast: () => setToast(""), lastAdded, closeAdded: () => setLastAdded(null) }), [cart, favorites, favoriteProducts, toast, lastAdded]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export const useStore = () => { const value = useContext(StoreContext); if (!value) throw new Error("Store missing"); return value; };
