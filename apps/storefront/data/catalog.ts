export type PriceMode="normal"|"percent"|"cart-discount";
export type Product={id:string;name:string;image:string;category:string;rating:number;reviewCount:number;priceMode:PriceMode;originalPrice:number;discountPercent?:number;price:number;badge:string;stock:number;isFastDelivery?:boolean;isFreeShipping?:boolean;hasDiscount?:boolean;gallery?:string[];variants?:{id:string;label:string;price:number;stock:number}[]};
export const categories=["Elektronik","Ev & Yaşam","Moda","Anne & Çocuk","Kozmetik","Oto & Yapı","Hırdavat","Spor & Outdoor","Kitap & Hobi","Ofis & Kırtasiye","Pet Shop","Süper Fırsatlar"];
export const categoryCards=[
 ["Elektronik","/img/elektronik.jpg"],["Ev & Yaşam","/img/mobilya.jpg"],["Moda","/img/canta.jpg"],["Beyaz Eşya","/img/beyazesya.jpg"],["Kozmetik","/img/Kozmetik.jpg"],["Spor & Outdoor","/img/Spor.jpg"],["Bilgisayar","/img/bilgisayar.jpg"],["Temizlik","/img/temizlik.jpg"],["Küçük Ev Aletleri","/img/kucukevaletleri.jpg"]
];
export const products:Product[]=[
 {id:"iphone-14-pro-max",name:"Apple iPhone 14 Pro Max 256GB Uzay Siyahı",image:"/img/urun.jpg",category:"Elektronik",rating:4.9,reviewCount:1205,priceMode:"normal",originalPrice:72500,price:72500,badge:"Öne Çıkan Ürün",stock:9},
 {id:"redmi-note-12-pro",name:"Xiaomi Redmi Note 12 Pro 5G 256GB Mavi",image:"/img/urun1.jpg",category:"Elektronik",rating:4.7,reviewCount:450,priceMode:"normal",originalPrice:13000,price:13000,badge:"Öne Çıkan Ürün",stock:18},
 {id:"ipad-air-5",name:"Apple iPad Air 5. Nesil 64GB Uzay Grisi",image:"/img/urun2.jpg",category:"Elektronik",rating:4.8,reviewCount:312,priceMode:"percent",originalPrice:19900,discountPercent:18,price:16300,badge:"%18 İndirim",stock:12},
 {id:"macbook-air-m1",name:"Apple MacBook Air M1 Çip 8GB 256GB SSD",image:"/img/urun3.jpg",category:"Bilgisayar",rating:4.9,reviewCount:890,priceMode:"cart-discount",originalPrice:29900,price:25000,badge:"Sepette İndirim",stock:8},
 {id:"imac-m1",name:"Apple iMac 24 inç M1 Çip Gümüş Masaüstü",image:"/img/urun4.jpg",category:"Bilgisayar",rating:4.6,reviewCount:210,priceMode:"normal",originalPrice:41400,price:41400,badge:"Öne Çıkan Ürün",stock:6},
 {id:"headphones",name:"Siyah Profesyonel Kulaküstü Kulaklık",image:"/img/urun5.jpg",category:"Elektronik",rating:4.9,reviewCount:450,priceMode:"normal",originalPrice:1940,price:1940,badge:"Öne Çıkan Ürün",stock:35},
 {id:"airpods-pro",name:"Apple AirPods Pro 2. Nesil Bluetooth Kulaklık",image:"/img/urun6.jpg",category:"Elektronik",rating:4.7,reviewCount:850,priceMode:"percent",originalPrice:8000,discountPercent:24,price:6100,badge:"%24 İndirim",stock:14},
 {id:"apple-watch",name:"Apple Watch Akıllı Saat Siyah Kordon",image:"/img/urun7.jpg",category:"Elektronik",rating:4.9,reviewCount:320,priceMode:"cart-discount",originalPrice:11500,price:9400,badge:"Sepette İndirim",stock:21},
 {id:"airfryer",name:"Philips Airfryer HD9252/90 Fritöz",image:"/img/urun8.jpg",category:"Ev & Yaşam",rating:4.8,reviewCount:622,priceMode:"percent",originalPrice:6200,discountPercent:20,price:4990,badge:"%20 İndirim",stock:16},
 {id:"robot-supurge",name:"Akıllı Robot Süpürge Haritalamalı",image:"/img/urun9.jpg",category:"Ev & Yaşam",rating:4.6,reviewCount:285,priceMode:"cart-discount",originalPrice:18500,price:15990,badge:"Sepette İndirim",stock:11},
 {id:"parfum",name:"Kadın Parfüm 100 ml Kalıcı Koku",image:"/img/urun10.jpg",category:"Kozmetik",rating:4.5,reviewCount:178,priceMode:"normal",originalPrice:1299,price:1299,badge:"Öne Çıkan Ürün",stock:42},
 {id:"spor-ayakkabi",name:"Unisex Günlük Spor Ayakkabı",image:"/img/urun11.jpg",category:"Spor & Outdoor",rating:4.7,reviewCount:391,priceMode:"percent",originalPrice:2400,discountPercent:25,price:1799,badge:"%25 İndirim",stock:26}
];
export const formatTL=(value:number)=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(value);
export const productFlags=(p:Product)=>({isFastDelivery:p.isFastDelivery??p.stock>=10,isFreeShipping:p.isFreeShipping??true,hasDiscount:p.hasDiscount??p.priceMode!=="normal"});
export const productGallery=(p:Product)=>p.gallery?.length?p.gallery:[p.image,"/img/urun12.jpg","/img/urun13.jpg","/img/urun14.jpg","/img/urun15.jpg"];
