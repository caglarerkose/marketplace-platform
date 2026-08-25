"use client";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerLogin() {
  const router = useRouter(),
    [mode, setMode] = useState<"login" | "register">("login"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget),
      email = String(form.get("email") || "")
        .trim()
        .toLowerCase(),
      password = String(form.get("password") || ""),
      confirmPassword = String(form.get("confirmPassword") || ""),
      displayName = String(form.get("displayName") || "").trim();
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      setLoading(false);
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          email,
          password,
          confirmPassword,
          displayName,
        }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error || "İşlem tamamlanamadı.");
        return;
      }
      router.replace(result?.destination || "/hesabim");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof DOMException && requestError.name === "AbortError"
          ? "İşlem zaman aşımına uğradı. Lütfen tekrar deneyin."
          : "Bağlantı kurulamadı. Lütfen tekrar deneyin.",
      );
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }
  return (
    <div className="customer-auth-page">
      <section className="customer-auth-card">
        <Image
          src="/img/anayazi.png"
          width={220}
          height={46}
          alt="BişeyEksik"
          priority
        />
        <div className="customer-auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Hesap Oluştur
          </button>
        </div>
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Ad Soyad
              <input
                name="displayName"
                required
                minLength={2}
                maxLength={120}
              />
            </label>
          )}
          <label>
            E-posta
            <input name="email" type="email" required maxLength={254} />
          </label>
          <label>
            Şifre
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>
          {mode === "register" && (
            <label>
              Şifre Tekrar
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
          )}
          {error && (
            <div className="customer-auth-message" role="alert">
              {error}
            </div>
          )}
          <button className="customer-auth-submit" disabled={loading}>
            {loading
              ? "İşleniyor..."
              : mode === "login"
                ? "Giriş Yap"
                : "Hesap Oluştur"}
          </button>
        </form>
      </section>
    </div>
  );
}
