"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Offer = { id: string; seller_sku: string; product_variants: { title: string; catalog_products: { title: string } } };
type Ranking = { id: string; offer_id: string; sort_order: number; label: string | null; status: string; seller_offers: { seller_sku: string; product_variants: { title: string; catalog_products: { title: string } } } };
type Showcase = { banner_url: string | null; mobile_banner_url: string | null; promotion_text: string | null; status: string };

export function SellerShowcase({ mode }: { mode: "showcase" | "ranking" }) {
  const [data, setData] = useState<Showcase | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [rows, setRows] = useState<Ranking[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/store-showcase"), result = await response.json();
    if (response.ok) { setData(result.showcase); setOffers(result.offers || []); setRows(result.rankings || []); setError(""); }
    else setError(result.error);
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const body = mode === "showcase"
      ? { type: mode, bannerUrl: fields.bannerUrl, mobileBannerUrl: fields.mobileBannerUrl, promotionText: fields.promotionText, status: fields.status }
      : { type: mode, offerId: fields.offerId, sortOrder: Number(fields.sortOrder), label: fields.label, status: fields.status };
    const response = await fetch("/api/store-showcase", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) { setError(result.error); return; }
    setSaved("Değişiklikler kaydedildi."); setOpen(false); await load();
  }
  async function remove(id: string) { await fetch(`/api/store-showcase?id=${id}`, { method: "DELETE" }); await load(); }
  const title = mode === "showcase" ? "Mağaza Vitrini" : "Mağaza İçi Ürün Sıralaması";
  const description = mode === "showcase" ? "Satıcı mağaza sayfasında görünecek banner, tanıtım ve vitrin bloklarını yönetin." : "Kendi mağaza vitrininizdeki ürünlerin öncelik, sıra ve öne çıkarma durumunu yönetin.";
  return <>
    <div className="page-head"><div className="page-title"><h1>{title}</h1><p>{description}</p></div><button className="btn primary" onClick={() => setOpen(true)} disabled={mode === "ranking" && !offers.length}><i className={`fa-solid ${mode === "showcase" ? "fa-pen" : "fa-plus"}`} />{mode === "showcase" ? "Vitrini Düzenle" : "Sıralama Ekle"}</button></div>
    {error && <div className="admin-inline-error">{error}</div>}{saved && <div className="info-strip">{saved}</div>}
    {mode === "ranking" && <div className="card content-table"><div className="card-head"><h3>Vitrin Sırası</h3><span className="link">{rows.length} ürün</span></div><div className="card-body table-scroll"><table className="table"><thead><tr><th>Sıra</th><th>Ürün</th><th>Etiket</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>{rows.length ? rows.map((item) => <tr key={item.id}><td>{item.sort_order}</td><td><b>{item.seller_offers.product_variants.catalog_products.title}</b><div className="row-sub">{item.seller_offers.seller_sku}</div></td><td>{item.label || "-"}</td><td><span className="pill blue">{item.status}</span></td><td><button className="pill" onClick={() => void remove(item.id)}>Kaldır</button></td></tr>) : <tr><td colSpan={5}>Vitrin sıralamasına eklenmiş ürün bulunmuyor.</td></tr>}</tbody></table></div></div>}
    {open && <div className="modal-overlay" onClick={() => setOpen(false)}><form className="seller-request-modal" onSubmit={save} onClick={(event) => event.stopPropagation()}><button type="button" className="modal-form-close" onClick={() => setOpen(false)} aria-label="Kapat"><i className="fa-solid fa-xmark" /></button><h2>{mode === "showcase" ? "Vitrin Detayı" : "Sıralama Detayı"}</h2>{mode === "showcase" ? <><label>Web Banner Adresi<input name="bannerUrl" defaultValue={data?.banner_url || ""} /></label><label>Mobil Banner Adresi<input name="mobileBannerUrl" defaultValue={data?.mobile_banner_url || ""} /></label><label>Tanıtım Metni<textarea name="promotionText" defaultValue={data?.promotion_text || ""} /></label><label>Durum<select name="status" defaultValue={data?.status || "draft"}><option value="draft">Taslak</option><option value="published">Yayında</option><option value="passive">Pasif</option></select></label></> : <><label>Ürün<select name="offerId" required><option value="">Ürün seçin</option>{offers.map((offer) => <option value={offer.id} key={offer.id}>{offer.product_variants.catalog_products.title} · {offer.product_variants.title}</option>)}</select></label><label>Sıra<input name="sortOrder" type="number" min="1" required /></label><label>Etiket<input name="label" maxLength={40} /></label><label>Durum<select name="status"><option value="active">Aktif</option><option value="fixed">Sabit</option><option value="planned">Planlı</option><option value="passive">Pasif</option></select></label></>}<div className="modal-form-actions"><button className="btn primary">Kaydet</button><button type="button" className="btn" onClick={() => setOpen(false)}>Vazgeç</button></div></form></div>}
  </>;
}
