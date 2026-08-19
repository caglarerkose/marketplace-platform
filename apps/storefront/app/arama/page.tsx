import {ProductBrowser} from "@/components/product-browser";
import {products} from "@/data/catalog";

export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const {q=""}=await searchParams;
  const query=q.trim();
  const needle=query.toLocaleLowerCase("tr-TR");
  const items=products.filter(product=>`${product.name} ${product.category} ${product.badge}`.toLocaleLowerCase("tr-TR").includes(needle));
  return <ProductBrowser items={items} title={query?`“${query}” araması`:"Arama"} description={query?"Aramanızla eşleşen ürünler":"Aramak istediğiniz ürünü üstteki kutuya yazın."}/>;
}
