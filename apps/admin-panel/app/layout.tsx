import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";
import "./globals.css";

export const metadata: Metadata = { title: "BişeyEksik Admin", description: "BişeyEksik pazaryeri yönetim paneli" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body><AdminShell>{children}</AdminShell></body></html>;
}
