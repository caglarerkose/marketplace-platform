"use client";

import { useEffect, useState } from "react";
import {
  OPEN_COOKIE_PREFERENCES_EVENT,
  readCookieConsent,
  saveCookieConsent,
  type CookieConsent as Consent,
} from "@/lib/cookie-consent";

const rejected = { functional: false, analytics: false, marketing: false };
const accepted = { functional: true, analytics: true, marketing: true };

export function CookieConsent() {
  const [ready, setReady] = useState(false);
  const [hasDecision, setHasDecision] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [choices, setChoices] = useState(rejected);

  useEffect(() => {
    const current = readCookieConsent();
    if (current) {
      setHasDecision(true);
      setChoices({ functional: current.functional, analytics: current.analytics, marketing: current.marketing });
      document.documentElement.dataset.cookieFunctional = String(current.functional);
      document.documentElement.dataset.cookieAnalytics = String(current.analytics);
      document.documentElement.dataset.cookieMarketing = String(current.marketing);
    }
    setReady(true);
    const openPreferences = () => setPreferencesOpen(true);
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
  }, []);

  useEffect(() => {
    if (!preferencesOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreferencesOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [preferencesOpen]);

  const persist = (next: typeof rejected) => {
    const consent: Consent = saveCookieConsent(next);
    setChoices({ functional: consent.functional, analytics: consent.analytics, marketing: consent.marketing });
    setHasDecision(true);
    setPreferencesOpen(false);
  };

  if (!ready) return null;
  return (
    <>
      {!hasDecision && !preferencesOpen ? (
        <section className="cookie-consent-bar" aria-label="Çerez bildirimi">
          <div className="cookie-consent-copy">
            <strong>Çerez tercihlerinizi yönetin</strong>
            <p>
              Zorunlu çerezleri güvenli giriş ve temel site işlevleri için kullanıyoruz.
              Diğer çerezleri yalnızca izninizle etkinleştiriyoruz.{" "}
              <a href="/cerez-politikasi">Çerez Politikası</a>
            </p>
          </div>
          <div className="cookie-consent-actions">
            <button type="button" onClick={() => persist(accepted)}>Tümünü Kabul Et</button>
            <button type="button" onClick={() => persist(rejected)}>Tümünü Reddet</button>
            <button type="button" onClick={() => setPreferencesOpen(true)}>Tercihler</button>
          </div>
        </section>
      ) : null}
      {preferencesOpen ? (
        <div className="cookie-preferences-overlay" role="presentation">
          <section className="cookie-preferences-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title">
            <header>
              <img src="/img/anayazi.png" alt="BişeyEksik" />
              <button type="button" className="cookie-preferences-close" aria-label="Kapat" onClick={() => setPreferencesOpen(false)}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </header>
            <h2 id="cookie-preferences-title">Çerez Tercihleri</h2>
            <p className="cookie-preferences-intro">
              Hangi isteğe bağlı teknolojilere izin vereceğinizi seçebilirsiniz.
              Zorunlu çerezler site güvenliği ve temel işlevler için her zaman aktiftir.
            </p>
            <div className="cookie-category-list">
              <CookieCategory title="Zorunlu" description="Güvenli oturum, tercih kaydı ve temel site işlevlerini sağlar." checked disabled onChange={() => undefined} />
              <CookieCategory title="İşlevsel" description="Misafir sepeti ve favoriler gibi kişiselleştirilmiş işlevleri hatırlar." checked={choices.functional} onChange={(functional) => setChoices({ ...choices, functional })} />
              <CookieCategory title="Analiz" description="Site kullanımını ölçmemize ve performansı geliştirmemize yardımcı olur." checked={choices.analytics} onChange={(analytics) => setChoices({ ...choices, analytics })} />
              <CookieCategory title="Pazarlama" description="İzin verilirse reklamların etkinliğini ölçmek için kullanılabilir." checked={choices.marketing} onChange={(marketing) => setChoices({ ...choices, marketing })} />
            </div>
            <div className="cookie-preferences-actions">
              <button type="button" onClick={() => persist(choices)}>Tercihleri Kaydet</button>
              <button type="button" onClick={() => persist(accepted)}>Tümünü Kabul Et</button>
              <button type="button" onClick={() => persist(rejected)}>Tümünü Reddet</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function CookieCategory({ title, description, checked, disabled = false, onChange }: {
  title: string; description: string; checked: boolean; disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  const className = "cookie-category" + (disabled ? " is-disabled" : "");
  return (
    <label className={className}>
      <span><strong>{title}</strong><small>{description}</small></span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT));
}
