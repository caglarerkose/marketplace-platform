"use client";
import Image from "next/image";
import { createContext, useContext, useEffect, useState } from "react";
import { allSections, sideSections, topSections } from "@/data/admin";

export type DrawerType =
  | "sellerApprove"
  | "sellerDetail"
  | "sellerMissingDocs"
  | "sellerReject"
  | "documentReview"
  | "campaign"
  | "announcement"
  | "coupon"
  | "report"
  | "notifications"
  | "messages"
  | "help"
  | "productApproval"
  | "catalogMatch"
  | "categoryMove"
  | "importReview"
  | "importMap"
  | "importError"
  | "productReject"
  | "ticket"
  | "earningAdjustment"
  | "commissionSimulation"
  | "commissionRate"
  | "categoryEdit"
  | "bannerEdit"
  | "broadcast"
  | "generic";
export type DrawerRequest = {
  type: DrawerType;
  title?: string;
  record?: string;
};
type Ctx = {
  active: string;
  setActive: (id: string) => void;
  notify: (m: string) => void;
  openDrawer: (r: DrawerRequest | string) => void;
  logAction: (m: string, s: string, r?: string) => void;
};
const Context = createContext<Ctx | null>(null);
export const useAdmin = () => {
  const v = useContext(Context);
  if (!v) throw new Error("Admin context missing");
  return v;
};
const titles: Record<DrawerType, string> = {
  sellerApprove: "Satıcı Onay İşlemi",
  sellerDetail: "Satıcı Başvuru Detayı",
  sellerMissingDocs: "Eksik Evrak / Bilgi Talebi",
  sellerReject: "Satıcı Başvuru Reddi",
  documentReview: "Evrak İnceleme",
  campaign: "Kampanya Yayınla",
  announcement: "Duyuru Oluştur",
  coupon: "Kupon Oluştur",
  report: "Rapor Oluştur",
  notifications: "Bildirimler",
  messages: "Mesajlar",
  help: "Yardım Merkezi",
  productApproval: "Ürün Onay Detayı",
  catalogMatch: "Katalog Eşleşme Kararı",
  categoryMove: "Kategori / Filtre Eşleştirme",
  importReview: "Aktarım İnceleme",
  importMap: "Kolon ve Kategori Kuralları",
  importError: "Hatalı Satır Detayı",
  productReject: "Ürün Revize Talebi",
  ticket: "Destek Talebi Detayı",
  earningAdjustment: "Sipariş Farkı Gir",
  commissionSimulation: "Hakediş Hesaplama Mantığı",
  commissionRate: "Komisyon Oranı Güncelle",
  categoryEdit: "Kategori Düzenle",
  bannerEdit: "Banner / Slider Düzenle",
  broadcast: "Toplu Bildirim Gönder",
  generic: "Yönetim İşlemi",
};
type Field = {
  label: string;
  kind?: "select" | "textarea";
  options?: string[];
  value?: string;
};
const f = (
  label: string,
  kind?: Field["kind"],
  options?: string[],
  value?: string,
): Field => ({ label, kind, options, value });
const forms: Partial<Record<DrawerType, Field[]>> = {
  sellerApprove: [
    f("Yetkili", undefined, undefined, "Ahmet Yılmaz"),
    f("Mağaza Türü", "select", ["Limited", "Anonim", "Şahıs"]),
    f("Kategori", "select", ["Elektronik", "Moda", "Ev & Yaşam"]),
    f("IBAN"),
    f("Kargo Firması", "select", ["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo"]),
    f("Admin Açıklaması", "textarea"),
  ],
  sellerMissingDocs: [
    f("Satıcı", "select", [
      "TeknoLife",
      "ModaVitrin",
      "HomeComfort",
      "Petopia",
    ]),
    f("Eksik Alan", "select", [
      "Vergi Levhası",
      "İmza Sirküleri",
      "IBAN Belgesi",
      "Yetkili Bilgisi",
    ]),
    f("Satıcıya Gidecek Açıklama", "textarea"),
  ],
  sellerReject: [
    f("Red Nedeni", "select", [
      "Evrak doğrulanamadı",
      "Riskli başvuru",
      "Kategori uygun değil",
      "Diğer",
    ]),
    f("Açıklama", "textarea"),
  ],
  documentReview: [
    f("Belge Durumu", "select", [
      "Onaylandı",
      "Eksik",
      "Okunmuyor",
      "Yeniden istenecek",
    ]),
    f("Ürün Yetkisi", "select", ["Açılsın", "Kapalı kalsın"]),
    f("Admin Notu", "textarea"),
  ],
  campaign: [
    f("Kampanya Adı"),
    f("Tür", "select", ["İndirim", "Kupon", "Sepette İndirim", "Kargo"]),
    f("Başlangıç"),
    f("Bitiş"),
    f("Açıklama", "textarea"),
  ],
  announcement: [
    f("Başlık"),
    f("Hedef Kitle", "select", ["Tümü", "Satıcılar", "Müşteriler"]),
    f("Kanal", "select", ["Panel", "E-posta", "Web + Mobil"]),
    f("Duyuru Metni", "textarea"),
  ],
  coupon: [
    f("Kupon Kodu"),
    f("İndirim Tutarı"),
    f("Alt Limit"),
    f("Kullanım Limiti"),
  ],
  productApproval: [
    f("Barkod", undefined, undefined, "8690000000000"),
    f("Marka / Model"),
    f("Fiyat / Stok"),
    f("Katalog Skoru", undefined, undefined, "%94"),
  ],
  catalogMatch: [
    f("Gelen Ürün"),
    f("Mevcut Katalog Adayı"),
    f("Benzerlik Skoru"),
  ],
  categoryMove: [
    f("Satıcı Kategorisi"),
    f("Standart Kategori", "select", [
      "Elektronik > Telefon",
      "Moda > Ayakkabı",
      "Ev & Yaşam",
    ]),
    f("Renk Alanı"),
    f("Beden Alanı"),
  ],
  importMap: [
    f("product_name", "select", ["Ürün Başlığı", "Açıklama", "Marka"]),
    f("price", "select", ["Satış Fiyatı", "Liste Fiyatı"]),
    f("stock", "select", ["Stok", "Desi"]),
    f("barcode", "select", ["Barkod", "SKU"]),
    f("image", "select", ["Görsel URL", "Video URL"]),
    f("vendor_category", "select", ["Satıcı Kategorisi", "Standart Kategori"]),
  ],
  productReject: [
    f("Revize Nedeni", "select", [
      "Görsel yetersiz",
      "Başlık hatalı",
      "Kategori hatalı",
      "Fiyat kontrolü",
    ]),
    f("Ürün Durumu", "select", ["Taslağa al", "Satıcıya gönder", "Pasif yap"]),
    f("Not", "textarea"),
  ],
  ticket: [f("Talep Özeti", "textarea"), f("Yanıt", "textarea")],
  broadcast: [
    f("Hedef Kitle", "select", [
      "Tüm müşteriler",
      "Tüm satıcılar",
      "Seçili segment",
    ]),
    f("Kanal", "select", ["Panel", "E-posta", "Push"]),
    f("Başlık"),
    f("Mesaj", "textarea"),
  ],
  earningAdjustment: [
    f("Sipariş No"),
    f("Satıcı"),
    f("Fark Tipi", "select", ["Artı fark", "Eksi fark", "Ceza", "Düzeltme"]),
    f("Tutar"),
    f("Neden"),
    f("Hakedişe Yansıma", "select", ["Bu dönem", "Sonraki dönem"]),
    f("Admin Notu", "textarea"),
  ],
  commissionRate: [
    f("Kategori / Mağaza"),
    f("Komisyon Oranı (%)"),
    f("Hizmet Bedeli (%)"),
    f("Geçerlilik Tarihi"),
  ],
  categoryEdit: [
    f("Kategori Adı"),
    f("Üst Kategori"),
    f("Slug"),
    f("Durum", "select", ["Aktif", "Pasif"]),
    f("Filtre Seti", "textarea"),
  ],
  bannerEdit: [
    f("Başlık"),
    f("Web Görseli"),
    f("Mobil Görseli"),
    f("Hedef Bağlantı"),
    f("Başlangıç"),
    f("Bitiş"),
    f("Sıra"),
    f("Durum", "select", ["Aktif", "Planlandı", "Pasif"]),
  ],
  generic: [
    f("Başlık"),
    f("Durum", "select", ["Aktif", "Pasif"]),
    f("Açıklama", "textarea"),
  ],
};
function Drawer({
  request,
  close,
  notify,
  log,
}: {
  request: DrawerRequest;
  close: () => void;
  notify: (m: string) => void;
  log: (m: string, s: string, r?: string) => void;
}) {
  const title = request.title || titles[request.type];
  const done = (m: string, r = "info") => {
    log(title, m, r);
    notify(m);
    close();
  };
  if (request.type === "notifications")
    return (
      <div className="info-strip">
        <i className="fa-solid fa-bell" />
        <div>
          <strong>12 Yeni Bildirim</strong>
          <p>
            32 yeni satıcı başvurusu
            <br />
            54 ürün onay bekliyor
            <br />
            14 eksik evrak talebi
          </p>
        </div>
      </div>
    );
  if (request.type === "messages")
    return (
      <div className="list">
        <div className="row">
          <b>Destek Ekibi</b>
          <span className="pill red">Yeni</span>
        </div>
        <div className="row">
          <b>Finans</b>
          <span className="pill green">Okundu</span>
        </div>
      </div>
    );
  if (request.type === "help")
    return (
      <div className="info-strip">
        <i className="fa-solid fa-circle-question" />
        <div>
          <strong>Yardım Merkezi</strong>
          <p>
            Panel ve süreç desteği: destek@biseyeksik.com · +90 (850) 123 45 67
          </p>
        </div>
      </div>
    );
  if (request.type === "report")
    return (
      <div className="drawer-report">
        {["Satış", "Satıcı", "Risk"].map((x) => (
          <button
            className="btn"
            key={x}
            onClick={() => done(`${x} raporu indirildi`)}
          >
            {x} Raporunu İndir
          </button>
        ))}
      </div>
    );
  if (request.type === "importReview")
    return (
      <>
        <div className="info-strip">
          <i className="fa-solid fa-code-merge" />
          <div>
            <strong>Aktarım sonucu</strong>
            <p>1.920 başarılı · 611 kontrol · 309 hatalı</p>
          </div>
        </div>
        <button
          className="btn primary"
          onClick={() => done("Sorunsuz ürünler kuyruğa alındı")}
        >
          Sorunsuzları Kuyruğa Al
        </button>
      </>
    );
  if (request.type === "importError")
    return (
      <>
        <div className="info-strip">
          <i className="fa-solid fa-triangle-exclamation" />
          <div>
            <strong>Hatalı satırlar</strong>
            <p>
              Satır 18: Barkod eksik
              <br />
              Satır 42: Görsel URL hatalı
              <br />
              Satır 77: Kategori eşleşmedi
            </p>
          </div>
        </div>
        <button className="btn" onClick={() => done("Hata raporu indirildi")}>
          CSV İndir
        </button>
      </>
    );
  if (request.type === "commissionSimulation")
    return (
      <>
        <div className="info-strip">
          <i className="fa-solid fa-calculator" />
          <div>
            <strong>Hesaplama önceliği</strong>
            <p>
              Mağaza özel oranı → kategori oranı → varsayılan oran →
              fark/ceza/düzeltme.
            </p>
          </div>
        </div>
        <button
          className="btn primary"
          onClick={() => done("Komisyon simülasyonu çalıştırıldı")}
        >
          Hesapla
        </button>
      </>
    );
  const fields = forms[request.type] || forms.generic!;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        done(
          `${title} kaydedildi`,
          request.type === "sellerReject" ? "critical" : "info",
        );
      }}
    >
      <div className="info-strip">
        <i className="fa-solid fa-circle-info" />
        <div>
          <strong>{request.record || title}</strong>
          <p>İşlem yerel demo verisine ve denetim günlüğüne kaydedilir.</p>
        </div>
      </div>
      <div className="form-grid">
        {fields.map((x) => (
          <label
            className={`field ${x.kind === "textarea" ? "full" : ""}`}
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
              <input defaultValue={x.value} />
            )}
          </label>
        ))}
      </div>
      <div className="form-actions">
        <button className="btn primary">Kaydet / Uygula</button>
        <button className="btn" type="button" onClick={close}>
          Vazgeç
        </button>
      </div>
    </form>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [active, setActiveState] = useState("overview"),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState(""),
    [drawer, setDrawer] = useState<DrawerRequest | null>(null);
  useEffect(() => {
    const s = localStorage.getItem("biseyeksik_admin_active");
    if (s && allSections.some((x) => x.id === s)) setActiveState(s);
  }, []);
  const setActive = (id: string) => {
    if (allSections.some((x) => x.id === id)) {
      setActiveState(id);
      localStorage.setItem("biseyeksik_admin_active", id);
      setMenu(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2400);
  };
  const logAction = (module: string, message: string, risk = "info") => {
    const key = "biseyeksik_admin_audit_v1",
      rows = JSON.parse(localStorage.getItem(key) || "[]");
    const now = new Date();
    rows.unshift({
      id: `LOG-${Date.now().toString().slice(-8)}`,
      date: now.toLocaleString("tr-TR"),
      timestamp: now.toISOString(),
      module,
      message,
      risk,
      user: "Çağlar Erkose",
      userCode: "SUPER-001",
      session: "WEB-SUPER",
    });
    localStorage.setItem(key, JSON.stringify(rows.slice(0, 250)));
  };
  const openDrawer = (r: DrawerRequest | string) =>
    setDrawer(typeof r === "string" ? { type: "generic", title: r } : r);
  return (
    <Context.Provider
      value={{ active, setActive, notify, openDrawer, logAction }}
    >
      <div className="admin-shell">
        <header className="topbar">
          <button
            className="panel-header-logo"
            onClick={() => setActive("overview")}
            aria-label="Genel bakışa dön"
          >
            <Image
              src="/img/anayazi.png"
              width={228}
              height={46}
              priority
              alt="BişeyEksik"
            />
          </button>
          <button
            className="hamb"
            onClick={() => setMenu(!menu)}
            aria-label="Menüyü aç"
          >
            <i className="fa-solid fa-bars" />
          </button>
          <nav className="top-module-nav">
            {topSections.slice(0, 11).map((x) => (
              <button
                key={x.id}
                className={`top-nav-btn ${active === x.id ? "active" : ""}`}
                onClick={() => setActive(x.id)}
              >
                <i className={`fa-solid ${x.icon}`} />
                {x.title}
              </button>
            ))}
          </nav>
          <div className="top-actions">
            <button
              className="icon-btn"
              onClick={() => openDrawer({ type: "notifications" })}
            >
              <i className="fa-regular fa-bell" />
              <span className="dot">12</span>
            </button>
            <button
              className="icon-btn"
              onClick={() => openDrawer({ type: "messages" })}
            >
              <i className="fa-regular fa-envelope" />
              <span className="dot">5</span>
            </button>
            <button
              className="icon-btn"
              onClick={() => openDrawer({ type: "help" })}
            >
              <i className="fa-regular fa-circle-question" />
            </button>
            <div className="admin-user">
              <div className="avatar">Ç</div>
              <div>
                <strong>Çağlar Erkose</strong>
                <span>Super Admin</span>
              </div>
            </div>
          </div>
        </header>
        <aside className={`sidebar ${menu ? "open" : ""}`}>
          <nav className="nav-group">
            {sideSections.map((x) => (
              <button
                key={x.id}
                className={`nav-btn ${active === x.id ? "active" : ""}`}
                onClick={() => setActive(x.id)}
              >
                <i className={`fa-solid ${x.icon}`} />
                {x.title}
                {x.badge && <span className="nav-badge">{x.badge}</span>}
              </button>
            ))}
          </nav>
          <div className="side-promo">
            <small>YENİ ÖZELLİK</small>
            <h3>Gelişmiş Raporlar</h3>
            <p>
              Detaylı satış ve performans raporlarını tek tıkla görüntüleyin.
            </p>
            <button onClick={() => openDrawer({ type: "report" })}>
              Keşfet
            </button>
          </div>
          <div className="support-box">
            <strong>
              <i className="fa-solid fa-headset" /> 7/24 Yönetici Desteği
            </strong>
            <div>
              <i className="fa-solid fa-phone" /> +90 (850) 123 45 67
            </div>
            <div>
              <i className="fa-regular fa-envelope" /> destek@biseyeksik.com
            </div>
          </div>
        </aside>
        {menu && (
          <button className="menu-backdrop" onClick={() => setMenu(false)} />
        )}
        <main className="main">{children}</main>
        <div
          className={`drawer ${drawer ? "active" : ""}`}
          onClick={() => setDrawer(null)}
        >
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <h2>{drawer && (drawer.title || titles[drawer.type])}</h2>
              <button className="close" onClick={() => setDrawer(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            {drawer && (
              <Drawer
                request={drawer}
                close={() => setDrawer(null)}
                notify={notify}
                log={logAction}
              />
            )}
          </div>
        </div>
        <div className={`toast ${toast ? "show" : ""}`}>
          <i className="fa-solid fa-circle-check" /> {toast}
        </div>
      </div>
    </Context.Provider>
  );
}
