"use client";
import Image from "next/image";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { allSections, sideSections, topSections } from "@/data/seller";
import { SellerNotifications } from "./seller-notifications";
export type SellerDrawerType =
  | "product"
  | "campaign"
  | "order"
  | "tracking"
  | "question"
  | "support"
  | "notifications"
  | "stock"
  | "report"
  | "documentUpload"
  | "applicationStatus"
  | "productImport"
  | "importSource"
  | "importMapping"
  | "importPreview"
  | "importReport"
  | "catalogOffer"
  | "sellerFinanceDetail"
  | "sellerAdjustmentAppeal"
  | "showcase"
  | "template"
  | "integration"
  | "generic";
export type SellerDrawer = {
  type: SellerDrawerType;
  title?: string;
  record?: string;
};
type Ctx = {
  active: string;
  setActive: (x: string) => void;
  openDrawer: (x: SellerDrawer | string) => void;
  notify: (x: string) => void;
  openCampaign: () => void;
  logAction: (m: string, a: string) => void;
};
const Context = createContext<Ctx | null>(null);
export const useSeller = () => {
  const v = useContext(Context);
  if (!v) throw new Error("Seller context missing");
  return v;
};
const titles: Record<SellerDrawerType, string> = {
  product: "Ürün Ekle / Düzenle",
  campaign: "Kampanya Oluştur",
  order: "Sipariş Detayı",
  tracking: "Kargo Takip Bilgisi",
  question: "Müşteri Sorusu",
  support: "Destek Merkezi",
  notifications: "Bildirimler",
  stock: "Stok Güncelle",
  report: "Rapor Oluştur",
  documentUpload: "Evrak Yükle",
  applicationStatus: "Başvuru Durumu",
  productImport: "Ürün Aktarım Sihirbazı",
  importSource: "Aktarım Kaynağı Ayarı",
  importMapping: "Kolon / Kategori Eşleştirme",
  importPreview: "Aktarım Önizleme ve Hata Detayı",
  importReport: "Son Aktarım Raporu",
  catalogOffer: "Katalog Teklif Detayı",
  sellerFinanceDetail: "Finans / Hakediş Detayı",
  sellerAdjustmentAppeal: "Sipariş Farkı İnceleme Talebi",
  showcase: "Mağaza Vitrini Düzenle",
  template: "Ürün Şablonu Düzenle",
  integration: "Entegrasyon Ayarı",
  generic: "Satıcı İşlemi",
};
type F = {
  label: string;
  kind?: "select" | "textarea" | "file";
  options?: string[];
  value?: string;
};
const f = (
  label: string,
  kind?: F["kind"],
  options?: string[],
  value?: string,
): F => ({ label, kind, options, value });
const forms: Partial<Record<SellerDrawerType, F[]>> = {
  product: [
    f("Ürün Adı"),
    f("Kategori", "select", ["Elektronik", "Aksesuar", "Ev & Yaşam"]),
    f("Barkod"),
    f("Marka / Model"),
    f("Fiyat"),
    f("Stok"),
    f("Açıklama", "textarea"),
  ],
  campaign: [
    f("Kampanya Adı"),
    f("İndirim Tipi", "select", ["Sepette %", "Kupon", "Kargo Bedava"]),
    f("Başlangıç"),
    f("Bitiş"),
  ],
  tracking: [
    f("Kargo Firması", "select", ["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo"]),
    f("Takip Numarası"),
  ],
  question: [
    f("Müşteri Sorusu", "textarea", undefined, "Ürünün garanti süresi nedir?"),
    f("Yanıtınız", "textarea"),
  ],
  support: [
    f("Konu", "select", ["Evrak", "Aktarım", "Hakediş", "Sipariş"]),
    f("Mesaj", "textarea"),
  ],
  stock: [f("Yeni Stok Adedi")],
  documentUpload: [
    f("Evrak Türü", "select", [
      "Vergi Levhası",
      "İmza Sirküleri",
      "IBAN Belgesi",
      "Yetkili Kimlik",
    ]),
    f("Dosya", "file"),
    f("Açıklama", "textarea"),
  ],
  productImport: [
    f("Kaynak Tipi", "select", ["Excel", "XML", "Pazaryeri API"]),
    f("Dosya / URL"),
  ],
  importSource: [
    f("Kaynak Adı"),
    f("Kaynak Tipi", "select", ["Excel", "XML", "API"]),
    f("URL"),
    f("Çekim Sıklığı", "select", ["Saatlik", "Günlük", "Manuel"]),
    f("Stok 0 Kuralı", "select", ["Pasife al", "Stokta yok göster"]),
  ],
  importMapping: [
    f("title", "select", ["Ürün Adı", "Açıklama"]),
    f("category", "select", ["Kategori", "Satıcı Kategorisi"]),
    f("price", "select", ["Satış Fiyatı", "Liste Fiyatı"]),
    f("stock", "select", ["Stok", "Adet"]),
    f("barcode", "select", ["Barkod", "SKU"]),
    f("image", "select", ["Görsel URL", "Dosya"]),
  ],
  sellerAdjustmentAppeal: [f("İtiraz Açıklaması", "textarea")],
  showcase: [
    f("Başlık"),
    f("Web Görseli"),
    f("Mobil Görseli"),
    f("Ürünler", "textarea"),
  ],
  template: [f("Şablon Adı"), f("İçerik", "textarea")],
  integration: [
    f("Entegrasyon Türü", "select", ["Muhasebe", "Kargo API", "Ürün Aktarımı"]),
    f("API / Kullanıcı Anahtarı"),
    f("Açıklama", "textarea"),
  ],
  generic: [
    f("Başlık"),
    f("Durum", "select", ["Aktif", "Pasif"]),
    f("Açıklama", "textarea"),
  ],
};
function DrawerBody({
  d,
  close,
  notify,
  log,
}: {
  d: SellerDrawer;
  close: () => void;
  notify: (x: string) => void;
  log: (m: string, a: string) => void;
}) {
  const title = d.title || titles[d.type],
    done = (m: string) => {
      log(title, m);
      notify(m);
      close();
    };
  if (d.type === "notifications") return <SellerNotifications />;
  if (d.type === "report")
    return (
      <div className="drawer-buttons">
        <button className="btn" onClick={() => done("Satış raporu indirildi")}>
          Satış Raporunu İndir
        </button>
        <button className="btn" onClick={() => done("Stok raporu indirildi")}>
          Stok Raporunu İndir
        </button>
      </div>
    );
  if (d.type === "applicationStatus")
    return (
      <>
        <div className="process-list">
          {[
            "Başvuru Alındı",
            "Ön Kontrol",
            "Evrak Kontrolü",
            "Yetki Açılışı",
          ].map((x, i) => (
            <div key={x}>
              <i>{i + 1}</i>
              <strong>{x}</strong>
              <span>{i < 2 ? "Tamamlandı" : "İşlem sürüyor"}</span>
            </div>
          ))}
        </div>
        <button
          className="btn primary"
          onClick={() => done("Evraklarım ekranına yönlendirildi")}
        >
          Evraklarım Ekranına Git
        </button>
      </>
    );
  if (d.type === "importPreview" || d.type === "importReport")
    return (
      <>
        <div className="catalog-board compact">
          <article className="green">
            <b>1.920</b>
            <span>Uygun</span>
          </article>
          <article>
            <b>611</b>
            <span>Kontrol</span>
          </article>
          <article className="red">
            <b>309</b>
            <span>Hatalı</span>
          </article>
        </div>
        <div className="drawer-buttons">
          <button
            className="btn primary"
            onClick={() => done("Uygun ürünler admin onayına gönderildi")}
          >
            Uygunları Gönder
          </button>
          <button
            className="btn"
            onClick={() => done("Aktarım raporu indirildi")}
          >
            Raporu İndir
          </button>
        </div>
      </>
    );
  if (d.type === "catalogOffer")
    return (
      <>
        <div className="info-strip">
          <i className="fa-solid fa-code-compare" />
          <div>
            <strong>{d.record || "Ana katalog ürünü"}</strong>
            <p>
              Satıcı teklifiniz mevcut katalog kartına bağlanmıştır. Fiyat ve
              stok mağazanıza özeldir.
            </p>
          </div>
        </div>
        <button
          className="btn primary"
          onClick={() => done("Teklif fiyatı güncellendi")}
        >
          Fiyatı Güncelle
        </button>
      </>
    );
  if (d.type === "sellerFinanceDetail")
    return (
      <div className="info-strip">
        <i className="fa-solid fa-calculator" />
        <div>
          <strong>Hakediş Hesaplama</strong>
          <p>
            Brüt satış → komisyon → iade/kesinti → sipariş farkları → net
            hakediş.
          </p>
        </div>
      </div>
    );
  const fs = forms[d.type] || forms.generic!;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        done(`${title} kaydedildi`);
      }}
    >
      <div className="info-strip">
        <i className="fa-solid fa-circle-info" />
        <div>
          <strong>{d.record || title}</strong>
          <p>
            İşlem yerel satıcı verisine kaydedilir ve işlem günlüğüne eklenir.
          </p>
        </div>
      </div>
      <div className="form-grid">
        {fs.map((x) => (
          <label
            className={`field ${x.kind === "textarea" ? "wide" : ""}`}
            key={x.label}
          >
            {x.label}
            {x.kind === "select" ? (
              <select>
                {x.options?.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            ) : x.kind === "textarea" ? (
              <textarea defaultValue={x.value} />
            ) : (
              <input
                type={x.kind === "file" ? "file" : "text"}
                defaultValue={x.kind === "file" ? undefined : x.value}
              />
            )}
          </label>
        ))}
      </div>
      <div className="drawer-buttons">
        <button className="btn primary">Kaydet / Gönder</button>
        <button className="btn" type="button" onClick={close}>
          Vazgeç
        </button>
      </div>
    </form>
  );
}
type SellerStoreIdentity = {
  name: string;
  status: string;
  displayName: string;
};
export function SellerShell({
  children,
  store,
}: {
  children: React.ReactNode;
  store: SellerStoreIdentity;
}) {
  const router = useRouter(),
    [active, setActiveState] = useState("dashboard"),
    [menu, setMenu] = useState(false),
    [drawer, setDrawer] = useState<SellerDrawer | null>(null),
    [toast, setToast] = useState(""),
    [notificationCount, setNotificationCount] = useState(0),
    [campaign, setCampaign] = useState(false);
  useEffect(() => {
    const s = localStorage.getItem("biseyeksik_seller_active");
    if (s && allSections.some((x) => x.id === s)) setActiveState(s);
  }, []);
  useEffect(() => {
    void fetch("/api/notifications").then(async (response) => {
      if (response.ok) setNotificationCount((await response.json()).unread || 0);
    }).catch(() => {});
  }, [drawer]);
  const setActive = (x: string) => {
    if (allSections.some((y) => y.id === x)) {
      setActiveState(x);
      localStorage.setItem("biseyeksik_seller_active", x);
      setMenu(false);
      scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const notify = (x: string) => {
      setToast(x);
      setTimeout(() => setToast(""), 2300);
    },
    logAction = (module: string, action: string) => {
      const k = "biseyeksik_seller_log_v1",
        a = JSON.parse(localStorage.getItem(k) || "[]");
      a.unshift({ date: new Date().toLocaleString("tr-TR"), module, action });
      localStorage.setItem(k, JSON.stringify(a.slice(0, 200)));
    };
  const openDrawer = (x: SellerDrawer | string) =>
      setDrawer(typeof x === "string" ? { type: "generic", title: x } : x),
    initial = store.name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "M",
    logout = async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    };
  return (
    <Context.Provider
      value={{
        active,
        setActive,
        openDrawer,
        notify,
        openCampaign: () => setCampaign(true),
        logAction,
      }}
    >
      <div className="seller-shell">
        <header className="seller-topbar">
          <button
            className="panel-header-logo"
            onClick={() => setActive("dashboard")}
          >
            <Image
              src="/img/anayazi.png"
              width={228}
              height={46}
              alt="BişeyEksik"
              priority
            />
          </button>
          <button className="hamb" onClick={() => setMenu(!menu)}>
            <i className="fa-solid fa-bars" />
          </button>
          <nav className="top-module-nav">
            {topSections.slice(0, 7).map((x) => (
              <button
                className={`top-nav-btn ${active === x.id ? "active" : ""}`}
                key={x.id}
                onClick={() => setActive(x.id)}
              >
                <i className={`fa-solid ${x.icon}`} />
                {x.title}
              </button>
            ))}
          </nav>
          <div className="top-actions">
            <span className="status-pill">
              <i /> Mağaza Aktif
            </span>
            <button
              className="icon-btn"
              onClick={() => openDrawer({ type: "support" })}
            >
              <i className="fa-regular fa-life-ring" />
            </button>
            <button
              className="icon-btn"
              onClick={() => openDrawer({ type: "notifications" })}
            >
              <i className="fa-regular fa-bell" />
              {notificationCount > 0 && <span className="dot">{notificationCount}</span>}
            </button>
            <div className="seller-user">
              <div className="avatar">{initial}</div>
              <div>
                <strong>{store.displayName}</strong>
                <span>{store.name}</span>
              </div>
            </div>
          </div>
        </header>
        <aside className={`seller-sidebar ${menu ? "open" : ""}`}>
          <nav className="nav-group">
            {sideSections.map((x) => (
              <button
                key={x.id}
                className={`nav-btn ${active === x.id ? "active" : ""}`}
                onClick={() => setActive(x.id)}
              >
                <i className={`fa-solid ${x.icon}`} />
                {x.title}
              </button>
            ))}
            <button className="nav-btn" onClick={logout}>
              <i className="fa-solid fa-right-from-bracket" />
              Çıkış Yap
            </button>
          </nav>
          <div className="side-promo seller-promo">
            <i className="fa-solid fa-gift" />
            <h3>Yeni Kampanya Fırsatları!</h3>
            <p>Mağazanız için size özel kampanya önerilerini keşfedin.</p>
            <button className="btn primary" onClick={() => setCampaign(true)}>
              Görüntüle
            </button>
          </div>
        </aside>
        {menu && (
          <button className="menu-backdrop" onClick={() => setMenu(false)} />
        )}
        <main className="seller-main">{children}</main>
        <div
          className={`drawer ${drawer ? "active" : ""}`}
          onClick={() => setDrawer(null)}
        >
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <h2>{drawer && (drawer.title || titles[drawer.type])}</h2>
              <button onClick={() => setDrawer(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            {drawer && (
              <DrawerBody
                d={drawer}
                close={() => setDrawer(null)}
                notify={notify}
                log={logAction}
              />
            )}
          </div>
        </div>
        {campaign && (
          <div className="campaign-overlay" onClick={() => setCampaign(false)}>
            <div
              className="campaign-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setCampaign(false)}
              >
                ×
              </button>
              <i className="fa-solid fa-gift" />
              <h2>Süper İndirim Günleri</h2>
              <p>
                Seçili ürünlerinizle kampanyaya katılarak tahmini
                görünürlüğünüzü %42 artırın.
              </p>
              <button
                className="btn primary"
                onClick={() => {
                  setCampaign(false);
                  logAction("Kampanya", "Katılım isteği oluşturuldu");
                  notify("Kampanya katılımı oluşturuldu");
                }}
              >
                Kampanyaya Katıl
              </button>
            </div>
          </div>
        )}
        <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
      </div>
    </Context.Provider>
  );
}
