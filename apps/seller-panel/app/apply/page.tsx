"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth-header";
import { SellerCinematicScene } from "@/components/seller-cinematic-scene";
import { SellerBrandLogo } from "@/components/seller-brand-logo";
export default function Apply() {
  const [done, setDone] = useState(false);
  function submit(e: FormEvent) {
    e.preventDefault();
    setDone(true);
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
              <p>İnceleme sonucu e-posta ve telefonunuza iletilecek.</p>
              <Link href="/login">Satıcı girişine git</Link>
            </div>
          ) : (
            <>
              <div className="apply-form">
                <label className="auth-field wide">
                  Şirket İsmi
                  <input required placeholder="Şirket İsmi" />
                </label>
                <label className="auth-field">
                  Cep Telefonunuz
                  <input required placeholder="05__ ___ __ __" />
                </label>
                <label className="auth-field">
                  E-Posta Adresiniz
                  <input required type="email" placeholder="E-Posta Adresi" />
                </label>
                <label className="auth-field">
                  Şirket Türü
                  <select required defaultValue="">
                    <option value="">Seçim yapınız</option>
                    <option>Şahıs Şirketi</option>
                    <option>Limited Şirket</option>
                    <option>Anonim Şirket</option>
                  </select>
                </label>
                <label className="auth-field">
                  Vergi / T.C. Kimlik No
                  <input required placeholder="Vergi / T.C. Kimlik No" />
                </label>
                <label className="auth-field">
                  İl
                  <select required defaultValue="">
                    <option value="">Seçim yapınız</option>
                    <option>İstanbul</option>
                    <option>Ankara</option>
                    <option>İzmir</option>
                    <option>Bursa</option>
                  </select>
                </label>
                <label className="auth-field">
                  İlçe
                  <select required defaultValue="">
                    <option value="">Seçim yapınız</option>
                    <option>Kadıköy</option>
                    <option>Beşiktaş</option>
                    <option>Çankaya</option>
                    <option>Konak</option>
                  </select>
                </label>
                <label className="auth-field">
                  Referans Kodu (Zorunlu Değil)
                  <input placeholder="Varsa referans kodu giriniz" />
                </label>
              </div>
              <div className="apply-footer-row">
                <label className="auth-check">
                  <input required type="checkbox" />
                  <span>
                    <u>Aydınlatma metnini</u> okudum ve anladım.
                  </span>
                </label>
                <button className="auth-primary-btn">DEVAM ET</button>
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
