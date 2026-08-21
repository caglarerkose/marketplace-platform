"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAdmin } from "./admin-shell";

export type AdminPermission = "view" | "support" | "product_approval";
type ManagedAdmin = {
  id: string;
  code: string;
  name: string;
  email: string;
  permissions: AdminPermission[];
  status: "active" | "passive";
  lastSeen: string | null;
  isSuperAdmin: boolean;
};
type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
};

const permissionOptions: {
  id: AdminPermission;
  title: string;
  description: string;
  icon: string;
}[] = [
  { id: "view", title: "Görüntüleme", description: "Panel verilerini salt okunur görüntüler.", icon: "fa-eye" },
  { id: "support", title: "Destek", description: "Müşteri ve satıcı destek taleplerini yönetir.", icon: "fa-headset" },
  { id: "product_approval", title: "Ürün Onay", description: "Ürün inceleme, onay ve revize işlemlerini yürütür.", icon: "fa-check" },
];

const permissionMap = (users: ManagedAdmin[]) =>
  Object.fromEntries(users.map((user) => [user.id, [...user.permissions]])) as Record<string, AdminPermission[]>;

export function AdminUserManagement() {
  const { notify } = useAdmin();
  const [users, setUsers] = useState<ManagedAdmin[]>([]);
  const [draftPermissions, setDraftPermissions] = useState<Record<string, AdminPermission[]>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      notify(result.error || "Kullanıcılar alınamadı");
      setLoading(false);
      return;
    }
    setUsers(result.users);
    setDraftPermissions(permissionMap(result.users));
    setLoading(false);
  }, [notify]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const askConfirmation = (title: string, message: string, confirmLabel: string, onConfirm: Confirmation["onConfirm"]) =>
    setConfirmation({ title, message, confirmLabel, onConfirm });
  const selectedPermissions = (user: ManagedAdmin) => draftPermissions[user.id] || user.permissions;
  const togglePermission = (user: ManagedAdmin, permission: AdminPermission) => {
    if (user.isSuperAdmin) return notify("Super Admin yetkileri kaldırılamaz");
    const current = selectedPermissions(user);
    setDraftPermissions((drafts) => ({
      ...drafts,
      [user.id]: current.includes(permission)
        ? current.filter((value) => value !== permission)
        : [...current, permission],
    }));
  };
  const changedUsers = users.filter((user) =>
    [...selectedPermissions(user)].sort().join("|") !== [...user.permissions].sort().join("|"),
  );
  const savePermissions = () => {
    if (!changedUsers.length) return notify("Kaydedilecek bir yetki değişikliği yok");
    askConfirmation(
      "Yetki değişikliklerini onayla",
      `${changedUsers.length} panel kullanıcısının erişim kapsamı değiştirilecek.`,
      "Yetkileri Kaydet",
      async () => {
        const responses = await Promise.all(changedUsers.map((user) => fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: selectedPermissions(user) }),
        })));
        if (responses.some((response) => !response.ok)) return notify("Bazı yetkiler kaydedilemedi");
        await loadUsers();
        notify("Kullanıcı yetkileri Supabase’e kaydedildi");
      },
    );
  };
  const toggleStatus = (user: ManagedAdmin) => {
    if (user.isSuperAdmin) return notify("Super Admin pasife alınamaz");
    const status = user.status === "active" ? "passive" : "active";
    askConfirmation(
      "Kullanıcı durumunu değiştir",
      `${user.name} adlı kullanıcı ${status === "active" ? "aktif" : "pasif"} duruma getirilecek.`,
      status === "active" ? "Aktif Yap" : "Pasife Al",
      async () => {
        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const result = await response.json();
        if (!response.ok) return notify(result.error || "Kullanıcı durumu değiştirilemedi");
        await loadUsers();
        notify(`${user.name} ${status === "active" ? "aktif" : "pasif"} durumda`);
      },
    );
  };
  const createUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name"));
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    askConfirmation(
      "Yeni panel kullanıcısı",
      `${name} için Görüntüleme yetkisine sahip bir yönetim hesabı oluşturulacak.`,
      "Kullanıcı Oluştur",
      async () => {
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, permissions: ["view"] }),
        });
        const result = await response.json();
        if (!response.ok) return notify(result.error || "Kullanıcı oluşturulamadı");
        formElement.reset();
        await loadUsers();
        notify(`${result.userCode} kodlu panel kullanıcısı oluşturuldu`);
      },
    );
  };
  const filtered = users.filter((user) =>
    `${user.code} ${user.name} ${user.email}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR")),
  );
  const formatLastSeen = (value: string | null) => value
    ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
    : "Henüz giriş yapmadı";

  return <>
    <div className="page-head"><div className="page-title"><h1>Kullanıcılar</h1><p>Panel kullanıcılarını ve gerçek Supabase erişim yetkilerini yönetin.</p></div></div>
    <div className="permission-summary">{permissionOptions.map((permission) => <article key={permission.id} className={permission.id === "product_approval" ? "product-approval-summary" : ""}><i className={`fa-solid ${permission.icon}`} /><div><strong>{permission.title}</strong><p>{permission.description}</p></div><b>{users.filter((user) => user.permissions.includes(permission.id) && user.status === "active").length}</b></article>)}</div>
    <div className="grid-2 admin-user-layout">
      <form className="card admin-create-user" onSubmit={createUser}><div className="card-head"><h3>Yeni Panel Kullanıcısı</h3><span className="pill green">Supabase Auth</span></div><div className="card-body"><label className="field">Ad Soyad<input name="name" required minLength={2} placeholder="Kullanıcının adı" /></label><label className="field">E-posta<input name="email" required type="email" placeholder="kullanici@biseyeksik.com" /></label><label className="field">Geçici Şifre<input name="password" required minLength={12} type="password" autoComplete="new-password" placeholder="En az 12 karakter" /></label><div className="info-strip"><i className="fa-solid fa-circle-info" /><div><strong>Başlangıç yetkisi</strong><p>Yeni kullanıcı Görüntüleme yetkisiyle oluşturulur. Diğer yetkileri oluşturduktan sonra verebilirsiniz.</p></div></div><button className="btn primary"><i className="fa-solid fa-user-plus" /> Kullanıcı Oluştur</button></div></form>
      <div className="card permission-guide"><div className="card-head"><h3>Yetki Sınırları</h3></div><div className="card-body">{permissionOptions.map((permission) => <div key={permission.id} className={permission.id === "product_approval" ? "product-approval-guide" : ""}><i className={`fa-solid ${permission.icon}`} /><span><strong>{permission.title}</strong><small>{permission.description}</small></span></div>)}</div></div>
    </div>
    <div className="card content-table admin-user-table"><div className="card-head"><h3>Admin Paneli Kullanıcıları</h3><div className="admin-table-tools"><input className="admin-table-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kod, ad veya e-posta ara" /><button className="btn primary permission-save" onClick={savePermissions} disabled={!changedUsers.length}><i className="fa-solid fa-floppy-disk" /> Yetkileri Kaydet</button></div></div><div className="card-body table-scroll"><table className="table"><thead><tr><th>Kullanıcı</th><th>Kullanıcı Kodu</th><th>Görüntüleme</th><th>Destek</th><th>Ürün Onay</th><th>Son Aktivite</th><th>Durum</th></tr></thead><tbody>{loading?<tr><td colSpan={7}>Kullanıcılar yükleniyor…</td></tr>:filtered.map((user) => <tr key={user.id}><td><b>{user.name}</b><small>{user.email}</small></td><td><code>{user.code}</code>{user.isSuperAdmin && <span className="owner-mark">Sahip</span>}</td>{permissionOptions.map((permission) => { const enabled = selectedPermissions(user).includes(permission.id); return <td key={permission.id}><button className={`permission-toggle ${enabled ? "enabled" : ""}`} onClick={() => togglePermission(user, permission.id)} disabled={user.isSuperAdmin} aria-label={`${user.name} ${permission.title} yetkisi`}><i className={`fa-solid ${enabled ? "fa-check" : "fa-minus"}`} /></button></td>; })}<td>{formatLastSeen(user.lastSeen)}</td><td><button className={`pill ${user.status === "active" ? "green" : "red"}`} onClick={() => toggleStatus(user)}>{user.status === "active" ? "Aktif" : "Pasif"}</button></td></tr>)}</tbody></table></div></div>
    {confirmation && <div className="admin-confirm-backdrop" role="presentation" onMouseDown={() => setConfirmation(null)}><section className="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" onMouseDown={(event) => event.stopPropagation()}><div className="confirm-brand"><Image src="/img/anayazi.png" width={174} height={35} alt="BişeyEksik" /></div><div className="confirm-icon"><i className="fa-solid fa-shield-halved" /></div><h2 id="admin-confirm-title">{confirmation.title}</h2><p>{confirmation.message}</p><div className="confirm-actions"><button className="btn" onClick={() => setConfirmation(null)}>Vazgeç</button><button className="btn primary" onClick={() => { const action = confirmation.onConfirm; setConfirmation(null); void action(); }}><i className="fa-solid fa-check" /> {confirmation.confirmLabel}</button></div></section></div>}
  </>;
}
