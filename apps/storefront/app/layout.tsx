import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BişeyEksik", template: "%s | BişeyEksik" },
  description: "Aradığın ürünler, sevdiğin mağazalar ve kaçırılmayacak fırsatlar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
