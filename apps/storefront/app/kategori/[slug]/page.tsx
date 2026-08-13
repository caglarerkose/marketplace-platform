import { PageFrame } from "@/components/layout/page-frame";
import { ProductCard } from "@/components/product-card";
import { products } from "@/data/home";

export default async function CategoryResultsPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <PageFrame title={decodeURIComponent(slug).replaceAll("-", " ")}><div className="category-toolbar"><span>{products.length} ürün</span><label><input type="checkbox"/> Hızlı Teslimat</label><select aria-label="Sıralama"><option>Önerilen sıralama</option><option>En düşük fiyat</option></select></div><div className="vertical-products">{products.map(product => <ProductCard product={product} key={product.id}/>)}</div></PageFrame>; }
