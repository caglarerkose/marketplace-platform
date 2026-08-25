import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { StoreProvider } from "@/components/store-provider";
import { StoreToast } from "@/components/store-toast";
import { CookieConsent } from "@/components/cookie-consent";
import { GlobalBusyIndicator } from "@/components/global-busy-indicator";
import { getSeoSettings } from "@/lib/seo-settings";
import "./globals.css";
import "./cookie-consent.css";
import "./busy-indicator.css";
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSeoSettings(),
    title = s?.meta_title || "BişeyEksik | Aradığın Her Şey",
    description =
      s?.meta_description ||
      "Güvenli alışveriş ve avantajlı fiyatlar BişeyEksik'te.";
  return {
    metadataBase: new URL("https://marketplace-platform-storefront.vercel.app"),
    title,
    description,
    keywords: s?.keywords,
    robots:
      s?.index_enabled === false
        ? { index: false, follow: false }
        : { index: true, follow: true },
    openGraph: {
      title: s?.og_title || title,
      description: s?.og_description || description,
      type: "website",
      siteName: s?.site_name || "BişeyEksik",
    },
    verification: s?.search_verification
      ? { google: s.search_verification }
      : undefined,
  };
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
      </head>
      <body>
        <GlobalBusyIndicator />
        <StoreProvider>
          <SiteHeader />
          <main>{children}</main>
          <Footer />
          <MobileNav />
          <StoreToast />
          <CookieConsent />
        </StoreProvider>
      </body>
    </html>
  );
}
