export type SectionKind = "overview" | "workflow" | "table" | "modules" | "settings";
export type AdminSection = { id:string; title:string; description:string; icon:string; kind:SectionKind; badge?:number; top?:boolean; metric?:string; metricLabel?:string };
export const sideSections:AdminSection[]=[
 {id:"overview",title:"Genel Bakış",description:"Platform performansını aşağıdan takip edebilirsiniz.",icon:"fa-house",kind:"overview"},
 {id:"sellers",title:"Satıcı Yönetimi",description:"Başvuru, onay, eksik bilgi, evrak ve mağaza yetkilendirme sürecini tek ekrandan yönetin.",icon:"fa-store",kind:"workflow",metric:"-",metricLabel:"İncelemede başvuru"},
 {id:"documents",title:"Evrak Yönetimi",description:"Satıcı evraklarını doğrulayın, eksik belge taleplerini ve onay geçmişini yönetin.",icon:"fa-folder-open",kind:"workflow",metric:"-",metricLabel:"Evrak bekleniyor"},
 {id:"approvals",title:"Ürün Onayları",description:"Yayına alınmayı bekleyen ürünlerin içerik, fiyat ve kategori kontrollerini tamamlayın.",icon:"fa-box-open",kind:"workflow",metric:"-",metricLabel:"Onay bekleyen ürün"},
 {id:"categories",title:"Kategoriler",description:"Kategori ağacı, özellik setleri ve filtre standartlarını düzenleyin.",icon:"fa-layer-group",kind:"table",metric:"186",metricLabel:"Aktif kategori"},
 {id:"product-imports",title:"Aktarım / Katalog",description:"Toplu ürün dosyalarını eşleştirin, doğrulayın ve kataloğa aktarın.",icon:"fa-code-merge",kind:"workflow",metric:"8",metricLabel:"Devam eden aktarım"},
 {id:"campaigns",title:"Kampanyalar",description:"Kampanya, kupon ve satıcı katılım süreçlerini yönetin.",icon:"fa-bullhorn",kind:"table",metric:"24",metricLabel:"Aktif kampanya"},
 {id:"commissions",title:"Komisyonlar",description:"Kategori ve satıcı bazlı komisyon oranlarını ve hakedişleri yönetin.",icon:"fa-percent",kind:"table",metric:"₺4.562.317",metricLabel:"Aylık komisyon"},
 {id:"orders",title:"Siparişler",description:"Sipariş, teslimat, iptal ve iade süreçlerini izleyin.",icon:"fa-bag-shopping",kind:"table",metric:"24.657",metricLabel:"Günlük sipariş"},
 {id:"customers",title:"Müşteriler",description:"Müşteri segmentleri, davranışları ve destek geçmişi.",icon:"fa-user",kind:"table",metric:"1.234.567",metricLabel:"Toplam müşteri"},
 {id:"top-announcements",title:"Duyurular",description:"Site geneli ve panel duyurularını yayınlayın.",icon:"fa-bullhorn",kind:"table",metric:"3",metricLabel:"Yayındaki duyuru"},
 {id:"top-installments",title:"Taksit Yönetimi",description:"Banka ve kart bazlı taksit seçeneklerini düzenleyin.",icon:"fa-credit-card",kind:"table",metric:"12",metricLabel:"Aktif banka kuralı"},
 {id:"support",title:"Destek Talepleri",description:"Müşteri ve satıcı taleplerini önceliklerine göre çözümleyin.",icon:"fa-life-ring",kind:"table",metric:"-",metricLabel:"Açık talep"},
 {id:"admin-users",title:"Kullanıcılar",description:"Admin paneli kullanıcılarını, durumlarını ve erişim yetkilerini yönetin.",icon:"fa-users-gear",kind:"table",metric:"4",metricLabel:"Panel kullanıcısı"},
 {id:"audit-logs",title:"İşlem Logları",description:"Kullanıcı kodu, işlem, tarih, saat ve risk detaylarını denetleyin.",icon:"fa-clock-rotate-left",kind:"table",metric:"1.842",metricLabel:"Denetim kaydı"},
 {id:"reports",title:"Raporlar",description:"Satış, satıcı, ürün ve operasyon performansını analiz edin.",icon:"fa-chart-line",kind:"modules",metric:"18,6%",metricLabel:"Ciro büyümesi"},
 {id:"settings",title:"Sistem Ayarları",description:"Platform davranışları, bildirimler ve yönetici yetkilerini düzenleyin.",icon:"fa-gear",kind:"settings",metric:"Aktif",metricLabel:"Sistem durumu"}
];
export const topSections:AdminSection[]=[
 {id:"top-home-layout",title:"Ana Sayfa / Vitrin",description:"Anasite vitrin sıralamasını ve içerik bloklarını yönetin.",icon:"fa-table-cells-large",kind:"modules",top:true,metric:"12",metricLabel:"Aktif vitrin alanı"},
 {id:"top-menu-layout",title:"Menü Yönetimi",description:"Web ve mobil navigasyon menülerini düzenleyin.",icon:"fa-bars-staggered",kind:"table",top:true,metric:"16",metricLabel:"Menü bağlantısı"},
 {id:"top-footer-pages",title:"Footer / Yasal",description:"Footer kolonlarını ve yasal metin sayfalarını yönetin.",icon:"fa-file-lines",kind:"modules",top:true,metric:"9",metricLabel:"Yasal sayfa"},
 {id:"top-ads",title:"Reklam Alanları",description:"Reklam konumlarını, tarihlerini ve görünürlük kurallarını yönetin.",icon:"fa-rectangle-ad",kind:"table",top:true,metric:"8",metricLabel:"Aktif reklam"},
 {id:"top-product-ranking",title:"Ürün Sıralama",description:"Listeleme ve vitrin ürün sıralama kurallarını yönetin.",icon:"fa-arrow-down-wide-short",kind:"settings",top:true,metric:"6",metricLabel:"Aktif sıralama kuralı"},
 {id:"top-mobile-settings",title:"Mobil Ayarlar",description:"Mobil navigasyon, uygulama bannerı ve görünüm tercihlerini yönetin.",icon:"fa-mobile-screen-button",kind:"settings",top:true,metric:"2",metricLabel:"Mobil platform"},
 {id:"top-filter-standard",title:"Filtre Standardı",description:"Kategori filtrelerinin görünüm ve sıralama kurallarını belirleyin.",icon:"fa-filter-circle-xmark",kind:"settings",top:true,metric:"186",metricLabel:"Filtre seti"},
 {id:"top-seo-pages",title:"SEO / Sayfalar",description:"Meta alanlarını, indeksleme ve yönlendirme kurallarını yönetin.",icon:"fa-magnifying-glass-chart",kind:"table",top:true,metric:"94",metricLabel:"SEO puanı"},
];
export const allSections=[...sideSections,...topSections];
