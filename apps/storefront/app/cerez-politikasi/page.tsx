export const metadata = {
  title: "Çerez Politikası | BişeyEksik",
  description: "BişeyEksik çerez ve benzeri teknolojiler politikası.",
};

export default function CookiePolicyPage() {
  return (
    <div className="cookie-policy-page">
      <header>
        <p>Son güncelleme: 25 Ağustos 2026</p>
        <h1>Çerez Politikası</h1>
        <p>Bu politika, BişeyEksik pazaryerinde kullanılan çerezleri ve benzeri tarayıcı teknolojilerini açıklar.</p>
      </header>
      <section>
        <h2>Kullandığımız kategoriler</h2>
        <div className="cookie-policy-table" role="table" aria-label="Çerez kategorileri">
          <div className="cookie-policy-row cookie-policy-heading" role="row"><strong>Kategori</strong><strong>Amaç</strong><strong>Saklama</strong></div>
          <div className="cookie-policy-row" role="row"><strong>Zorunlu</strong><span>Oturum güvenliği, tercih kaydı ve temel site işlevleri.</span><span>Oturum boyunca veya en fazla 1 yıl</span></div>
          <div className="cookie-policy-row" role="row"><strong>İşlevsel</strong><span>Misafir sepeti, favoriler ve kullanıcı tercihleri.</span><span>En fazla 1 yıl</span></div>
          <div className="cookie-policy-row" role="row"><strong>Analiz</strong><span>İzin verilmesi halinde kullanım ve performans ölçümü.</span><span>Sağlayıcı ayarına göre, en fazla 2 yıl</span></div>
          <div className="cookie-policy-row" role="row"><strong>Pazarlama</strong><span>İzin verilmesi halinde reklam etkinliği ve ilişkilendirme ölçümü.</span><span>Sağlayıcı ayarına göre, en fazla 1 yıl</span></div>
        </div>
      </section>
      <section>
        <h2>Tercihlerinizi değiştirme</h2>
        <p>Zorunlu olmayan kategorileri ilk ziyaretinizde kabul edebilir, reddedebilir veya ayrı ayrı seçebilirsiniz. Footer’daki “Çerez Tercihleri” bağlantısıyla kararınızı dilediğiniz zaman değiştirebilirsiniz.</p>
      </section>
      <section>
        <h2>İletişim</h2>
        <p>Politika ve kişisel verilerinizle ilgili sorularınız için destek@biseyeksik.com adresinden bize ulaşabilirsiniz.</p>
      </section>
    </div>
  );
}
