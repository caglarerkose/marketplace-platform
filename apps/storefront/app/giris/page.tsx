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
      displayName = String(form.get("displayName") || "").trim();
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      setLoading(false);
      return;
    }
    const response = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email, password, displayName }),
      }),
      result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(result.error || "İşlem tamamlanamadı.");
      return;
    }
    if (result.message && !result.destination) {
      setError(result.message);
      return;
    }
    router.replace(result.destination || "/hesabim");
    router.refresh();
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
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Giriş Yap
          </button>
          <button
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
