"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "./admin-shell";

type Category = {
  id: string;
  parent_id: string | null;
  parent_name: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: "active" | "passive";
  updated_at: string;
};

type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
};

const emptyDraft = { name: "", slug: "", description: "", parentId: "" };

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminCategoryManagement() {
  const { notify } = useAdmin();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/categories", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Kategoriler alınamadı.");
      setCategories(result.categories || []);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Kategoriler alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => void loadCategories(), [loadCategories]);

  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase("tr-TR").trim();
    if (!normalized) return categories;
    return categories.filter((category) =>
      `${category.name} ${category.slug} ${category.parent_name || ""}`
        .toLocaleLowerCase("tr-TR")
        .includes(normalized),
    );
  }, [categories, query]);

  const resetForm = () => {
    setEditing(null);
    setDraft(emptyDraft);
  };

  const startEditing = (category: Category) => {
    setEditing(category);
    setDraft({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parentId: category.parent_id || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveCategory = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draft.name,
            slug: draft.slug,
            description: draft.description,
            parentId: draft.parentId || null,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Kategori kaydedilemedi.");
      notify(editing ? "Kategori güncellendi." : "Kategori oluşturuldu.");
      resetForm();
      await loadCategories();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Kategori kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirmation({
      title: editing ? "Kategoriyi güncelle" : "Yeni kategori oluştur",
      message: editing
        ? `${draft.name} kategorisindeki değişiklikler sisteme kaydedilecek.`
        : `${draft.name} kategorisi aktif durumda oluşturulacak.`,
      confirmLabel: editing ? "Değişiklikleri Kaydet" : "Kategoriyi Oluştur",
      onConfirm: saveCategory,
    });
  };

  const toggleStatus = (category: Category) => {
    const status = category.status === "active" ? "passive" : "active";
    setConfirmation({
      title: "Kategori durumunu değiştir",
      message: `${category.name} kategorisi ${status === "active" ? "aktif" : "pasif"} duruma getirilecek.`,
      confirmLabel: status === "active" ? "Aktif Yap" : "Pasife Al",
      onConfirm: async () => {
        setSaving(true);
        try {
          const response = await fetch(`/api/admin/categories/${category.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Kategori durumu değiştirilemedi.");
          notify(`${category.name} ${status === "active" ? "aktif" : "pasif"} duruma getirildi.`);
          await loadCategories();
        } catch (error) {
          notify(error instanceof Error ? error.message : "Kategori durumu değiştirilemedi.");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Kategoriler</h1>
          <p>Merkezi katalog kategorilerini ve üst kategori ilişkilerini yönetin.</p>
        </div>
      </div>

      <div className="grid-2 category-management-layout">
        <form className="card category-form" onSubmit={submit}>
          <div className="card-head">
            <h3>{editing ? "Kategoriyi Düzenle" : "Yeni Kategori"}</h3>
            <span className="pill blue">Canlı Veri</span>
          </div>
          <div className="card-body">
            <label className="field">
              Kategori Adı
              <input
                required
                minLength={2}
                maxLength={120}
                value={draft.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setDraft((current) => ({
                    ...current,
                    name,
                    slug: editing || current.slug ? current.slug : slugify(name),
                  }));
                }}
                placeholder="Örn. Elektronik"
              />
            </label>
            <label className="field">
              Slug
              <input
                required
                value={draft.slug}
                onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))}
                placeholder="elektronik"
              />
            </label>
            <label className="field">
              Üst Kategori
              <select
                value={draft.parentId}
                onChange={(event) => setDraft((current) => ({ ...current, parentId: event.target.value }))}
              >
                <option value="">Ana kategori</option>
                {categories.filter((category) => category.id !== editing?.id).map((category) => (
                  <option value={category.id} key={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Açıklama
              <textarea
                maxLength={1000}
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="Kategori açıklaması"
              />
            </label>
            <div className="form-actions">
              {editing && <button type="button" className="btn" onClick={resetForm}>Vazgeç</button>}
              <button type="submit" className="btn primary" disabled={saving}>
                <i className={`fa-solid ${editing ? "fa-floppy-disk" : "fa-plus"}`} />
                {editing ? "Değişiklikleri Kaydet" : "Kategori Ekle"}
              </button>
            </div>
          </div>
        </form>

        <div className="card category-overview">
          <div className="card-head"><h3>Kategori Özeti</h3></div>
          <div className="card-body category-stats">
            <div><i className="fa-solid fa-layer-group" /><span>Toplam kategori</span><b>{categories.length}</b></div>
            <div><i className="fa-solid fa-circle-check" /><span>Aktif kategori</span><b>{categories.filter((x) => x.status === "active").length}</b></div>
            <div><i className="fa-solid fa-sitemap" /><span>Alt kategori</span><b>{categories.filter((x) => x.parent_id).length}</b></div>
          </div>
        </div>
      </div>

      <div className="card content-table category-table">
        <div className="card-head">
          <h3>Kategori Listesi</h3>
          <div className="admin-table-tools">
            <input className="admin-table-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kategori ara..." />
            <button className="btn" onClick={() => void loadCategories()} disabled={loading}><i className="fa-solid fa-rotate" /> Yenile</button>
          </div>
        </div>
        <div className="card-body table-scroll">
          <table className="table">
            <thead><tr><th>Kategori</th><th>Üst Kategori</th><th>Slug</th><th>Son Güncelleme</th><th>Durum</th><th>İşlem</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="category-empty">Kategoriler yükleniyor...</td></tr>
              ) : filtered.length ? filtered.map((category) => (
                <tr key={category.id}>
                  <td><b>{category.name}</b>{category.description && <small>{category.description}</small>}</td>
                  <td>{category.parent_name || "Ana kategori"}</td>
                  <td><code>{category.slug}</code></td>
                  <td>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(category.updated_at))}</td>
                  <td><span className={`pill ${category.status === "active" ? "green" : "red"}`}>{category.status === "active" ? "Aktif" : "Pasif"}</span></td>
                  <td className="table-actions">
                    <button title="Kategoriyi düzenle" onClick={() => startEditing(category)}><i className="fa-solid fa-pen" /> Düzenle</button>
                    <button title="Kategori durumunu değiştir" onClick={() => toggleStatus(category)}><i className={`fa-solid ${category.status === "active" ? "fa-pause" : "fa-play"}`} /> {category.status === "active" ? "Pasife Al" : "Aktif Yap"}</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="category-empty">{query ? "Aramayla eşleşen kategori bulunamadı." : "Henüz kategori oluşturulmadı."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmation && (
        <div className="admin-confirm-backdrop" role="presentation" onMouseDown={() => !saving && setConfirmation(null)}>
          <div className="admin-confirm-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="confirm-brand"><Image src="/img/anayazi.png" width={180} height={52} alt="BişeyEksik" /></div>
            <div className="confirm-icon"><i className="fa-solid fa-layer-group" /></div>
            <h2>{confirmation.title}</h2><p>{confirmation.message}</p>
            <div className="confirm-actions">
              <button className="btn" disabled={saving} onClick={() => setConfirmation(null)}>Vazgeç</button>
              <button className="btn primary" disabled={saving} onClick={async () => { await confirmation.onConfirm(); setConfirmation(null); }}>{saving ? "Kaydediliyor..." : confirmation.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
