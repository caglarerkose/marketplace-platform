"use client";

import { useEffect, useMemo, useState } from "react";

type AuditEntry = {
  id?: string;
  date: string;
  user?: string;
  userCode?: string;
  module: string;
  message: string;
  risk: string;
  session?: string;
};
const initialLogs: AuditEntry[] = [
  {
    id: "LOG-24851",
    date: "20.08.2026 11:42:18",
    user: "Çağlar Erkose",
    userCode: "SUPER-001",
    module: "Kullanıcı Yetkileri",
    message: "ADM-1003 kullanıcısına Ürün Onay yetkisi verildi",
    risk: "info",
    session: "WEB-7F31",
  },
  {
    id: "LOG-24850",
    date: "20.08.2026 11:36:04",
    user: "Ayşe Yılmaz",
    userCode: "ADM-1002",
    module: "Destek",
    message: "#STK-84521 destek talebi yanıtlandı",
    risk: "info",
    session: "WEB-2A18",
  },
  {
    id: "LOG-24849",
    date: "20.08.2026 10:58:37",
    user: "Mehmet Kaya",
    userCode: "ADM-1003",
    module: "Ürün Onay",
    message: "8690000000000 barkodlu ürün revizeye gönderildi",
    risk: "critical",
    session: "WEB-91BC",
  },
];

export function AdminAuditPanel() {
  const [logs, setLogs] = useState<AuditEntry[]>(initialLogs);
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("all");
  const read = () => {
    const saved: AuditEntry[] = JSON.parse(
      localStorage.getItem("biseyeksik_admin_audit_v1") || "[]",
    );
    setLogs([...saved, ...initialLogs]);
  };
  useEffect(read, []);
  const filtered = useMemo(
    () =>
      logs.filter((entry) => {
        const matchesQuery =
          `${entry.userCode} ${entry.user} ${entry.module} ${entry.message}`
            .toLocaleLowerCase("tr-TR")
            .includes(query.toLocaleLowerCase("tr-TR"));
        return matchesQuery && (risk === "all" || entry.risk === risk);
      }),
    [logs, query, risk],
  );

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>İşlem Logları</h1>
          <p>
            Panel kullanıcılarının yaptığı işlemleri kullanıcı kodu, tarih, saat
            ve oturum bilgisiyle inceleyin.
          </p>
        </div>
        <div className="head-actions">
          <button className="btn" onClick={read}>
            <i className="fa-solid fa-rotate" /> Yenile
          </button>
          <button className="btn primary" onClick={() => window.print()}>
            <i className="fa-solid fa-file-export" /> Dışa Aktar
          </button>
        </div>
      </div>
      <div className="audit-kpis">
        <article>
          <i className="fa-solid fa-list-check" />
          <span>
            Toplam Kayıt<b>{logs.length}</b>
          </span>
        </article>
        <article>
          <i className="fa-solid fa-triangle-exclamation" />
          <span>
            Kritik İşlem
            <b>{logs.filter((entry) => entry.risk === "critical").length}</b>
          </span>
        </article>
        <article>
          <i className="fa-solid fa-users" />
          <span>
            Aktif Kullanıcı
            <b>
              {new Set(logs.map((entry) => entry.userCode || entry.user)).size}
            </b>
          </span>
        </article>
      </div>
      <div className="card content-table audit-table">
        <div className="audit-toolbar">
          <label>
            <i className="fa-solid fa-magnifying-glass" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Kullanıcı kodu, modül veya işlem ara"
            />
          </label>
          <select
            value={risk}
            onChange={(event) => setRisk(event.target.value)}
          >
            <option value="all">Tüm riskler</option>
            <option value="info">Bilgi</option>
            <option value="critical">Kritik</option>
          </select>
        </div>
        <div className="card-body table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Tarih / Saat</th>
                <th>Kullanıcı</th>
                <th>Kod</th>
                <th>Modül</th>
                <th>İşlem Detayı</th>
                <th>Oturum</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((entry, index) => (
                  <tr key={`${entry.id || entry.date}-${index}`}>
                    <td>
                      <code>
                        {entry.id ||
                          `LOCAL-${String(index + 1).padStart(4, "0")}`}
                      </code>
                    </td>
                    <td>{entry.date}</td>
                    <td>{entry.user || "Super Admin"}</td>
                    <td>
                      <code>{entry.userCode || "SUPER-001"}</code>
                    </td>
                    <td>
                      <span className="pill blue">{entry.module}</span>
                    </td>
                    <td>{entry.message}</td>
                    <td>{entry.session || "LOCAL-DEMO"}</td>
                    <td>
                      <span
                        className={`pill ${entry.risk === "critical" ? "red" : "green"}`}
                      >
                        {entry.risk === "critical" ? "Kritik" : "Bilgi"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>Filtreye uygun log kaydı bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
