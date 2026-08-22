"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthHeader } from "@/components/auth-header";
import { SellerCinematicScene } from "@/components/seller-cinematic-scene";
import { SellerBrandLogo } from "@/components/seller-brand-logo";
export default function Login() {
  const router = useRouter();
  const [error,setError]=useState(""),[loading,setLoading]=useState(false),[resetMessage,setResetMessage]=useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);setError("");setResetMessage("");
    const form=new FormData(e.currentTarget),email=String(form.get("email")),password=String(form.get("password"));
    const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    const result=await response.json();setLoading(false);
    if(!response.ok){setError(result.error||"Giriş yapılamadı.");return}
    router.replace(result.destination);router.refresh();
  }
  async function resetPassword(){const email=(document.querySelector<HTMLInputElement>('#seller-email')?.value||"").trim();setError("");setResetMessage("");const response=await fetch("/api/auth/password-reset",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})}),result=await response.json();if(!response.ok){setError(result.error||"Şifre bağlantısı gönderilemedi.");return}setResetMessage(result.message)}
  return (
    <div className="auth-page">
      <AuthHeader showSellerLogin={false} />
      <main className="auth-main auth-login-main">
        <form className="login-card-ref" onSubmit={submit}>
          <h2>Satıcı Paneline Giriş</h2>
          <p>Mağazanızı yönetmek için bilgilerinizi girin.</p>
          <label className="login-input">
            <i className="fa-regular fa-envelope" />
            <input id="seller-email" name="email" type="email" required autoComplete="username" placeholder="E-posta adresiniz" />
          </label>
          <label className="login-input">
            <i className="fa-solid fa-lock" />
            <input name="password" type="password" required minLength={8} maxLength={128} autoComplete="current-password" placeholder="Şifreniz" />
          </label>
          <div className="login-options-ref">
            <label>
              <input type="checkbox" /> Beni hatırla
            </label>
            <button type="button" className="login-reset-link" onClick={()=>void resetPassword()}>Şifremi unuttum</button>
          </div>
          {error&&<div className="apply-error"><i className="fa-solid fa-circle-exclamation"/>{error}</div>}
          {resetMessage&&<div className="login-reset-message"><i className="fa-solid fa-envelope-circle-check"/>{resetMessage}</div>}
          <button className="auth-primary-btn" disabled={loading}>{loading?"KONTROL EDİLİYOR...":"GİRİŞ YAP"}</button>
          <Link className="auth-outline-btn" href="/apply">
            Satıcı değil misiniz? Başvurun
          </Link>
        </form>
        <div className="login-center">
          <SellerCinematicScene />
        </div>
        <section className="login-copy">
          <h1>
            Mağazanı yönet, satışlarını <span>büyüt.</span>
          </h1>
          <p>
            <SellerBrandLogo /> satıcı araçlarıyla ürünlerinizi, siparişlerinizi ve
            finansınızı tek noktadan yönetin.
          </p>
          <div className="login-bullets">
            <span>
              <i className="fa-solid fa-check" /> Kolay ürün ve stok yönetimi
            </span>
            <span>
              <i className="fa-solid fa-check" /> Detaylı satış raporları
            </span>
            <span>
              <i className="fa-solid fa-check" /> Hızlı destek ve güvenli ödeme
            </span>
          </div>
        </section>
        <div className="login-feature-row">
          {[
            [
              "fa-box",
              "Ürünlerini Yönet",
              "Katalog ve stoklarını hızlıca güncelle.",
            ],
            [
              "fa-truck-fast",
              "Siparişleri Takip Et",
              "Kargo süreçlerini tek ekrandan yönet.",
            ],
            [
              "fa-chart-pie",
              "Satışlarını Büyüt",
              "Performansını verilerle geliştir.",
            ],
          ].map((x) => (
            <article key={x[1]}>
              <i className={`fa-solid ${x[0]}`} />
              <div>
                <strong>{x[1]}</strong>
                <p>{x[2]}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="login-safe-note">
          <i className="fa-solid fa-shield-halved" /> Güvenli giriş altyapısı
          ile bilgileriniz korunur.
        </p>
      </main>
    </div>
  );
}
