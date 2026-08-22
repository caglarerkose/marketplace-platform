"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth-header";
import { SellerCinematicScene } from "@/components/seller-cinematic-scene";
import { SellerBrandLogo } from "@/components/seller-brand-logo";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9, 11)]
    .filter(Boolean)
    .join(" ");
}

function formatIban(value: string) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const digits = compact.replace(/^TR/, "").replace(/\D/g, "").slice(0, 24);
  return `TR${digits}`.match(/.{1,4}/g)?.join(" ") || "TR";
}

export default function Apply() {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true); setError("");
    const form = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/seller-applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Başvuru gönderilemedi.");
      setDone(true);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Başvuru gönderilemedi."); }
    finally { setSubmitting(false); }
  }
  return (
    <div className="auth-page">
      <AuthHeader />
      <main className="auth-main auth-apply-main">
        <form className="apply-card" onSubmit={submit}>
          <h1 className="apply-title">Satıcı Başvuru</h1>
          <p className="apply-subtitle">
            Mağazanızı <SellerBrandLogo /> ile açın, milyonlarca müşteriye ulaşın.
          </p>
          {done ? (
            <div className="apply-success">
              <i className="fa-solid fa-circle-check" />
              <h2>Başvurunuz alındı</h2>
              <p>Hesap davetiniz e-posta adresinize gönderildi. Başvuru sonucu e-posta ve telefonunuza iletilecek.</p>
              <Link href="/login">Satıcı girişine git</Link>
            </div>
          ) : (
            <>
              <div className="apply-form">
                <label className="auth-field wide">
                  Şirket İsmi
                  <input name="legalName" required minLength={2} maxLength={180} placeholder="Şirket İsmi" />
                </label>
                <label className="auth-field">Mağaza Adı<input name="storeName" required minLength={2} maxLength={120} placeholder="Mağaza Adı" /></label>
                <label className="auth-field">Yetkili Ad Soyad<input name="authorizedName" required minLength={2} maxLength={120} placeholder="Yetkili Ad Soyad" /></label>
                <label className="auth-field">
                  Cep Telefonunuz
                  <input
                    name="phone"
                    required
                    inputMode="tel"
                    maxLength={14}
                    pattern="0[0-9]{3} [0-9]{3} [0-9]{2} [0-9]{2}"
                    placeholder="05xx xxx xx xx"
                    onInput={(event) => { event.currentTarget.value = formatPhone(event.currentTarget.value); }}
                  />
                </label>
                <label className="auth-field">
                  E-Posta Adresiniz
                  <input name="email" required type="email" maxLength={254} placeholder="E-Posta Adresi" />
                </label>
                <label className="auth-field">
                  Şirket Türü
                  <select name="businessType" required defaultValue="">
                    <option value="">Seçim yapınız</option>
                    <option value="sole_proprietorship">Şahıs Şirketi</option><option value="limited">Limited Şirket</option><option value="corporation">Anonim Şirket</option>
                  </select>
                </label>
                <label className="auth-field">
                  Vergi / T.C. Kimlik No
                  <input name="taxNumber" required inputMode="numeric" pattern="[0-9]{10,11}" placeholder="Vergi / T.C. Kimlik No" />
                </label>
                <label className="auth-field">Satış Kategorisi<input name="salesCategory" required minLength={2} maxLength={120} placeholder="Örn. Elektronik" /></label>
                <label className="auth-field">IBAN<input name="iban" required inputMode="numeric" maxLength={32} pattern="TR[0-9 ]{24,30}" placeholder="TRxx xxxx xxxx xxxx xxxx xxxx xx" onInput={(event) => { event.currentTarget.value = formatIban(event.currentTarget.value); }} /></label>
                <label className="auth-field">Tercih Edilen Kargo Firması<input name="preferredShippingCompany" required minLength={2} maxLength={120} placeholder="Kargo firması" /></label>
                <label className="auth-field">
                  İl
                  <select name="city" required defaultValue="">
                    <option value="">Seçim yapınız</option>
                    <option>İstanbul</option>
                    <option>Ankara</option>
                    <option>İzmir</option>
                    <option>Bursa</option>
                  </select>
                </label>
                <label className="auth-field">
                  İlçe
                  <select name="district" required defaultValue="">
                    <option value="">Seçim yapınız</option>
                    <option>Kadıköy</option>
                    <option>Beşiktaş</option>
                    <option>Çankaya</option>
                    <option>Konak</option>
                  </select>
                </label>
                <label className="auth-field">
                  Referans Kodu (Zorunlu Değil)
                  <input name="referralCode" maxLength={50} placeholder="Varsa referans kodu giriniz" />
                </label>
                <label className="apply-honeypot" aria-hidden="true">Web sitesi<input name="website" tabIndex={-1} autoComplete="off" /></label>
              </div>
              {error && <div className="apply-error" role="alert"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
              <div className="apply-footer-row">
                <label className="auth-check">
                  <input required type="checkbox" />
                  <span>
                    <u>Aydınlatma metnini</u> okudum ve anladım.
                  </span>
                </label>
                <button className="auth-primary-btn" disabled={submitting}>{submitting ? "GÖNDERİLİYOR..." : "DEVAM ET"}</button>
              </div>
            </>
          )}
        </form>
        <aside className="apply-aside">
          <SellerCinematicScene />
          <div className="apply-info">
            <i className="fa-solid fa-bolt" />
            <div>
              <strong>Hızlı başvuru</strong>
              <p>
                Bilgilerinizi tamamlayın, ekibimiz sizinle iletişime geçsin.
              </p>
            </div>
          </div>
          <div className="apply-info">
            <i className="fa-solid fa-shield-halved" />
            <div>
              <strong>Güvenli altyapı</strong>
              <p>Mağaza ve ödeme bilgileriniz güvenle saklanır.</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
