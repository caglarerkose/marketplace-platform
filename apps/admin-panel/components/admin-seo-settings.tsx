"use client";
import { FormEvent, useEffect, useState } from "react";
type Settings = {
  site_name: string;
  contact_phone: string | null;
  contact_email: string;
  legal_name: string | null;
  registration_number: string | null;
  address: string | null;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  index_enabled: boolean;
  og_title: string;
  og_description: string;
  search_verification: string | null;
};
export function AdminSeoSettings() {
  const [data, setData] = useState<Settings | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    void fetch("/api/admin/seo-settings").then(async (r) => {
      const j = await r.json();
      if (r.ok) setData(j.settings);
      else setError(j.error);
    });
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const raw = Object.fromEntries(new FormData(e.currentTarget)),
      r = await fetch("/api/admin/seo-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...raw,
          indexEnabled: raw.indexEnabled === "true",
        }),
      }),
      j = await r.json();
    if (r.ok) setMessage("SEO ve site bilgileri anasiteye yayınlandı.");
    else setError(j.error);
    setSaving(false);
  }
  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>
            SEO / Sayfalar{" "}

          </h1>
          <p>
            Meta alanlarını, indeksleme ve site kimliği bilgilerini yönetin.
          </p>
        </div>
      </div>
      {error && <div className="admin-inline-error">{error}</div>}
      {data ? (
        <form className="card content-form" onSubmit={submit}>
          <div className="card-head">
            <h3>SEO / Site Bilgileri</h3>
            <span className="link">Canlı yayın ayarı</span>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <label className="field">
                Site Adı
                <input name="siteName" defaultValue={data.site_name} required />
              </label>
              <label className="field">
                Telefon
                <input
                  name="contactPhone"
                  defaultValue={data.contact_phone || ""}
                />
              </label>
              <label className="field">
                E-posta
                <input
                  name="contactEmail"
                  type="email"
                  defaultValue={data.contact_email}
                  required
                />
              </label>
              <label className="field">
                Ticari Unvan
                <input name="legalName" defaultValue={data.legal_name || ""} />
              </label>
              <label className="field">
                Vergi / Sicil Bilgisi
                <input
                  name="registrationNumber"
                  defaultValue={data.registration_number || ""}
                />
              </label>
              <label className="field full">
                Adres
                <textarea name="address" defaultValue={data.address || ""} />
              </label>
              <label className="field full">
                Meta Title
                <input
                  name="metaTitle"
                  defaultValue={data.meta_title}
                  required
                  maxLength={160}
                />
              </label>
              <label className="field full">
                Meta Description
                <textarea
                  name="metaDescription"
                  defaultValue={data.meta_description}
                  required
                  maxLength={500}
                />
              </label>
              <label className="field">
                Keywords
                <input
                  name="keywords"
                  defaultValue={data.keywords.join(", ")}
                />
              </label>
              <label className="field">
                Index Kontrol
                <select
                  name="indexEnabled"
                  defaultValue={String(data.index_enabled)}
                >
                  <option value="true">Index</option>
                  <option value="false">Noindex</option>
                </select>
              </label>
              <label className="field">
                OG Başlık
                <input name="ogTitle" defaultValue={data.og_title} />
              </label>
              <label className="field full">
                OG Açıklama
                <textarea
                  name="ogDescription"
                  defaultValue={data.og_description}
                />
              </label>
              <label className="field full">
                Arama Motoru Doğrulama Kodu
                <input
                  name="searchVerification"
                  defaultValue={data.search_verification || ""}
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="btn primary" disabled={saving}>
                <i className="fa-solid fa-cloud-arrow-up" />{" "}
                {saving ? "Yayınlanıyor" : "Anasiteye Yayınla"}
              </button>
            </div>
            {message && <div className="info-strip">{message}</div>}
          </div>
        </form>
      ) : (
        !error && (
          <div className="card">
            <div className="card-body">SEO ayarları yükleniyor...</div>
          </div>
        )
      )}
    </>
  );
}
