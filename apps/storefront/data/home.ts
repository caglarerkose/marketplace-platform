export interface HomeProduct {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge: string;
  image: string;
}

export const categories = ["Elektronik", "Ev & Yaşam", "Moda", "Anne & Çocuk", "Kozmetik", "Oto & Yapı", "Hırdavat", "Spor & Outdoor"];

export const quickLinks = [
  ["🔥", "Çok Satanlar"], ["🚚", "Hızlı Teslimat"], ["🎁", "Avantajlı Seçki"],
  ["🏷️", "Kuponlu Ürünler"], ["📱", "Elektronik"], ["🏠", "Ev Ürünleri"],
  ["⚡", "Günün Fırsatları"], ["📦", "Kargo Bedava"],
] as const;

export const products: HomeProduct[] = [
  { id: "iphone-14-pro-max", name: "Apple iPhone 14 Pro Max 256GB Uzay Siyahı", price: 3620000, rating: 4.9, reviews: 1205, badge: "Öne Çıkan Ürün", image: "/img/urun.jpg" },
  { id: "redmi-note-12-pro", name: "Xiaomi Redmi Note 12 Pro 5G 256GB Mavi", price: 650000, rating: 4.7, reviews: 450, badge: "Öne Çıkan Ürün", image: "/img/urun1.jpg" },
  { id: "ipad-air-5", name: "Apple iPad Air 5. Nesil 64GB Uzay Grisi", price: 815000, oldPrice: 995000, rating: 4.8, reviews: 312, badge: "%18 İndirim", image: "/img/urun2.jpg" },
  { id: "macbook-air-m1", name: "Apple MacBook Air M1 Çip 8GB 256GB SSD", price: 1250000, oldPrice: 1490000, rating: 4.9, reviews: 890, badge: "Sepette İndirim", image: "/img/urun3.jpg" },
  { id: "imac-m1", name: "Apple iMac 24 inç M1 Çip Gümüş Masaüstü", price: 2070000, rating: 4.6, reviews: 210, badge: "Öne Çıkan Ürün", image: "/img/urun4.jpg" },
  { id: "headphones", name: "Siyah Profesyonel Kulaküstü Kulaklık", price: 97000, rating: 4.9, reviews: 450, badge: "Öne Çıkan Ürün", image: "/img/urun5.jpg" },
  { id: "airpods-pro", name: "Apple AirPods Pro 2. Nesil Bluetooth Kulaklık", price: 305000, oldPrice: 400000, rating: 4.7, reviews: 850, badge: "%24 İndirim", image: "/img/urun6.jpg" },
  { id: "apple-watch", name: "Apple Watch Akıllı Saat Siyah Kordon", price: 470000, oldPrice: 575000, rating: 4.9, reviews: 320, badge: "Sepette İndirim", image: "/img/urun7.jpg" },
];
