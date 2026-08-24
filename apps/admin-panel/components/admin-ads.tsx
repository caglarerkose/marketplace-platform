"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
type Ad = {
  id: string;
  title: string;
  placement: string;
  sponsor_name: string;
  target: string;
  label: string;
  theme: string;
  body: string;
  starts_at: string;
  ends_at: string;
  status: string;
};
const placements: Record<string, string> = {
  home_promo: "Ana sayfa üst alan",
  category_list: "Kategori listesi",
  product_detail: "Ürün detay",
  storefront: "Mağaza vitrini",
};
export function AdminAds() {
  const [items, setItems] = useState<Ad[]>([]),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    const r = await fetch("/api/admin/ads"),
      j = await r.json();
    if (r.ok) {
      setItems(j.ads || []);
      setError("");
    } else setError(j.error);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const active = useMemo(
    () =>
      items.filter(
        (x) =>
          x.status === "active" &&
          new Date(x.starts_at) <= new Date() &&
          new Date(x.ends_at) > new Date(),
      ).length,
    [items],
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget)),
      r = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...raw,
          startsAt: new Date(String(raw.startsAt)).toISOString(),
          endsAt: new Date(String(raw.endsAt)).toISOString(),
        }),
      }),
      j = await r.json();
    if (r.ok) {
      setOpen(false);
      await load();
    } else setError(j.error);
  }
  async function remove(id: string) {
    await fetch(`/api/admin/ads?id=${id}`, { method: "DELETE" });
    await load();
  }
  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>
            Reklam Alanları{" "}
            <i className="fa-solid fa-circle-check backend-tick" />
          </h1>
          <p>
            Reklam konumlarını, tarihlerini ve görünürlük kurallarını yönetin.
          </p>
        </div>
        <button className="btn primary" onClick={() => setOpen(true)}>
          <i className="fa-solid fa-plus" /> Reklam Ekle
        </button>
      </div>
      <div className="status-board">
        <div className="status-card">
          <i className="fa-solid fa-rectangle-ad" />
          <strong>{items.length}</strong>
          <span>Reklam Alanı</span>
        </div>
        <div className="status-card green">
          <i className="fa-solid fa-circle-check" />
          <strong>{active}</strong>
          <span>Aktif</span>
        </div>
        <div className="status-card blue">
          <i className="fa-solid fa-location-dot" />
          <strong>{new Set(items.map((x) => x.placement)).size}</strong>
          <span>Konum Çeşidi</span>
        </div>
      </div>
      {error && <div className="admin-inline-error">{error}</div>}
      <div className="card content-table">
        <div className="card-head">
          <h3>Reklam / Sponsorlu Alan Listesi</h3>
          <span className="link">{items.length} kayıt</span>
        </div>
        <div className="card-body table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Konum</th>
                <th>Sponsor</th>
                <th>Tarih</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((x) => (
                  <tr key={x.id}>
                    <td>{x.title}</td>
                    <td>{placements[x.placement]}</td>
                    <td>{x.sponsor_name}</td>
                    <td>
                      {new Date(x.starts_at).toLocaleDateString("tr-TR")} -{" "}
                      {new Date(x.ends_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td>
                      <span
                        className={`pill ${x.status === "active" ? "green" : "yellow"}`}
                      >
                        {x.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="pill red"
                        onClick={() => void remove(x.id)}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>Reklam kaydı bulunmuyor.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <form
            className="admin-request-modal"
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Reklam Alanı Oluştur</h2>
            <label>
              Reklam Başlığı
              <input name="title" required />
            </label>
            <label>
              Konum
              <select name="placement">
                {Object.entries(placements).map(([v, l]) => (
                  <option value={v} key={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sponsor / Mağaza
              <input name="sponsorName" required />
            </label>
            <label>
              Hedef Link / Arama
              <input name="target" required />
            </label>
            <label>
              Başlangıç
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label>
              Bitiş
              <input name="endsAt" type="datetime-local" required />
            </label>
            <label>
              Etiket
              <select name="label">
                <option>SPONSORLU</option>
                <option>REKLAM</option>
                <option>FIRSAT</option>
                <option>ÖNE ÇIKAN</option>
              </select>
            </label>
            <label>
              Tema
              <select name="theme">
                <option value="orange">Turuncu</option>
                <option value="dark">Koyu</option>
                <option value="blue">Mavi</option>
                <option value="green">Yeşil</option>
              </select>
            </label>
            <label>
              Durum
              <select name="status">
                <option value="active">Aktif</option>
                <option value="scheduled">Planlandı</option>
                <option value="passive">Pasif</option>
              </select>
            </label>
            <label>
              Reklam Metni
              <textarea name="body" required />
            </label>
            <button className="btn primary">Reklamı Yayınla</button>
          </form>
        </div>
      )}
    </>
  );
}
