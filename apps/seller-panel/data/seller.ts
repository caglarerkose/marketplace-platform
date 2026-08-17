export type SellerSection={id:string;title:string;description:string;icon:string;kind:"dashboard"|"orders"|"products"|"list"|"modules"|"settings";badge?:number};
export const sideSections:SellerSection[]=[
 {id:"dashboard",title:"Panelim",description:"Mağazanızın genel performansını buradan takip edebilirsiniz.",icon:"fa-house",kind:"dashboard"},
 {id:"orders",title:"Siparişler",description:"Yeni, kargolanacak, teslim ve hakediş süreçlerini yönetin.",icon:"fa-bag-shopping",badge:32,kind:"orders"},
 {id:"products",title:"Ürünlerim",description:"Tekil ürün ekleyin, aktarım başlatın ve katalog durumlarını takip edin.",icon:"fa-box",kind:"products"},
 {id:"stock",title:"Stok Yönetimi",description:"Kritik stokları takip edin ve hızlı güncelleyin.",icon:"fa-boxes-stacked",kind:"list"},
 {id:"campaigns",title:"Kampanyalar",description:"Mağazanız için kampanya ve kupon oluşturun.",icon:"fa-bullhorn",kind:"modules"},
 {id:"messages",title:"Mesajlar",description:"Müşteri soruları, admin yanıtları ve mağaza mesajlarını takip edin.",icon:"fa-envelope",badge:5,kind:"list"},
 {id:"comments",title:"Yorumlar",description:"Ürün yorumlarını, puan trendini ve satıcı yanıtlarını yönetin.",icon:"fa-star",kind:"list"},
 {id:"finance",title:"Finans",description:"Hakediş, ödeme, fatura ve kesinti hareketlerini takip edin.",icon:"fa-wallet",kind:"orders"},
 {id:"reports",title:"Raporlar",description:"Satış, ürün ve mağaza performansınızı analiz edin.",icon:"fa-chart-line",kind:"modules"},
 {id:"settings",title:"Hesap / Kargo Ayarları",description:"Hesap, kargo ve bildirim tercihlerinizi yönetin.",icon:"fa-gear",kind:"settings"}
];
export const topSections:SellerSection[]=[
 {id:"seller-top-profile",title:"Mağaza Profili",description:"Mağaza adı, açıklama, logo, banner ve rozet görünümünü yönetin.",icon:"fa-store",kind:"settings"},
 {id:"seller-top-showcase",title:"Mağaza Vitrini",description:"Banner, tanıtım ve vitrin bloklarını yönetin.",icon:"fa-table-cells-large",kind:"modules"},
 {id:"seller-top-product-ranking",title:"Ürün Sıralaması",description:"Mağaza vitrini ürün sırası ve öne çıkarma durumunu yönetin.",icon:"fa-arrow-down-wide-short",kind:"products"},
 {id:"seller-top-documents",title:"Evraklarım",description:"Mağaza evraklarınızı ve doğrulama durumlarını takip edin.",icon:"fa-folder-open",kind:"list"},
 {id:"seller-top-announcements",title:"Duyurularım",description:"Admin tarafından gönderilen sistem ve kampanya duyurularını takip edin.",icon:"fa-bullhorn",kind:"list"},
 {id:"seller-top-import-sources",title:"Aktarım Kaynakları",description:"Excel, XML ve pazaryeri bağlantı ayarlarını yönetin.",icon:"fa-plug",kind:"modules"},
 {id:"seller-top-installments",title:"Taksit Bilgilerim",description:"Ürünlerinizde geçerli banka ve kart taksitlerini görüntüleyin.",icon:"fa-credit-card",kind:"list"},
 {id:"seller-top-shipping",title:"Kargo Ayarları",description:"Kargo firmaları, teslimat süresi ve ücretsiz kargo kurallarını yönetin.",icon:"fa-truck",kind:"settings"},
 {id:"seller-top-templates",title:"Ürün Şablonları",description:"Açıklama, garanti, iade ve teknik bilgi şablonlarını yönetin.",icon:"fa-clipboard-list",kind:"modules"},
 {id:"seller-top-integrations",title:"Entegrasyonlar",description:"Muhasebe, kargo ve ürün aktarım bağlantılarını yönetin.",icon:"fa-link",kind:"modules"},
 {id:"seller-top-notifications",title:"Bildirim Ayarları",description:"Sipariş, stok, kampanya ve finans bildirimlerini düzenleyin.",icon:"fa-bell",kind:"settings"}
];
export const allSections=[...sideSections,...topSections];
