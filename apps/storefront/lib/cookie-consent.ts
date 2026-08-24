export const COOKIE_CONSENT_NAME = "bx_cookie_consent";
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_EVENT = "biseyeksik:consent-change";
export const OPEN_COOKIE_PREFERENCES_EVENT = "biseyeksik:open-cookie-preferences";

export type OptionalCookieCategory = "functional" | "analytics" | "marketing";
export type CookieConsent = {
  version: number;
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export function readCookieConsent(): CookieConsent | null {
  if (typeof document === "undefined") return null;
  const prefix = COOKIE_CONSENT_NAME + "=";
  const value = document.cookie.split("; ").find((part) => part.startsWith(prefix))?.slice(prefix.length);
  if (!value) return null;
  try {
    const consent = JSON.parse(decodeURIComponent(value)) as CookieConsent;
    if (consent.version !== COOKIE_CONSENT_VERSION || consent.necessary !== true ||
      typeof consent.functional !== "boolean" || typeof consent.analytics !== "boolean" ||
      typeof consent.marketing !== "boolean") return null;
    return consent;
  } catch {
    return null;
  }
}

export function hasCookieConsent(category: OptionalCookieCategory) {
  return readCookieConsent()?.[category] === true;
}

export function saveCookieConsent(choices: Pick<CookieConsent, OptionalCookieCategory>) {
  const consent: CookieConsent = {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    ...choices,
    updatedAt: new Date().toISOString(),
  };
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = COOKIE_CONSENT_NAME + "=" + encodeURIComponent(JSON.stringify(consent)) +
    "; Path=/; Max-Age=31536000; SameSite=Lax" + secure;
  document.documentElement.dataset.cookieFunctional = String(consent.functional);
  document.documentElement.dataset.cookieAnalytics = String(consent.analytics);
  document.documentElement.dataset.cookieMarketing = String(consent.marketing);
  window.dispatchEvent(new CustomEvent<CookieConsent>(COOKIE_CONSENT_EVENT, { detail: consent }));
  return consent;
}
