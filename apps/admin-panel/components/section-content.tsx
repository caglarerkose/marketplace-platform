"use client";
import { useEffect, useState } from "react";
import type { AdminSection } from "@/data/admin";
import {
  sectionContent,
  type SectionContent as SectionData,
} from "@/data/section-content";
import { useAdmin, type DrawerRequest, type DrawerType } from "./admin-shell";
import { AdminAuditPanel } from "./admin-audit-panel";
import { AdminUserManagement } from "./admin-user-management";
const statusClass = (v: string) =>
  /Aktif|Onay|Tamam|Hazır|Başarılı|Yayında|Teslim/.test(v)
    ? "green"
    : /Eksik|Risk|Hata|Sorun|Reddet|Okunmuyor/.test(v)
      ? "red"
      : /Bek|Kontrol|Plan|İncele|Kargo/.test(v)
        ? "yellow"
        : "blue";
const drawerFor = (
  section: string,
  action: string,
  record?: string,
): DrawerRequest => {
  const a = `${section} ${action}`;
  let type: DrawerType = "generic";
  if (/Eksik İste/.test(a)) type = "sellerMissingDocs";
  else if (/Reddet|Reddi/.test(a)) type = "sellerReject";
  else if (/Evrak|Belge|Kontrol Et|Seti Onayla/.test(a))
    type = "documentReview";
  else if (section === "sellers" && /İncele|Detay/.test(a))
    type = "sellerDetail";
  else if (/Satıcı Onay|Yeni Satıcı/.test(a)) type = "sellerApprove";
  else if (/Kampanya/.test(a)) type = "campaign";
  else if (/Duyuru/.test(a)) type = "announcement";
  else if (/Kupon/.test(a)) type = "coupon";
  else if (/Rapor|Dışa Aktar|CSV/.test(a)) type = "report";
  else if (/Katalog Eşleş|Eşleşme/.test(a)) type = "catalogMatch";
  else if (/Ürün Onay|Yeni Kart|Bağla/.test(a)) type = "productApproval";
  else if (/Kategori Ekle|Kategori.*Düzenle/.test(a)) type = "categoryEdit";
  else if (/Kategori|Filtre Eşleştir/.test(a)) type = "categoryMove";
  else if (/Kolon|Kural/.test(a) && section === "product-imports")
    type = "importMap";
  else if (/Aktarım İncele/.test(a)) type = "importReview";
  else if (/Hata|Detay/.test(a) && section === "product-imports")
    type = "importError";
  else if (/Revize/.test(a)) type = "productReject";
  else if (/Yanıt|Talep/.test(a) && section === "support") type = "ticket";
  else if (/Bildirim/.test(a)) type = "broadcast";
  else if (/Fark/.test(a)) type = "earningAdjustment";
  else if (/Simülasyon|Hesapla/.test(a) && section === "commissions")
    type = "commissionSimulation";
  else if (/Oran|Düzenle/.test(a) && section === "commissions")
    type = "commissionRate";
  else if (/Banner/.test(a)) type = "bannerEdit";
  return { type, title: action, record };
};
function SectionExtras({ id }: { id: string }) {
  const { notify, openDrawer, logAction } = useAdmin();
  const [orders, setOrders] = useState([
    {
      id: "GET-10482",
      seller: "TeknoLife",
      status: "Kargolanacak",
      issue: false,
    },
    {
      id: "GET-10481",
      seller: "ModaVitrin",
      status: "Teslim Onayı",
      issue: false,
    },
  ]);
  const update = (i: number, status: string, issue = false) => {
    setOrders((x) => x.map((o, n) => (n === i ? { ...o, status, issue } : o)));
    logAction(
      "Sipariş",
      `${orders[i]?.id}: ${status}`,
      issue ? "critical" : "info",
    );
    notify(`Sipariş ${status} durumuna alındı`);
  };
  if (id === "orders")
    return (
      <div className="card content-table">
        <div className="card-head">
          <h3>GeT Akış Panosu</h3>
          <button
            className="btn"
            onClick={() => notify("Sipariş panosu yenilendi")}
          >
            Yenile
          </button>
        </div>
        <div className="card-body table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Sipariş</th>
                <th>Satıcı</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o.id}>
                  <td>
                    <b>{o.id}</b>
                  </td>
                  <td>{o.seller}</td>
                  <td>
                    <span className={`pill ${o.issue ? "red" : "yellow"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      onClick={() =>
                        openDrawer({
                          type: "generic",
                          title: "Sipariş Detayı",
                          record: o.id,
                        })
                      }
                    >
                      Detay
                    </button>
                    <button onClick={() => update(i, "Kargolanacak")}>
                      Takip İste
                    </button>
                    <button onClick={() => update(i, "Teslim Onayı")}>
                      GeT Onay
                    </button>
                    <button onClick={() => update(i, "Hakedişe Gönderildi")}>
                      Hakedişe Gönder
                    </button>
                    <button onClick={() => update(i, "Sorunlu", true)}>
                      Sorunlu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  if (id === "reports")
    return (
      <div className="quickbar section-quick">
        <strong>Rapor İşlemleri</strong>
        {[
          "Grafik Modu Değiştir",
          "Raporu Kaydet",
          "Finans Özeti",
          "Rapor Verilerini Sıfırla",
        ].map((x) => (
          <button
            className="btn"
            key={x}
            onClick={() => {
              logAction("Raporlar", x);
              notify(`${x} tamamlandı`);
            }}
          >
            {x}
          </button>
        ))}
      </div>
    );
  if (id === "top-logs") return <AuditLog />;
  return null;
}
function AuditLog() {
  const [logs, setLogs] = useState<
    {
      date: string;
      user: string;
      module: string;
      message: string;
      risk: string;
    }[]
  >([]);
  const read = () =>
    setLogs(
      JSON.parse(localStorage.getItem("biseyeksik_admin_audit_v1") || "[]"),
    );
  useEffect(read, []);
  return (
    <div className="card content-table">
      <div className="card-head">
        <h3>Canlı Denetim Günlüğü</h3>
        <button className="btn" onClick={read}>
          Yenile
        </button>
      </div>
      <div className="card-body table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Kullanıcı</th>
              <th>Modül</th>
              <th>İşlem</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {logs.length ? (
              logs.map((x, i) => (
                <tr key={i}>
                  <td>{x.date}</td>
                  <td>{x.user}</td>
                  <td>{x.module}</td>
                  <td>{x.message}</td>
                  <td>
                    <span
                      className={`pill ${x.risk === "critical" ? "red" : "blue"}`}
                    >
                      {x.risk}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>Henüz yerel işlem kaydı yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function SectionContent({ section }: { section: AdminSection }) {
  const data = sectionContent[section.id],
    { openDrawer, notify, logAction } = useAdmin();
  if (section.id === "admin-users") return <AdminUserManagement />;
  if (section.id === "audit-logs" || section.id === "top-logs")
    return <AdminAuditPanel />;
  if (!data) return <Fallback section={section} />;
  const act = (label: string, record?: string) => {
    if (/Yenile/.test(label)) {
      notify(`${section.title} yenilendi`);
      return;
    }
    if (/Demo/.test(label)) {
      localStorage.setItem(
        `biseyeksik_admin_${section.id}`,
        JSON.stringify({ seeded: true, date: new Date().toISOString() }),
      );
      logAction(section.title, `${label} çalıştırıldı`);
      notify("Demo verileri yüklendi");
      return;
    }
    openDrawer(drawerFor(section.id, label, record));
  };
  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>{section.title}</h1>
          <p>{section.description}</p>
        </div>
        <div className="head-actions">
          {data.secondary && (
            <button className="btn" onClick={() => act(data.secondary!)}>
              {data.secondary}
            </button>
          )}
          <button className="btn primary" onClick={() => act(data.primary)}>
            {data.primary}
          </button>
        </div>
      </div>
      {data.stats && (
        <div className="status-board">
          {data.stats.map(([label, value, icon, tone]) => (
            <div className={`status-card ${tone}`} key={label}>
              <i className={`fa-solid ${icon}`} />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
      {data.note && (
        <div className="info-strip section-note">
          <i className="fa-solid fa-circle-info" />
          <div>
            <strong>Kontrol kuralı</strong>
            <p>{data.note}</p>
          </div>
        </div>
      )}
      {data.steps && (
        <div className="workflow">
          {data.steps.map(([title, text], i) => (
            <div className="workflow-step" key={title}>
              <b>
                <i>{i + 1}</i>
                {title}
              </b>
              <span>{text}</span>
            </div>
          ))}
        </div>
      )}
      <SectionExtras id={section.id} />
      {data.fields && <LocalForm section={section} data={data} />}{" "}
      {data.cards && (
        <div className="module-grid content-modules">
          {data.cards.map(([title, text, action]) => (
            <article className="module-card" key={title}>
              <div className="big-icon">
                <i className="fa-solid fa-sliders" />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <button className="btn" onClick={() => act(action, title)}>
                {action}
                <i className="fa-solid fa-arrow-right" />
              </button>
            </article>
          ))}
        </div>
      )}
      {data.tables?.map((table) => (
        <div className="card content-table" key={table.title}>
          <div className="card-head">
            <h3>{table.title}</h3>
            {table.hint && <span className="link">{table.hint}</span>}
          </div>
          <div className="card-body table-scroll">
            <table className="table">
              <thead>
                <tr>
                  {table.headers.map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((value, j) => (
                      <td key={`${i}-${j}`}>
                        {j === row.length - 1 ? (
                          <button
                            className={`pill ${statusClass(value)}`}
                            onClick={() => act(value, row[0])}
                          >
                            {value}
                          </button>
                        ) : (
                          value
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
function LocalForm({
  section,
  data,
}: {
  section: AdminSection;
  data: SectionData;
}) {
  const { notify, logAction } = useAdmin();
  const key = `biseyeksik_admin_form_${section.id}`;
  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem(
      key,
      JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    );
    logAction(section.title, "Form kaydedildi");
    notify(`${section.title} kaydedildi`);
  };
  return (
    <form className="card content-form" onSubmit={save}>
      <div className="card-head">
        <h3>{section.title} Oluştur / Güncelle</h3>
        <span className="link">Yerel taslak</span>
      </div>
      <div className="card-body">
        <div className="form-grid">
          {data.fields?.map((x, i) => (
            <label
              className={`field ${x.type === "textarea" ? "full" : ""}`}
              key={x.label}
            >
              {x.label}
              {x.type === "select" ? (
                <select name={`field-${i}`}>
                  {x.options?.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              ) : x.type === "textarea" ? (
                <textarea name={`field-${i}`} defaultValue={x.value} />
              ) : (
                <input name={`field-${i}`} defaultValue={x.value} />
              )}
            </label>
          ))}
        </div>
        <div className="form-actions">
          <button className="btn primary">Kaydet</button>
          <button className="btn" type="reset">
            Formu Temizle
          </button>
        </div>
      </div>
    </form>
  );
}
function Fallback({ section }: { section: AdminSection }) {
  const { openDrawer } = useAdmin();
  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>{section.title}</h1>
          <p>{section.description}</p>
        </div>
        <button
          className="btn primary"
          onClick={() => openDrawer({ type: "generic", title: section.title })}
        >
          Yeni İşlem
        </button>
      </div>
    </>
  );
}
