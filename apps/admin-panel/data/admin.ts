export type NavItem = { href: string; label: string; icon: string; badge?: number };

export const navigation: NavItem[] = [
  { href: "/", label: "Genel Bakış", icon: "⌂" },
  { href: "/saticilar", label: "Satıcı Yönetimi", icon: "▣", badge: 32 },
  { href: "/evraklar", label: "Evrak Yönetimi", icon: "▤", badge: 14 },
  { href: "/urun-onaylari", label: "Ürün Onayları", icon: "□", badge: 54 },
  { href: "/kategoriler", label: "Kategoriler", icon: "▦" },
  { href: "/kampanyalar", label: "Kampanyalar", icon: "◈" },
  { href: "/komisyonlar", label: "Komisyonlar", icon: "%" },
  { href: "/siparisler", label: "Siparişler", icon: "▱" },
  { href: "/musteriler", label: "Müşteriler", icon: "♙" },
  { href: "/destek", label: "Destek Talepleri", icon: "?", badge: 18 },
  { href: "/raporlar", label: "Raporlar", icon: "↗" },
  { href: "/site-yonetimi", label: "Site Yönetimi", icon: "⚙" },
];

export const modules = {
  saticilar: { title: "Satıcı Yönetimi", description: "Başvuru, onay, evrak ve mağaza yetkilendirme süreçlerini yönetin.", metric: "32", metricLabel: "İncelemede başvuru", action: "Yeni Satıcı Onayla" },
  evraklar: { title: "Evrak Yönetimi", description: "Satıcı belgelerini ve doğrulama durumlarını tek ekrandan takip edin.", metric: "14", metricLabel: "Bekleyen evrak", action: "Evrakları İncele" },
  "urun-onaylari": { title: "Ürün Onayları", description: "Yayına alınmayı bekleyen ürünleri inceleyin ve yönetin.", metric: "5.432", metricLabel: "Onay bekleyen ürün", action: "Toplu Onayla" },
  kategoriler: { title: "Kategori Yönetimi", description: "Kategori ağacı, özellikler ve filtre standartlarını düzenleyin.", metric: "186", metricLabel: "Aktif kategori", action: "Kategori Ekle" },
  kampanyalar: { title: "Kampanyalar", description: "Pazaryeri kampanyalarını, kuponları ve satıcı katılımlarını yönetin.", metric: "24", metricLabel: "Aktif kampanya", action: "Kampanya Oluştur" },
  komisyonlar: { title: "Komisyonlar", description: "Kategori ve satıcı bazlı komisyon oranlarını yönetin.", metric: "₺4.562.317", metricLabel: "Aylık komisyon", action: "Oranları Düzenle" },
  siparisler: { title: "Siparişler", description: "Sipariş, teslimat, iptal ve iade süreçlerini izleyin.", metric: "24.657", metricLabel: "Günlük sipariş", action: "Siparişleri Dışa Aktar" },
  musteriler: { title: "Müşteriler", description: "Müşteri segmentlerini, davranışlarını ve destek geçmişini görüntüleyin.", metric: "1.234.567", metricLabel: "Toplam müşteri", action: "Listeyi İndir" },
  destek: { title: "Destek Talepleri", description: "Müşteri ve satıcı taleplerini önceliklerine göre çözümleyin.", metric: "256", metricLabel: "Açık destek talebi", action: "Talep Ata" },
  raporlar: { title: "Raporlar", description: "Satış, satıcı, ürün ve operasyon performansını analiz edin.", metric: "18,6%", metricLabel: "Ciro büyümesi", action: "Rapor Oluştur" },
  "site-yonetimi": { title: "Site Yönetimi", description: "Vitrin, menü, banner, mobil görünüm ve SEO alanlarını yönetin.", metric: "12", metricLabel: "Yayındaki vitrin alanı", action: "Vitrini Düzenle" },
} as const;

export type ModuleKey = keyof typeof modules;
