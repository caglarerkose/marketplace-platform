"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useAdmin } from "./admin-shell";

export type AdminPermission = "view" | "support" | "product_approval";
type ManagedAdmin = { id: string; code: string; name: string; email: string; permissions: AdminPermission[]; status: "active" | "passive"; lastSeen: string };

const storageKey = "biseyeksik_admin_users_v1";
const permissionOptions: { id: AdminPermission; title: string; description: string; icon: string }[] = [
  { id: "view", title: "Görüntüleme", description: "Panel verilerini salt okunur görüntüler.", icon: "fa-eye" },
  { id: "support", title: "Destek", description: "Müşteri ve satıcı destek taleplerini yönetir.", icon: "fa-headset" },
  { id: "product_approval", title: "Ürün Onay", description: "Ürün inceleme, onay ve revize işlemlerini yürütür.", icon: "fa-check" },
];
const initialUsers: ManagedAdmin[] = [
  { id: "1", code: "SUPER-001", name: "Çağlar Erkose", email: "caglarerkose@gmail.com", permissions: ["view", "support", "product_approval"], status: "active", lastSeen: "Şimdi" },
  { id: "2", code: "ADM-1002", name: "Ayşe Yılmaz", email: "ayse@biseyeksik.com", permissions: ["view", "support"], status: "active", lastSeen: "Bugün 10:42" },
  { id: "3", code: "ADM-1003", name: "Mehmet Kaya", email: "mehmet@biseyeksik.com", permissions: ["view", "product_approval"], status: "active", lastSeen: "Dün 18:16" },
];
const permissionMap = (users: ManagedAdmin[]) => Object.fromEntries(users.map((user) => [user.id, [...user.permissions]])) as Record<string, AdminPermission[]>;

