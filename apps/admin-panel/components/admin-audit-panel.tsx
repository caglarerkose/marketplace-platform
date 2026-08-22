"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "./admin-shell";

type AuditEntry = {
  id: number;
  actor_user_code: string | null;
  action: string;
  module: string;
  entity_type: string | null;
  entity_id: string | null;
  risk: "info" | "warning" | "critical";
  details: Record<string, unknown>;
  created_at: string;
};

export function AdminAuditPanel() {
  const { notify } = useAdmin();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("all");
  const [loading, setLoading] = useState(true);
  const read = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/audit-logs", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      notify(result.error || "İşlem logları alınamadı");
      setLoading(false);
      return;
    }
    setLogs(result.logs);
    setLoading(false);
  }, [notify]);
  useEffect(() => { void read(); }, [read]);

  const filtered = useMemo(() => logs.filter((entry) => {
    const matchesQuery = `${entry.actor_user_code} ${entry.module} ${entry.action} ${entry.entity_id}`
      .toLocaleLowerCase("tr-TR")
      .includes(query.toLocaleLowerCase("tr-TR"));
    return matchesQuery && (risk === "all" || entry.risk === risk);
  }), [logs, query, risk]);
  const formatDate = (value: string) => new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));

  return <>
    <div className="page-head"><div className="page-title"><h1>İşlem Logları</h1><p>Değiştirilemez işlem geçmişini kullanıcı kodu ve zaman bilgisiyle inceleyin.</p></div><div className="head-actions"><button className="btn" onClick={() => void read()}><i className="fa-solid fa-rotate" /> Yenile</button><button className="btn primary" onClick={() => window.print()}><i className="fa-solid fa-file-export" /> Dışa Aktar</button></div></div>
    <div className="audit-kpis"><article><i className="fa-solid fa-list-check" /><span>Toplam Kayıt<b>{logs.length}</b></span></article><article><i className="fa-solid fa-triangle-exclamation" /><span>Kritik İşlem<b>{logs.filter((entry) => entry.risk === "critical").length}</b></span></article><article><i className="fa-solid fa-users" /><span>İşlem Yapan<b>{new Set(logs.map((entry) => entry.actor_user_code).filter(Boolean)).size}</b></span></article></div>
    <div className="card content-table audit-table"><div className="audit-toolbar"><label><i className="fa-solid fa-magnifying-glass" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kullanıcı kodu, modül veya işlem ara" /></label><select value={risk} onChange={(event) => setRisk(event.target.value)}><option value="all">Tüm riskler</option><option value="info">Bilgi</option><option value="warning">Uyarı</option><option value="critical">Kritik</option></select></div><div className="card-body table-scroll"><table className="table"><thead><tr><th>Log ID</th><th>Tarih / Saat</th><th>Kullanıcı Kodu</th><th>Modül</th><th>İşlem Detayı</th><th>Kayıt</th><th>Risk</th></tr></thead><tbody>{loading?<tr><td colSpan={7}>Loglar yükleniyor…</td></tr>:filtered.length?filtered.map((entry) => <tr key={entry.id}><td><code>LOG-{String(entry.id).padStart(6, "0")}</code></td><td>{formatDate(entry.created_at)}</td><td><code>{entry.actor_user_code || "SYSTEM"}</code></td><td><span className="pill blue">{entry.module}</span></td><td>{entry.action}</td><td>{entry.entity_type || "—"}{entry.entity_id ? ` · ${entry.entity_id.slice(0, 12)}` : ""}</td><td><span className={`pill ${entry.risk === "critical" ? "red" : entry.risk === "warning" ? "yellow" : "green"}`}>{entry.risk === "critical" ? "Kritik" : entry.risk === "warning" ? "Uyarı" : "Bilgi"}</span></td></tr>):<tr><td colSpan={7}>Filtreye uygun log kaydı bulunamadı.</td></tr>}</tbody></table></div></div>
  </>;
}
