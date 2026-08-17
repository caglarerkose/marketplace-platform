const kpis = [
  ["Toplam Ciro", "₺28.456.789", "+%18,6", "▥"], ["Aktif Satıcı", "12.842", "+%9,3", "▣"],
  ["Aktif Müşteri", "1.234.567", "+%12,4", "♙"], ["Günlük Sipariş", "24.657", "+%21,7", "▱"],
  ["Onay Bekleyen Ürün", "5.432", "+%5,8", "□"], ["Destek Talepleri", "256", "+%6,3", "?"],
];

const sellers = [["T", "TeknoLife Elektronik", "Elektronik · 10:23"], ["M", "ModaVitrin", "Moda · 09:47"], ["H", "HomeComfort", "Ev & Yaşam · 09:15"], ["S", "Sportiva", "Spor & Outdoor · 08:56"]];
const tickets = [["#STK-84521", "İade / Para İadesi", "Açık"], ["#STK-84520", "Kargo Gecikmesi", "Açık"], ["#STK-84519", "Ürün Hasarlı Geldi", "İnceleniyor"], ["#STK-84518", "Fatura Talebi", "Yanıtlandı"]];

export default function Dashboard() {
  return <div className="content">
    <div className="page-head"><div><p className="eyebrow">GENEL BAKIŞ</p><h1>Hoş geldiniz, Admin 👋</h1><p>Platform performansını ve bekleyen işlemleri buradan takip edin.</p></div><div className="head-actions"><button className="button secondary">18 Ağustos 2026</button><button className="button primary">Raporu İndir</button></div></div>
    <section className="kpi-grid">{kpis.map(([label, value, trend, icon]) => <article className="kpi" key={label}><div className="kpi-top"><span>{icon}</span><em>{trend}</em></div><p>{label}</p><strong>{value}</strong><small>Düne göre yükseliş</small></article>)}</section>
    <section className="quick"><strong>Hızlı İşlemler</strong><button>＋ Satıcı Onayla</button><button>＋ Kampanya Yayınla</button><button>＋ Duyuru Oluştur</button><button>Toplu Ürün Onayla</button></section>
    <section className="dashboard-grid">
      <article className="card performance"><div className="card-head"><div><p>Satış Performansı</p><strong>₺28.456.789</strong></div><button>Son 7 Gün⌄</button></div><div className="chart"><div className="chart-lines"/><div className="bars">{[42,58,48,72,62,88,77,94,71,83,96,89].map((n,i)=><i key={i} style={{height:`${n}%`}} />)}</div></div><div className="chart-footer"><span><i/> Ciro</span><span><i/> Sipariş</span><b>172.453 sipariş</b></div></article>
      <article className="card"><div className="card-head"><p>Onay Bekleyen Satıcılar</p><a href="/saticilar">Tümünü Gör</a></div><div className="rows">{sellers.map(([letter,name,meta])=><div className="list-row" key={name}><span className="avatar">{letter}</span><div><strong>{name}</strong><small>{meta}</small></div><button>İncele</button></div>)}</div></article>
      <article className="card"><div className="card-head"><p>Son Destek Talepleri</p><a href="/destek">Tümünü Gör</a></div><div className="rows">{tickets.map(([id,title,status])=><div className="ticket" key={id}><span>{id}</span><div><strong>{title}</strong><small>Müşteri destek talebi</small></div><em className={status === "Yanıtlandı" ? "success" : "warning"}>{status}</em></div>)}</div></article>
    </section>
    <section className="card table-card"><div className="card-head"><p>Son Sistem Aktiviteleri</p><span className="live">● Canlı Akış</span></div><div className="activity-table"><div><b>Yeni satıcı başvurusu</b><span>TeknoLife Elektronik</span><time>2 dk önce</time></div><div><b>Toplu ürün onayı</b><span>58 ürün yayına alındı</span><time>18 dk önce</time></div><div><b>Kampanya yayınlandı</b><span>Büyük İndirim Günleri</span><time>34 dk önce</time></div></div></section>
  </div>;
}
