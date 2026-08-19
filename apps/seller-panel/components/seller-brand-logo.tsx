import Image from "next/image";

export function SellerBrandLogo({ className = "" }: { className?: string }) {
  return <Image className={`seller-brand-logo ${className}`} src="/img/anayazi.png" width={228} height={46} alt="BişeyEksik" />;
}
