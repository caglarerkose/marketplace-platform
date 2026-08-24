import {ProductBrowser} from "@/components/product-browser";
import {searchActiveProducts} from "@/lib/catalog-products";

export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const {q=""}=await searchParams;
  const query=q.trim();
  const items=await searchActiveProducts(query);
  return <ProductBrowser items={items} title={query?`“${query}” araması`:"Arama"} description={query?"Aramanızla eşleşen ürünler":"Aramak istediğiniz ürünü üstteki kutuya yazın."}/>;
}
