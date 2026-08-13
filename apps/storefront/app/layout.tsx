import type { Metadata } from "next";
import "./globals.css";
import "@/styles/tokens.css";
import "@/styles/parity.css";
import { SiteHeader } from "@/components/site-header";
import { MarketplaceFooter } from "@/components/layout/marketplace-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export const metadata: Metadata = {
  title: { default: "BişeyEksik", template: "%s | BişeyEksik" },
  description: "Aradığın ürünler, sevdiğin mağazalar ve kaçırılmayacak fırsatlar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body><SiteHeader />{children}<MarketplaceFooter /><MobileBottomNav /></body>
    </html>
  );
}
