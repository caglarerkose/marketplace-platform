"use client";

import { openCookiePreferences } from "@/components/cookie-consent";

export function CookiePreferencesButton() {
  return <button type="button" className="footer-cookie-preferences" onClick={openCookiePreferences}>Çerez Tercihleri</button>;
}
