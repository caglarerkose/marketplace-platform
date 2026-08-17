import { notFound } from "next/navigation";
import { modules, type ModuleKey } from "@/data/admin";

export function generateStaticParams() { return Object.keys(modules).map((module) => ({ module })); }

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!(module in modules)) notFound();
  const item = modules[module as ModuleKey];
  return <div className="content">
    <div className="page-head"><div><p className="eyebrow">YÖNETİM MODÜLÜ</p><h1>{item.title}</h1><p>{item.description}</p></div><button className="button primary">＋ {item.action}</button></div>
    <section className="module-kpis"><article><span>ÖZET</span><strong>{item.metric}</strong><p>{item.metricLabel}</p></article><article><span>BUGÜN</span><strong>+18</strong><p>Yeni işlem</p></article><article><span>DURUM</span><strong className="green-text">Aktif</strong><p>Sistemler çalışıyor</p></article></section>
    <section className="card module-card"><div className="card-head"><div><p>{item.title} Listesi</p><small>Son güncelleme: az önce</small></div><div className="filter-actions"><button>Filtrele</button><button>Dışa Aktar</button></div></div><div className="empty-state"><span>▦</span><h2>{item.title} altyapısı hazır</h2><p>Bu ekran gerçek API ve Supabase verileri bağlandığında canlı kayıtları gösterecek. Tasarım ve route yapısı yayına hazırdır.</p><button className="button primary">İlk Kaydı Oluştur</button></div></section>
  </div>;
}
