import Image from "next/image";
import Link from "next/link";
import { getActiveCategories } from "@/lib/catalog-categories";

export default async function Categories(){const categories=await getActiveCategories();return <div className="container page"><div className="title"><h1>Tüm Kategoriler </h1><p>Aradığın ürünlere kategorilerden hızlıca ulaş.</p></div>{categories.length?<div className="category-grid">{categories.map(category=><Link href={`/kategori/${category.slug}`} key={category.id}><Image src={category.imageUrl||"/img/elektronik.jpg"} fill sizes="(max-width:768px) 50vw, 25vw" alt={category.name}/><h3>{category.name}</h3></Link>)}</div>:<div className="empty"><i className="fa-solid fa-layer-group"/><h2>Aktif kategori bulunmuyor</h2><p>Yayınlanan kategoriler burada gösterilecek.</p></div>}</div>}
