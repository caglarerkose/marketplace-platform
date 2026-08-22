"use client";
import { useEffect, useState } from "react";
import { useSeller } from "./seller-shell";

type ProductOffer={id:string;seller_sku:string;price:number;status:string;product_variants:{title:string;catalog_products:{title:string}}};
type Balance={offer_id:string;available:number;seller_offers:{seller_sku:string;product_variants:{title:string;catalog_products:{title:string}}}};

export function SellerDashboardCatalog(){
 const{setActive}=useSeller(),[products,setProducts]=useState<ProductOffer[]>([]),[inventory,setInventory]=useState<Balance[]>([]);
 useEffect(()=>{Promise.all([fetch("/api/products"),fetch("/api/inventory")]).then(async([productResponse,inventoryResponse])=>{const[productResult,inventoryResult]=await Promise.all([productResponse.json(),inventoryResponse.json()]);if(productResponse.ok)setProducts(productResult.products||[]);if(inventoryResponse.ok)setInventory(inventoryResult.inventory||[])}).catch(()=>{})},[]);
 const critical=inventory.filter(item=>item.available<=5).slice(0,3),recent=products.slice(0,3);
 return <><div className="card"><div className="card-head"><h3>Stok Durumu</h3><button className="link" onClick={()=>setActive("stock")}>Tümünü Gör</button></div><div className="card-body list">{critical.length===0?<div className="empty-mini-state">Kritik stok bulunmuyor.</div>:critical.map(item=><div className="row" key={item.offer_id}><div className="product-thumb"><i className="fa-solid fa-box"/></div><div><div className="row-title">{item.seller_offers.product_variants.catalog_products.title}</div><div className="row-sub">{item.seller_offers.seller_sku}</div></div><span className="pill red">{item.available} adet</span></div>)}</div></div><div className="card"><div className="card-head"><h3>Son Ürün Teklifleri</h3><button className="link" onClick={()=>setActive("products")}>Tümünü Gör</button></div><div className="card-body list">{recent.length===0?<div className="empty-mini-state">Ürün teklifi bulunmuyor.</div>:recent.map(item=><div className="row" key={item.id}><div className="product-thumb"><i className="fa-solid fa-box-open"/></div><div><div className="row-title">{item.product_variants.catalog_products.title}</div><div className="row-sub">{item.seller_sku}</div></div><span className={`pill ${item.status==="active"?"green":"yellow"}`}>{item.status==="active"?"Aktif":"Onay bekliyor"}</span></div>)}</div></div></>;
}
