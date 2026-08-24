export function SellerCinematicScene() {
  return (
    <section className="seller-cinema" aria-label="Satıcı mağazası ve satış paneli">
      <div className="cinema-light cinema-light-one" />
      <div className="cinema-light cinema-light-two" />
      <div className="cinema-stage">
        <div className="cinema-store">
          <div className="cinema-store-roof">
            {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
          </div>
          <div className="cinema-store-sign"><span>seller</span><b>studio</b><em>•</em></div>
          <div className="cinema-dashboard">
            <header><div><small>Satıcı Paneli</small><strong>Mağaza Özeti</strong></div><span><i /> Canlı</span></header>
            <div className="cinema-kpis">
              <article><small>Toplam Sipariş</small><strong>1.248</strong><em>↗ %18</em></article>
              <article><small>Mağaza Yönetimi</small><strong>Tek Panel</strong><em>Güvenli</em></article>
            </div>
            <div className="cinema-analytics">
              <article className="cinema-sales-chart">
                <div><strong>Satış Grafiği</strong><small>Son 7 gün</small></div>
                <svg viewBox="0 0 220 82" role="img" aria-label="Yükselen satış grafiği">
                  <defs><linearGradient id="sellerArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff5a30" stopOpacity=".34"/><stop offset="1" stopColor="#ff5a30" stopOpacity="0"/></linearGradient><filter id="sellerGlow"><feGaussianBlur stdDeviation="2.3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                  <path className="cinema-area" d="M4 70 C28 62 34 51 53 55 S83 69 100 44 S133 39 148 28 S181 37 216 8 L216 82 L4 82Z" />
                  <path className="cinema-line" d="M4 70 C28 62 34 51 53 55 S83 69 100 44 S133 39 148 28 S181 37 216 8" />
                  <circle cx="216" cy="8" r="4" />
                </svg>
              </article>
              <article className="cinema-donut-card"><strong>Hedef</strong><div className="cinema-donut"><span>78<small>%</small></span></div><small>Bu ay</small></article>
            </div>
            <div className="cinema-bestseller"><div><small>Ürün Yönetimi</small><strong>Katalog ve Sipariş</strong><span>Tek merkezden yönetin</span></div><div className="cinema-product"><i className="fa-solid fa-box-open"/><span>Aktif</span></div></div>
          </div>
          <div className="cinema-store-base"><span /><span /><span /></div>
        </div>
        <div className="cinema-props">
          <div className="cinema-box"><span>BE</span><i /></div>
          <div className="cinema-bag"><i /><span>be</span></div>
          <div className="cinema-plant"><div><i/><i/><i/><i/><i/></div><span /></div>
        </div>
        <div className="cinema-floor-shadow" />
      </div>
    </section>
  );
}