export function AdminUserManagement() {
  const { notify, logAction } = useAdmin();
  const [users, setUsers] = useState<ManagedAdmin[]>(initialUsers);
  const [draftPermissions, setDraftPermissions] = useState<Record<string, AdminPermission[]>>(() => permissionMap(initialUsers));
  const [query, setQuery] = useState("");
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; confirmLabel: string; onConfirm: () => void } | null>(null);
  const askConfirmation = (title: string, message: string, confirmLabel: string, onConfirm: () => void) =>
    setConfirmation({ title, message, confirmLabel, onConfirm });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    const parsed: ManagedAdmin[] = JSON.parse(saved);
    setUsers(parsed);
    setDraftPermissions(permissionMap(parsed));
  }, []);
  const persist = (next: ManagedAdmin[]) => { setUsers(next); localStorage.setItem(storageKey, JSON.stringify(next)); };
  const selectedPermissions = (user: ManagedAdmin) => draftPermissions[user.id] || user.permissions;
  const togglePermission = (user: ManagedAdmin, permission: AdminPermission) => {
    if (user.code === "SUPER-001") return notify("Super admin yetkileri kaldırılamaz");
    const current = selectedPermissions(user);
    setDraftPermissions((drafts) => ({ ...drafts, [user.id]: current.includes(permission) ? current.filter((value) => value !== permission) : [...current, permission] }));
  };
  const hasPermissionChanges = users.some((user) => [...selectedPermissions(user)].sort().join("|") !== [...user.permissions].sort().join("|"));
  const savePermissions = () => {
    if (!hasPermissionChanges) return notify("Kaydedilecek bir yetki değişikliği yok");
    askConfirmation("Yetki değişikliklerini onayla", "Seçtiğiniz roller ilgili panel kullanıcılarının erişebileceği işlemleri değiştirecek.", "Yetkileri Kaydet", commitPermissions);
  };
  const commitPermissions = () => {
    users.forEach((user) => {
      const after = selectedPermissions(user);
      permissionOptions.forEach((permission) => {
        if (user.permissions.includes(permission.id) === after.includes(permission.id)) return;
        logAction("Kullanıcı Yetkileri", `${user.code} · ${permission.title} yetkisi ${after.includes(permission.id) ? "verildi" : "kaldırıldı"}`);
      });
    });
    const next = users.map((user) => ({ ...user, permissions: selectedPermissions(user) }));
    persist(next);
    setDraftPermissions(permissionMap(next));
    notify("Kullanıcı yetkileri onaylanarak kaydedildi");
  };
  const toggleStatus = (user: ManagedAdmin) => {
    if (user.code === "SUPER-001") return notify("Super admin pasife alınamaz");
    const status = user.status === "active" ? "passive" : "active";
    askConfirmation("Kullanıcı durumunu değiştir", `${user.name} adlı kullanıcı ${status === "active" ? "aktif" : "pasif"} duruma getirilecek.`, status === "active" ? "Aktif Yap" : "Pasife Al", () => {
      persist(users.map((item) => item.id === user.id ? { ...item, status } : item));
      logAction("Kullanıcı Yönetimi", `${user.code} ${status === "active" ? "aktif edildi" : "pasife alındı"}`, status === "passive" ? "critical" : "info");
      notify(`${user.name} ${status === "active" ? "aktif" : "pasif"} durumda`);
    });
  };
  const createUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget), name = String(form.get("name")), email = String(form.get("email"));
    const nextNumber = Math.max(1000, ...users.map((user) => Number(user.code.replace(/\D/g, "")) || 0)) + 1;
    const user: ManagedAdmin = { id: crypto.randomUUID(), code: `ADM-${nextNumber}`, name, email, permissions: ["view"], status: "active", lastSeen: "Henüz giriş yapmadı" };
    askConfirmation("Yeni panel kullanıcısı", `${name} için ${user.code} koduyla Görüntüleme yetkisine sahip bir hesap oluşturulacak.`, "Kullanıcı Oluştur", () => {
      const next = [...users, user];
      persist(next);
      setDraftPermissions(permissionMap(next));
      logAction("Kullanıcı Yönetimi", `${user.code} koduyla ${user.name} oluşturuldu`);
      notify("Panel kullanıcısı onaylanarak oluşturuldu");
      formElement.reset();
    });
  };
  const filtered = users.filter((user) => `${user.code} ${user.name} ${user.email}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR")));

  return <>
    <div className="page-head"><div className="page-title"><h1>Kullanıcılar</h1><p>Super admin olarak panel kullanıcılarını ve erişim kapsamlarını yönetin.</p></div></div>
    <div className="permission-summary">{permissionOptions.map((permission) => <article key={permission.id} className={permission.id === "product_approval" ? "product-approval-summary" : ""}><i className={`fa-solid ${permission.icon}`} /><div><strong>{permission.title}</strong><p>{permission.description}</p></div><b>{users.filter((user) => user.permissions.includes(permission.id) && user.status === "active").length}</b></article>)}</div>
    <div className="grid-2 admin-user-layout">
      <form className="card admin-create-user" onSubmit={createUser}><div className="card-head"><h3>Yeni Panel Kullanıcısı</h3><span className="pill blue">Davet Taslağı</span></div><div className="card-body"><label className="field">Ad Soyad<input name="name" required placeholder="Kullanıcının adı" /></label><label className="field">E-posta<input name="email" required type="email" placeholder="kullanici@biseyeksik.com" /></label><div className="info-strip"><i className="fa-solid fa-circle-info" /><div><strong>Başlangıç yetkisi</strong><p>Yeni kullanıcı yalnızca Görüntüleme yetkisiyle oluşturulur. İşlemden önce onayınız alınır.</p></div></div><button className="btn primary"><i className="fa-solid fa-user-plus" /> Kullanıcı Oluştur</button></div></form>
      <div className="card permission-guide"><div className="card-head"><h3>Yetki Sınırları</h3></div><div className="card-body">{permissionOptions.map((permission) => <div key={permission.id} className={permission.id === "product_approval" ? "product-approval-guide" : ""}><i className={`fa-solid ${permission.icon}`} /><span><strong>{permission.title}</strong><small>{permission.description}</small></span></div>)}</div></div>
    </div>
    <div className="card content-table admin-user-table"><div className="card-head"><h3>Admin Paneli Kullanıcıları</h3><div className="admin-table-tools"><input className="admin-table-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kod, ad veya e-posta ara" /><button className="btn primary permission-save" onClick={savePermissions} disabled={!hasPermissionChanges}><i className="fa-solid fa-floppy-disk" /> Yetkileri Kaydet</button></div></div><div className="card-body table-scroll"><table className="table"><thead><tr><th>Kullanıcı</th><th>Kullanıcı Kodu</th><th>Görüntüleme</th><th>Destek</th><th>Ürün Onay</th><th>Son Aktivite</th><th>Durum</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><b>{user.name}</b><small>{user.email}</small></td><td><code>{user.code}</code>{user.code === "SUPER-001" && <span className="owner-mark">Sahip</span>}</td>{permissionOptions.map((permission) => { const enabled = selectedPermissions(user).includes(permission.id); return <td key={permission.id}><button className={`permission-toggle ${enabled ? "enabled" : ""}`} onClick={() => togglePermission(user, permission.id)} disabled={user.code === "SUPER-001"} aria-label={`${user.name} ${permission.title} yetkisi`}><i className={`fa-solid ${enabled ? "fa-check" : "fa-minus"}`} /></button></td>; })}<td>{user.lastSeen}</td><td><button className={`pill ${user.status === "active" ? "green" : "red"}`} onClick={() => toggleStatus(user)}>{user.status === "active" ? "Aktif" : "Pasif"}</button></td></tr>)}</tbody></table></div></div>
    {confirmation && <div className="admin-confirm-backdrop" role="presentation" onMouseDown={() => setConfirmation(null)}><section className="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" onMouseDown={(event) => event.stopPropagation()}><div className="confirm-brand"><Image src="/img/anayazi.png" width={174} height={35} alt="BişeyEksik" /></div><div className="confirm-icon"><i className="fa-solid fa-shield-halved" /></div><h2 id="admin-confirm-title">{confirmation.title}</h2><p>{confirmation.message}</p><div className="confirm-actions"><button className="btn" onClick={() => setConfirmation(null)}>Vazgeç</button><button className="btn primary" onClick={() => { const action = confirmation.onConfirm; setConfirmation(null); action(); }}><i className="fa-solid fa-check" /> {confirmation.confirmLabel}</button></div></section></div>}
  </>;
}
