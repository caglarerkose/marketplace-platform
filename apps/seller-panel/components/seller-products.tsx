"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Category = { id: string; name: string; parent_id: string | null };
type Offer = {
  id: string;
  seller_sku: string;
  price: number;
  list_price: number | null;
  status: "pending" | "active" | "passive" | "rejected" | "archived";
  rejection_reason: string | null;
  product_variants: {
    title: string;
    barcode: string | null;
    catalog_products: { title: string; status: string; rejection_reason: string | null; categories: { name: string } | null };
  };
};

const statusLabels: Record<string, string> = {
  pending: "Onay bekliyor", active: "Aktif", passive: "Pasif",
  rejected: "Revize gerekli", archived: "Arşivlendi",
};

export function SellerProducts() {
  const [products, setProducts] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [productResponse, categoryResponse] = await Promise.all([fetch("/api/products"), fetch("/api/categories")]);
    const [productResult, categoryResult] = await Promise.all([productResponse.json(), categoryResponse.json()]);
    if (productResponse.ok) setProducts(productResult.products || []);
    if (categoryResponse.ok) setCategories(categoryResult.categories || []);
    setError(productResponse.ok && categoryResponse.ok ? "" : productResult.error || categoryResult.error || "Ürün bilgileri alınamadı.");
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => [
    ["Aktif Ürün", products.filter((item) => item.status === "active").length, "fa-box", "green"],
    ["Onay Bekleyen", products.filter((item) => item.status === "pending").length, "fa-clock", "yellow"],
    ["Toplam Teklif", products.length, "fa-link", "blue"],
    ["Revize Gereken", products.filter((item) => item.status === "rejected").length, "fa-triangle-exclamation", "red"],
  ], [products]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const result = await response.json();
    setSubmitting(false);
    if (!response.ok) { setError(result.error || "Ürün onaya gönderilemedi."); return; }
    setOpen(false); await load();
  }

  return <>
    <div className="page-head">
      <div className="page-title"><h1>Ürünlerim </h1><p>Tekil ürün ekleyin ve katalog onay durumlarını takip edin.</p></div>
      <div className="head-actions"><button className="btn primary" onClick={() => { setError(""); setOpen(true); }}><i className="fa-solid fa-plus" /> Tekil Ürün Ekle</button></div>
    </div>
    <div className="catalog-board">{stats.map((item) => <article className={String(item[3])} key={String(item[0])}><i className={`fa-solid ${item[2]}`} /><h4>{item[0]}</h4><b>{item[1]}</b><span>Güncel mağaza verisi</span></article>)}</div>
    {error && <div className="apply-error" role="alert"><i className="fa-solid fa-circle-exclamation" />{error}</div>}
    <div className="card content-table"><div className="card-head"><h3>Ürün Listesi</h3></div><div className="card-body table-scroll">
      <table className="table"><thead><tr><th>Ürün</th><th>Kategori</th><th>SKU / Barkod</th><th>Fiyat</th><th>Katalog Durumu</th></tr></thead><tbody>
        {!loading && products.length === 0 && <tr><td colSpan={5} className="empty-table-cell">Henüz ürün teklifi bulunmuyor.</td></tr>}
        {loading && <tr><td colSpan={5} className="empty-table-cell">Ürünler yükleniyor...</td></tr>}
        {products.map((offer) => { const product = offer.product_variants.catalog_products; return <tr key={offer.id}><td><strong>{product.title}</strong><div className="row-sub">{offer.product_variants.title}</div></td><td>{product.categories?.name || "-"}</td><td>{offer.seller_sku}<div className="row-sub">{offer.product_variants.barcode || "Barkod yok"}</div></td><td>{Number(offer.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td><td><span className={`pill ${offer.status === "active" ? "green" : offer.status === "rejected" ? "red" : "yellow"}`}>{statusLabels[offer.status] || offer.status}</span>{offer.rejection_reason && <div className="row-sub">{offer.rejection_reason}</div>}</td></tr>; })}
      </tbody></table>
    </div></div>
    {open && <div className="drawer active" onClick={() => setOpen(false)}><div className="drawer-panel" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><h2>Tekil Ürün Ekle</h2><button onClick={() => setOpen(false)} aria-label="Kapat"><i className="fa-solid fa-xmark" /></button></div>
      <form onSubmit={submit}><div className="info-strip"><i className="fa-solid fa-circle-info" /><div><strong>Katalog onayı</strong><p>Ürün ve mağaza teklifiniz kontrol edilmek üzere yönetime gönderilir.</p></div></div><div className="form-grid">
        <label className="field wide">Ürün Adı<input name="title" required minLength={3} maxLength={240} /></label>
        <label className="field">Kategori<select name="categoryId" required defaultValue=""><option value="">Seçiniz</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
        <label className="field">Varyant Adı<input name="variantTitle" required placeholder="Örn. Siyah / Standart" /></label>
        <label className="field">SKU<input name="sku" required minLength={2} maxLength={80} /></label>
        <label className="field">Barkod<input name="barcode" inputMode="numeric" minLength={8} maxLength={32} /></label>
        <label className="field">Satış Fiyatı<input name="price" required type="number" min="0.01" step="0.01" /></label>
        <label className="field">Liste Fiyatı<input name="listPrice" type="number" min="0.01" step="0.01" /></label>
        <label className="field wide">Açıklama<textarea name="description" maxLength={5000} /></label>
      </div>{error && <div className="apply-error" role="alert"><i className="fa-solid fa-circle-exclamation" />{error}</div>}<div className="drawer-buttons"><button className="btn primary" disabled={submitting}>{submitting ? "Gönderiliyor..." : "Onaya Gönder"}</button><button className="btn" type="button" onClick={() => setOpen(false)}>Vazgeç</button></div></form>
    </div></div>}
  </>;
}
