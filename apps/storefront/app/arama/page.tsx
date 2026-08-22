import {ProductBrowser} from "@/components/product-browser";
import {getActiveProducts} from "@/lib/catalog-products";

export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const products=await getActiveProducts();
  const {q=""}=await searchParams;
  const query=q.trim();
  const needle=query.toLocaleLowerCase("tr-TR");
  const items=products.filter(product=>`${product.name} ${product.category} ${product.badge}`.toLocaleLowerCase("tr-TR").includes(needle));
  return <ProductBrowser items={items} title={query?`“${query}” araması`:"Arama"} description={query?"Aramanızla eşleşen ürünler":"Aramak istediğiniz ürünü üstteki kutuya yazın."}/>;
}
