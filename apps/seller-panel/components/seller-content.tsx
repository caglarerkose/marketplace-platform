"use client";
import { useState } from "react";
import {
  useSeller,
  type SellerDrawer,
  type SellerDrawerType,
} from "./seller-shell";
import { allSections, type SellerSection } from "@/data/seller";
import { sellerContent, type SellerContentData } from "@/data/functional";
import { SellerBrandLogo } from "./seller-brand-logo";
import { SellerProducts } from "./seller-products";
import { SellerInventory } from "./seller-inventory";
import { SellerDashboardCatalog } from "./seller-dashboard-catalog";
import { SellerStoreProfile } from "./seller-store-profile";
import { SellerOrders } from "./seller-orders";
import { SellerOrderRequests } from "./seller-order-requests";
import { SellerSupport } from "./seller-support";
import { SellerQuestions } from "./seller-questions";
import { SellerCampaigns } from "./seller-campaigns";
import { SellerFinance } from "./seller-finance";
import { SellerAnnouncements } from "./seller-announcements";
const actionDrawer = (
  section: string,
  action: string,
  record?: string,
): SellerDrawer => {
  const a = `${section} ${action}`;
  let type: SellerDrawerType = "generic";
  if (/Tekil Ürün|Düzenle/.test(a) && section === "products") type = "product";
  else if (/Kampanya Oluştur/.test(a)) type = "campaign";
  else if (/Yanıtla/.test(a)) type = "question";
  else if (/Destek|Talep Aç/.test(a)) type = "support";
  else if (/Stok|kaldı/.test(a)) type = "stock";
  else if (/Rapor|İndir|Dışa Aktar|CSV/.test(a)) type = "report";
  else if (/Evrak Yükle|IBAN/.test(a)) type = "documentUpload";
  else if (/Başvuru Durumu/.test(a)) type = "applicationStatus";
  else if (/Ürün Aktar|Aktarımı Başlat|Excel Yükle/.test(a))
    type = "productImport";
  else if (/Kolon Eşleştirme|Şablon Ayarla/.test(a)) type = "importMapping";
  else if (/Bağlantı Kur|API Ayarla/.test(a)) type = "importSource";
  else if (/Hatayı Gör|Test Et/.test(a)) type = "importPreview";
  else if (/Son Aktarım Raporu/.test(a)) type = "importReport";
  else if (/Görüntüle/.test(a) && section === "products") type = "catalogOffer";
  else if (/Detay|Hesabı Gör|Oran Detayı/.test(a) && section === "finance")
    type = "sellerFinanceDetail";
  else if (/İtiraz/.test(a)) type = "sellerAdjustmentAppeal";
  else if (section === "seller-top-showcase") type = "showcase";
  else if (section === "seller-top-templates") type = "template";
  else if (/integration|integrations|Kaynakları Yönet/.test(a))
    type = "integration";
  return { type, title: action, record };
};
function Btn({
  children,
  primary = false,
  onClick,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`btn ${primary ? "primary" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}
function Kpis() {
  return (
    <div className="seller-kpi-grid">
      {[
        ["Toplam Satış", "₺125.430,50", "Bu ay ▲ %18,6", "fa-bag-shopping"],
        ["Bugünkü Sipariş", "32", "Dün: 28 ▲ %14,3", "fa-cart-shopping"],
        ["Kargolanmayı Bekleyen", "18", "Toplam siparişin %9'u", "fa-truck"],
        ["İade Talepleri", "6", "Toplam siparişin %3'ü", "fa-rotate-left"],
        ["Ortalama Puan", "4.7", "★★★★★ (812)", "fa-star"],
      ].map((x, i) => (
        <article className="kpi" key={x[0]}>
          <i className={`fa-solid ${x[3]}`} />
          <h4>{x[0]}</h4>
          <div className="num">{x[1]}</div>
          <div className={`trend ${i === 2 || i === 3 ? "red" : ""}`}>
            {x[2]}
          </div>
        </article>
      ))}
    </div>
  );
}
function Dashboard() {
  const { openDrawer, setActive, openCampaign } = useSeller();
  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Panelim</h1>
          <p>Mağazanızın genel performansını buradan takip edebilirsiniz.</p>
        </div>
        <div className="head-actions">
          <Btn onClick={() => openDrawer({ type: "report" })}>Rapor İndir</Btn>
          <Btn onClick={() => openDrawer({ type: "campaign" })}>
            Kampanya Oluştur
          </Btn>
          <Btn primary onClick={() => openDrawer({ type: "product" })}>
            Ürün Ekle
          </Btn>
        </div>
      </div>
      <Kpis />
      <div className="grid-3">
        <Chart />
        <OrderPreview />
        <QuestionList />
      </div>
      <div className="grid-3">
        <SellerDashboardCatalog />
        <Notices />
      </div>
      <div className="growth-strip">
        <div>
          <h3>Mağazanızı Büyütün!</h3>
          <p>Daha fazla müşteriye ulaşmak için aksiyon alın.</p>
        </div>
        <button onClick={() => setActive("seller-top-showcase")}>
          <span>
            <strong>Ürünlerinizi Öne Çıkarın</strong>
            <small>Vitrininizi düzenleyin.</small>
          </span>
          <i className="fa-solid fa-chevron-right" />
        </button>
        <button onClick={openCampaign}>
          <span>
            <strong>Kampanya Oluşturun</strong>
            <small>Satışlarınızı artırın.</small>
          </span>
          <i className="fa-solid fa-chevron-right" />
        </button>
        <button onClick={() => setActive("reports")}>
          <span>
            <strong>Mağaza Analizi</strong>
            <small>Performansınızı ölçün.</small>
          </span>
          <i className="fa-solid fa-chevron-right" />
        </button>
      </div>
    </>
  );
}
function Chart() {
  return (
    <div className="card">
      <div className="card-head">
        <h3>Satış Performansı</h3>
        <select className="pill">
          <option>Bu Ay</option>
          <option>Son 30 Gün</option>
        </select>
      </div>
      <div className="card-body">
        <div className="chart">
          <div className="chart-meta">
            <span>
              Toplam Satış<b>₺125.430,50</b>
            </span>
            <span>
              Dönüşüm<b>%2,86</b>
            </span>
          </div>
          <svg preserveAspectRatio="none" viewBox="0 0 620 185">
            <path
              d="M0 150 L60 132 L110 92 L165 122 L225 82 L285 108 L350 70 L405 96 L470 42 L530 88 L590 35 L620 52"
              fill="none"
              stroke="#ff4f30"
              strokeWidth="5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
function OrderPreview() {
  return <SellerOrders compact />;
}
function QuestionList() {
  const { openDrawer, setActive } = useSeller();
  return (
    <div className="card">
      <div className="card-head">
        <h3>Müşteri Soruları</h3>
        <button className="link" onClick={() => setActive("messages")}>
          Tümünü Gör
        </button>
      </div>
      <div className="card-body list">
        {["Garanti süresi nedir?", "Aynı gün kargo olur mu?"].map((x) => (
          <div className="row" key={x}>
            <div className="product-thumb">
              <i className="fa-solid fa-question" />
            </div>
            <div className="row-title">{x}</div>
            <button
              className="pill"
              onClick={() => openDrawer({ type: "question", record: x })}
            >
              Yanıtla
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
function Notices() {
  const { setActive } = useSeller();
  const [open, setOpen] = useState(0);
  return (
    <div className="card">
      <div className="card-head">
        <h3>Mağaza Duyuruları</h3>
        <button
          className="link"
          onClick={() => setActive("seller-top-announcements")}
        >
          Tümünü Gör
        </button>
      </div>
      <div className="card-body">
        {[
          "Komisyon Oranları Güncellendi",
          "Süper İndirim Günleri Başlıyor",
        ].map((x, i) => (
          <div className={`accordion ${open === i ? "open" : ""}`} key={x}>
            <button onClick={() => setOpen(open === i ? -1 : i)}>
              {x}
              <i className="fa-solid fa-chevron-down" />
            </button>
            <p>Mağazanız için yayınlanan duyurunun ayrıntıları.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
function OrderBoard() {
  return <><SellerOrders /><SellerOrderRequests /></>;
}
function Functional({
  s,
  data,
}: {
  s: SellerSection;
  data: SellerContentData;
}) {
  const { openDrawer, notify, logAction, openCampaign, setActive } =
    useSeller();
  const contentTitle =
    s.id === "seller-top-product-ranking"
      ? "Mağaza İçi Ürün Sıralaması"
      : s.id === "seller-top-import-sources"
        ? "Ürün Aktarım Kaynakları"
        : s.title;
  const contentDescription =
    s.id === "seller-top-showcase"
      ? "Satıcı mağaza sayfasında görünecek banner, tanıtım ve vitrin bloklarını yönetin."
      : s.id === "seller-top-product-ranking"
        ? "Kendi mağaza vitrininizdeki ürünlerin öncelik, sıra ve öne çıkarma durumunu yönetin."
        : s.id === "seller-top-documents"
          ? "Mağaza türünüze göre istenen belgeleri, admin notlarını ve ürün yükleme yetkinizi takip edin."
          : s.id === "seller-top-import-sources"
            ? "Excel, XML veya pazaryeri bağlantı ayarlarını burada kurun; aktarım işlemini Ürünlerim ekranından çalıştırın."
            : s.id === "seller-top-installments"
              ? "Admin tarafından kategori bazlı belirlenen taksit kurallarının mağazanıza ve ürünlerinize etkisini görüntüleyin."
              : s.description;
  const act = (a: string, r?: string) => {
    if (/Yenile/.test(a)) {
      notify(`${s.title} yenilendi`);
      return;
    }
    if (/Kampanyaya Katıl/.test(a)) {
      openCampaign();
      return;
    }
    if (/Duyurularım/.test(a)) {
      setActive("seller-top-announcements");
      return;
    }
    if (/Kaydet|Okundu|İncele/.test(a) && !r) {
      logAction(s.title, a);
      notify(`${a} işlemi tamamlandı`);
      return;
    }
    openDrawer(actionDrawer(s.id, a, r));
  };
  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>{contentTitle}</h1>
          <p>{contentDescription}</p>
        </div>
        <div className="head-actions">
          {data.secondary && (
            <Btn onClick={() => act(data.secondary!)}>{data.secondary}</Btn>
          )}
          {data.primary && (
            <Btn primary onClick={() => act(data.primary!)}>
              {data.primary}
            </Btn>
          )}
        </div>
      </div>
      {data.note && (
        <div className="info-strip">
          <i className="fa-solid fa-circle-info" />
          <div>
            <strong>İşleyiş Notu</strong>
            <p>{data.note}</p>
          </div>
        </div>
      )}
      {data.stats && s.id !== "orders" && (
        <div className="catalog-board">
          {data.stats.map((x) => (
            <article className={x[3]} key={x[0]}>
              <i className={`fa-solid ${x[2]}`} />
              <h4>{x[0]}</h4>
              <b>{x[1]}</b>
              <span>Güncel mağaza verisi</span>
            </article>
          ))}
        </div>
      )}
      {s.id === "orders" && <OrderBoard />}
      {data.fields && <LocalForm s={s} data={data} />}{" "}
      {data.cards && (
        <div className="module-grid functional-modules">
          {data.cards.map((x) => (
            <article key={x[0]}>
              <div>
                <i className="fa-solid fa-sliders" />
              </div>
              <h3>{x[0]}</h3>
              <p>{x[1]}</p>
              <Btn onClick={() => act(x[2], x[0])}>{x[2]}</Btn>
            </article>
          ))}
        </div>
      )}
      {data.tables?.map((t) => (
        <div className="card content-table" key={t.title}>
          <div className="card-head">
            <h3>{t.title}</h3>
          </div>
          <div className="card-body table-scroll">
            <table className="table">
              <thead>
                <tr>
                  {t.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((v, j) => (
                      <td key={j}>
                        {j === row.length - 1 && t.headers[j] === "İşlem" ? (
                          <button
                            className="pill"
                            onClick={() => act(v, row[0])}
                          >
                            {v}
                          </button>
                        ) : v === "BişeyEksik Destek" ? (
                          <SellerBrandLogo className="table-brand-logo" />
                        ) : (
                          v
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}
function LocalForm({ s, data }: { s: SellerSection; data: SellerContentData }) {
  const { notify, logAction } = useSeller();
  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem(
      `biseyeksik_seller_form_${s.id}`,
      JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    );
    logAction(s.title, "Ayarlar kaydedildi");
    notify(`${s.title} kaydedildi`);
  };
  return (
    <form className="card seller-form-card" onSubmit={save}>
      <div className="card-head">
        <h3>{s.title} Ayarları</h3>
        <span className="link">Yerel taslak</span>
      </div>
      <div className="card-body form-grid">
        {data.fields?.map((x, i) => (
          <label
            className={`field ${x.type === "textarea" ? "wide" : ""}`}
            key={x.label}
          >
            {x.label}
            {x.type === "select" ? (
              <select name={`f-${i}`}>
                {x.options?.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            ) : x.type === "textarea" ? (
              <textarea name={`f-${i}`} defaultValue={x.value} />
            ) : (
              <input
                name={`f-${i}`}
                type={x.type === "number" ? "number" : "text"}
                defaultValue={x.value}
              />
            )}
          </label>
        ))}
        <div className="drawer-buttons">
          <button className="btn primary">Kaydet</button>
          <button className="btn" type="reset">
            Temizle
          </button>
        </div>
      </div>
    </form>
  );
}
export function SellerContent() {
  const { active } = useSeller(),
    s = allSections.find((x) => x.id === active) || allSections[0],
    data = sellerContent[s.id];
  return (
    <div className="content">
      {s.id === "dashboard" ? (
        <Dashboard />
      ) : s.id === "products" ? (
        <SellerProducts />
      ) : s.id === "stock" ? (
        <SellerInventory />
      ) : s.id === "seller-top-profile" ? (
        <SellerStoreProfile />
      ) : s.id === "messages" ? (
        <><SellerSupport /><SellerQuestions /></>
      ) : s.id === "campaigns" ? (
        <SellerCampaigns />
      ) : s.id === "finance" ? (
        <SellerFinance />
      ) : s.id === "seller-top-announcements" ? (
        <SellerAnnouncements />
      ) : data ? (
        <Functional s={s} data={data} />
      ) : (
        <div className="page-head">
          <div className="page-title">
            <h1>{s.title}</h1>
            <p>{s.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
