"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Approval = {
  id: string; seller_sku: string; price: number; list_price: number | null; created_at: string;
  stores: { id: string; name: string } | null;
  product_variants: { id: string; title: string; sku: string; barcode: string | null; catalog_products: { id: string; title: string; description: string | null; status: string; categories: { id: string; name: string } | null } };
};

export function AdminProductApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [selected, setSelected] = useState<Approval | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { setLoading(true); const response = await fetch("/api/admin/product-approvals"); const result = await response.json(); if (response.ok) { setApprovals(result.approvals || []); setError(""); } else setError(result.error || "Ürün onayları alınamadı."); setLoading(false); }, []);
  useEffect(() => { void load(); }, [load]);
  const totals = useMemo(() => [["Onay Bekleyen", approvals.length, "fa-hourglass-half", "yellow"], ["Kontrole Açılan", selected ? 1 : 0, "fa-magnifying-glass", "blue"], ["Onaya Hazır", approvals.length, "fa-circle-check", "green"], ["Revize Gereken", 0, "fa-triangle-exclamation", "red"]], [approvals.length, selected]);
  async function decide(decision: "approve" | "reject") { if (!selected || (decision === "reject" && reason.trim().length < 3)) { setError("Red işlemi için en az 3 karakterlik gerekçe yazın."); return; } setSaving(true); setError(""); const response = await fetch(`/api/admin/product-approvals/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, productId: selected.product_variants.catalog_products.id, ...(decision === "reject" && { reason }) }) }); const result = await response.json(); setSaving(false); if (!response.ok) { setError(result.error || "Ürün değerlendirilemedi."); return; } setSelected(null); setReason(""); await load(); }
  return <>
    <div className="page-head"><div className="page-title"><h1>Ürün Onayları <i className="fa-solid fa-circle-check backend-tick" title="Backend bağlantısı tamamlandı" /></h1><p>Satıcılardan gelen ürün kartlarını, varyantları ve mağaza tekliflerini değerlendirin.</p></div><button className="btn" onClick={() => void load()}><i className="fa-solid fa-rotate" /> Yenile</button></div>
    <div className="status-board">{totals.map((item) => <div className={`status-card ${item[3]}`} key={String(item[0])}><i className={`fa-solid ${item[2]}`} /><strong>{item[1]}</strong><span>{item[0]}</span></div>)}</div>
    {error && <div className="admin-inline-error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
    <div className="card"><div className="card-head"><h3>Onay Kuyruğu</h3><span className="link">{approvals.length} ürün</span></div><div className="card-body table-scroll"><table className="table"><thead><tr><th>Ürün</th><th>Satıcı</th><th>Kategori</th><th>SKU / Barkod</th><th>Fiyat</th><th>İşlem</th></tr></thead><tbody>
      {loading && <tr><td colSpan={6} className="empty-table-cell">Ürünler yükleniyor...</td></tr>}
      {!loading && approvals.length === 0 && <tr><td colSpan={6} className="empty-table-cell">Onay bekleyen ürün bulunmuyor.</td></tr>}
      {approvals.map((item) => { const product = item.product_variants.catalog_products; return <tr key={item.id}><td><b>{product.title}</b><div className="row-sub">{item.product_variants.title}</div></td><td>{item.stores?.name || "-"}</td><td>{product.categories?.name || "-"}</td><td>{item.seller_sku}<div className="row-sub">{item.product_variants.barcode || "Barkod yok"}</div></td><td>{Number(item.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td><td><button className="pill" onClick={() => { setSelected(item); setReason(""); setError(""); }}>İncele</button></td></tr>; })}
    </tbody></table></div></div>
    {selected && <div className="drawer active" onClick={() => setSelected(null)}><div className="drawer-panel" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><h2>Ürün Onay İşlemi</h2><button onClick={() => setSelected(null)} aria-label="Kapat"><i className="fa-solid fa-xmark" /></button></div><div className="info-strip"><i className="fa-solid fa-box-open" /><div><strong>{selected.product_variants.catalog_products.title}</strong><p>{selected.stores?.name} · {selected.product_variants.catalog_products.categories?.name || "Kategori yok"}</p></div></div><div className="form-grid"><label className="field">Varyant<input value={selected.product_variants.title} readOnly /></label><label className="field">SKU<input value={selected.seller_sku} readOnly /></label><label className="field">Barkod<input value={selected.product_variants.barcode || "-"} readOnly /></label><label className="field">Satış Fiyatı<input value={Number(selected.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })} readOnly /></label><label className="field wide">Ürün Açıklaması<textarea value={selected.product_variants.catalog_products.description || "Açıklama girilmemiş."} readOnly /></label><label className="field wide">Red / Revize Gerekçesi<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Yalnızca red işleminde zorunludur." maxLength={1000} /></label></div>{error && <div className="admin-inline-error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}<div className="drawer-buttons"><button className="btn primary" disabled={saving} onClick={() => void decide("approve")}><i className="fa-solid fa-check" /> Onayla</button><button className="btn" disabled={saving} onClick={() => void decide("reject")}><i className="fa-solid fa-xmark" /> Reddet</button></div></div></div>}
  </>;
}
