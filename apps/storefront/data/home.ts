export interface HomeProduct {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge: string;
  emoji: string;
  tone: string;
}

export const categories = ["Elektronik", "Ev & Yaşam", "Moda", "Anne & Çocuk", "Kozmetik", "Oto & Yapı", "Hırdavat", "Spor & Outdoor"];

export const quickLinks = [
  ["🔥", "Çok Satanlar"], ["🚚", "Hızlı Teslimat"], ["🎁", "Avantajlı Seçki"],
  ["🏷️", "Kuponlu Ürünler"], ["📱", "Elektronik"], ["🏠", "Ev Ürünleri"],
  ["⚡", "Günün Fırsatları"], ["📦", "Kargo Bedava"],
] as const;

export const products: HomeProduct[] = [
  { id: "iphone-14-pro-max", name: "Apple iPhone 14 Pro Max 256GB Uzay Siyahı", price: 3620000, rating: 4.9, reviews: 1205, badge: "Öne Çıkan Ürün", emoji: "📱", tone: "blue" },
  { id: "redmi-note-12-pro", name: "Xiaomi Redmi Note 12 Pro 5G 256GB Mavi", price: 650000, rating: 4.7, reviews: 450, badge: "Öne Çıkan Ürün", emoji: "📲", tone: "mint" },
  { id: "ipad-air-5", name: "Apple iPad Air 5. Nesil 64GB Uzay Grisi", price: 815000, oldPrice: 995000, rating: 4.8, reviews: 312, badge: "%18 İndirim", emoji: "▣", tone: "lavender" },
  { id: "macbook-air-m1", name: "Apple MacBook Air M1 Çip 8GB 256GB SSD", price: 1250000, oldPrice: 1490000, rating: 4.9, reviews: 890, badge: "Sepette İndirim", emoji: "💻", tone: "silver" },
  { id: "airpods-pro", name: "Apple AirPods Pro 2. Nesil Bluetooth Kulaklık", price: 305000, oldPrice: 400000, rating: 4.7, reviews: 850, badge: "%24 İndirim", emoji: "🎧", tone: "peach" },
  { id: "gaming-mouse", name: "Logitech G Serisi Işıklı Oyuncu Mouse", price: 64000, rating: 4.9, reviews: 745, badge: "Kargo Bedava", emoji: "🖱️", tone: "dark" },
];
