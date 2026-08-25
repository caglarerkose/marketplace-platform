"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthHeader } from "@/components/auth-header";

export default function SetPassword() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const prepare = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("error") || params.get("hata")) throw new Error("invalid_invitation");
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("invalid_invitation");
        if (active) setReady(true);
      } catch {
        if (active) setError("Aktivasyon bağlantısı geçersiz veya süresi dolmuş.");
      }
    };
    void prepare();
    return () => {
      active = false;
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Şifre kaydedilemedi.");
        return;
      }
      router.replace("/panel");
      router.refresh();
    } catch {
      setError("Şifre kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthHeader showSellerLogin={false} />
      <main className="auth-main password-main">
        <form className="login-card-ref" onSubmit={submit}>
          <h2>Şifrenizi Belirleyin</h2>
          <p>Satıcı hesabınız için yalnızca sizin bildiğiniz güvenli bir şifre oluşturun.</p>
          {error && (
            <div className="apply-error">
              <i className="fa-solid fa-circle-exclamation" />
              {error}
            </div>
          )}
          {ready && (
            <>
              <label className="login-input">
                <i className="fa-solid fa-lock" />
                <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Yeni şifre" />
              </label>
              <label className="login-input">
                <i className="fa-solid fa-lock" />
                <input name="confirm" type="password" required minLength={8} autoComplete="new-password" placeholder="Yeni şifre tekrar" />
              </label>
              <button className="auth-primary-btn" disabled={saving}>
                {saving ? "KAYDEDİLİYOR..." : "ŞİFREYİ KAYDET"}
              </button>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
