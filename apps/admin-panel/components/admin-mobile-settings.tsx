"use client";
import { FormEvent, useEffect, useState } from "react";
type Nav = {
  label: string;
  target: string;
  icon: string;
  sortOrder: number;
  enabled: boolean;
};
type Settings = {
  app_mode: string;
  category_view: string;
  product_card_view: string;
  purchase_bar_enabled: boolean;
  campaign_banner_enabled: boolean;
  push_enabled: boolean;
  home_block_order: string[];
  mobile_message: string | null;
  navigation_items: Nav[];
};
const defaults: Nav[] = [
  {
    label: "Anasayfa",
    target: "/",
    icon: "fa-house",
    sortOrder: 1,
    enabled: true,
  },
  {
    label: "Kategoriler",
    target: "/kategoriler",
    icon: "fa-magnifying-glass",
    sortOrder: 2,
    enabled: true,
  },
  {
    label: "Favorilerim",
    target: "/favoriler",
    icon: "fa-heart",
    sortOrder: 3,
    enabled: true,
  },
  {
    label: "Sepetim",
    target: "/sepet",
    icon: "fa-cart-shopping",
    sortOrder: 4,
    enabled: true,
  },
  {
    label: "Hesabım",
    target: "/hesabim",
    icon: "fa-user",
    sortOrder: 5,
    enabled: true,
  },
];
export function AdminMobileSettings() {
  const [data, setData] = useState<Settings | null>(null),
    [nav, setNav] = useState<Nav[]>(defaults),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    void fetch("/api/admin/mobile-settings").then(async (r) => {
      const j = await r.json();
      if (r.ok) {
        setData(j.settings);
        setNav(j.settings?.navigation_items || defaults);
      } else setError(j.error);
    });
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget)),
      r = await fetch("/api/admin/mobile-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appMode: raw.appMode,
          categoryView: raw.categoryView,
          productCardView: raw.productCardView,
          purchaseBarEnabled: raw.purchaseBarEnabled === "true",
          campaignBannerEnabled: raw.campaignBannerEnabled === "true",
          pushEnabled: raw.pushEnabled === "true",
          homeBlockOrder: String(raw.homeBlockOrder)
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          mobileMessage: raw.mobileMessage,
          navigationItems: nav,
        }),
      }),
      j = await r.json();
    if (r.ok) setMessage("Mobil ayarlar yayınlandı.");
    else setError(j.error);
  }
  if (!data)
    return (
      <div className="card">
        <div className="card-body">Mobil ayarlar yükleniyor...</div>
      </div>
    );
  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>
            Mobil Ayarlar{" "}

          </h1>
          <p>
            Mobil navigasyon, uygulama bannerı ve görünüm tercihlerini yönetin.
          </p>
        </div>
      </div>
      {error && <div className="admin-inline-error">{error}</div>}
      <form className="card content-form" onSubmit={submit}>
        <div className="card-head">
          <h3>Mobil Görünüm ve Yayın</h3>
          <span className="link">Canlı ayar</span>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <label className="field">
              Uygulama Modu
              <select name="appMode" defaultValue={data.app_mode}>
                <option value="pwa">PWA / Web App</option>
                <option value="hybrid">Hibrit Mobil</option>
                <option value="mobile_web">Sadece Mobil Web</option>
              </select>
            </label>
            <label className="field">
              Kategori Görünümü
              <select name="categoryView" defaultValue={data.category_view}>
                <option value="square_grid">Kare Grid</option>
                <option value="horizontal_list">Yatay Liste</option>
                <option value="compact_list">Kompakt Liste</option>
              </select>
            </label>
            <label className="field">
              Ürün Kartı
              <select
                name="productCardView"
                defaultValue={data.product_card_view}
              >
                <option value="compact">Kompakt Kart</option>
                <option value="marketplace">Pazaryeri Kartı</option>
                <option value="image_first">Görsel Öncelikli</option>
              </select>
            </label>
            {[
              [
                "Alt Satın Alma Barı",
                "purchaseBarEnabled",
                data.purchase_bar_enabled,
              ],
              [
                "Mobil Kampanya Bandı",
                "campaignBannerEnabled",
                data.campaign_banner_enabled,
              ],
              ["Push Bildirim", "pushEnabled", data.push_enabled],
            ].map(([label, name, value]) => (
              <label className="field" key={String(name)}>
                {String(label)}
                <select name={String(name)} defaultValue={String(value)}>
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
              </label>
            ))}
            <label className="field full">
              Mobil Ana Sayfa Blok Sırası
              <input
                name="homeBlockOrder"
                defaultValue={data.home_block_order.join(", ")}
              />
            </label>
            <label className="field full">
              Mobil Duyuru / Uygulama Mesajı
              <textarea
                name="mobileMessage"
                defaultValue={data.mobile_message || ""}
              />
            </label>
          </div>
          <h3>Alt Navigasyon Sıralaması</h3>
          {nav.map((x, i) => (
            <div className="form-grid" key={i}>
              <label className="field">
                Başlık
                <input
                  value={x.label}
                  onChange={(e) =>
                    setNav((v) =>
                      v.map((n, j) =>
                        j === i ? { ...n, label: e.target.value } : n,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Hedef
                <input
                  value={x.target}
                  onChange={(e) =>
                    setNav((v) =>
                      v.map((n, j) =>
                        j === i ? { ...n, target: e.target.value } : n,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Sıra
                <input
                  type="number"
                  min="1"
                  value={x.sortOrder}
                  onChange={(e) =>
                    setNav((v) =>
                      v.map((n, j) =>
                        j === i
                          ? { ...n, sortOrder: Number(e.target.value) }
                          : n,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Görünür
                <select
                  value={String(x.enabled)}
                  onChange={(e) =>
                    setNav((v) =>
                      v.map((n, j) =>
                        j === i
                          ? { ...n, enabled: e.target.value === "true" }
                          : n,
                      ),
                    )
                  }
                >
                  <option value="true">Evet</option>
                  <option value="false">Hayır</option>
                </select>
              </label>
            </div>
          ))}
          <button className="btn primary">Mobil Ayarları Kaydet</button>
          {message && <div className="info-strip">{message}</div>}
        </div>
      </form>
    </>
  );
}
