import Image from "next/image";
import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";

const categories = [["Elektronik","elektronik.jpg"],["Bilgisayar & Tablet","bilgisayar.jpg"],["Otomobil","volkswagen.jpg"],["Beyaz Eşya","beyazesya.jpg"],["Çanta & Terlik","canta.jpg"],["Parfüm & Deodorant","parfum.jpg"],["Küçük Ev Aletleri","kucukevaletleri.jpg"],["Mobilya","mobilya.jpg"],["Temizlik Ürünleri","temizlik.jpg"]] as const;

export default function CategoriesPage() { return <PageFrame title="Kategoriler"><div className="category-grid">{categories.map(([title,image]) => <Link className="category-card" href={`/kategori/${encodeURIComponent(title.toLocaleLowerCase("tr-TR"))}`} key={title}><Image src={`/img/${image}`} alt="" fill sizes="(max-width:768px) 50vw, 25vw"/><strong>{title}</strong></Link>)}</div></PageFrame>; }
