import type {Metadata} from "next";
import "./globals.css";
import "./orders.css";
import "./order-requests.css";
import "./support.css";
import "./notifications.css";
import "./busy-indicator.css";
import "./visual-editor-overrides.css";
import {GlobalBusyIndicator} from "@/components/global-busy-indicator";
export const metadata:Metadata={title:"BişeyEksik Satıcı Paneli",description:"BişeyEksik pazaryeri satıcı yönetim paneli"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="tr"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap"/><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"/></head><body><GlobalBusyIndicator/>{children}</body></html>}
