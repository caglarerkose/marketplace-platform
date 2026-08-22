"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userCode: String(form.get("userCode")),
        password: String(form.get("password")),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Giriş yapılamadı.");
      setLoading(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="login-logo">
          <Image
            src="/img/anayazi.png"
            width={230}
            height={48}
            priority
            alt="BişeyEksik"
          />
        </div>
        <span className="login-security">
          <i className="fa-solid fa-shield-halved" /> Güvenli Yönetim Girişi
        </span>
        <h1>Yönetim paneline giriş yap</h1>
        <p>Size tanımlanan kullanıcı kodu ve şifrenizle devam edin.</p>
        <form onSubmit={handleSubmit}>
          <label className="field">
            Kullanıcı Kodu
            <div className="login-input">
              <i className="fa-solid fa-user-shield" />
              <input
                name="userCode"
                required
                autoComplete="username"
                placeholder="SUPER-001"
              />
            </div>
          </label>
          <label className="field">
            Şifre
            <div className="login-input">
              <i className="fa-solid fa-lock" />
              <input
                name="password"
                required
                minLength={8}
                type="password"
                autoComplete="current-password"
                placeholder="Şifrenizi girin"
              />
            </div>
          </label>
          {error && (
            <div className="login-error">
              <i className="fa-solid fa-circle-exclamation" />
              {error}
            </div>
          )}
          <button className="btn primary login-submit" disabled={loading}>
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Kontrol ediliyor
              </>
            ) : (
              <>
                Güvenli Giriş <i className="fa-solid fa-arrow-right" />
              </>
            )}
          </button>
        </form>
        <small>
          <i className="fa-solid fa-lock" /> Oturumunuz güvenli çerezler ve
          kimlik doğrulama sistemiyle korunur.
        </small>
      </section>
    </main>
  );
}
