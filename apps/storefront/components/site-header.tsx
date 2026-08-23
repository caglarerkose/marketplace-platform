"use client";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "./store-provider";
type HeaderCategory={id:string;name:string;slug:string};
const prompts = [
  "Ürün, kategori veya marka ara",
  "Görselle ara",
  "Sizin neyiniz eksik? :)",
];
export function SiteHeader() {
  const path = usePathname(),
    router = useRouter(),
    { cart, favorites, toggleFavorite } = useStore(),
    [query, setQuery] = useState(""),
    [mobileMenu, setMobileMenu] = useState(false),
    [prompt, setPrompt] = useState(""),
    [categories, setCategories] = useState<HeaderCategory[]>([]),
    [notificationCount, setNotificationCount] = useState(0),
    [productScrolled, setProductScrolled] = useState(false),
    inner = path !== "/",
    productDetail = path.startsWith("/urun/"),
    activeProduct = productDetail ? {id:decodeURIComponent(path.split("/").pop()||""),name:"Ürün"} : undefined;
  useEffect(()=>{fetch("/api/catalog-categories").then(async response=>{const result=await response.json();if(response.ok)setCategories(result.categories||[])}).catch(()=>{})},[]);
  useEffect(()=>{fetch("/api/customer/notifications").then(async response=>{if(response.ok){const result=await response.json();setNotificationCount(result.unread||0)}}).catch(()=>{})},[path]);
  useEffect(() => {
    let word = 0,
      char = 0,
      deleting = false;
    const tick = () => {
      const target = prompts[word];
      if (!deleting) {
        char++;
        setPrompt(target.slice(0, char));
        if (char === target.length) {
          deleting = true;
          return 1700;
        }
      } else {
        char--;
        setPrompt(target.slice(0, char));
        if (char === 0) {
          deleting = false;
          word = (word + 1) % prompts.length;
          return 350;
        }
      }
      return deleting ? 45 : 75;
    };
    let timer: ReturnType<typeof setTimeout>;
    const run = () => {
      timer = setTimeout(() => {
        const delay = tick();
        timer = setTimeout(run, delay || 60);
      }, 60);
    };
    run();
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!productDetail) {
      setProductScrolled(false);
      document.documentElement.classList.remove("product-detail-scrolled");
      return;
    }
    const update = () => {
      const scrolled = window.scrollY > 240;
      setProductScrolled(scrolled);
      document.documentElement.classList.toggle("product-detail-scrolled", scrolled);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      document.documentElement.classList.remove("product-detail-scrolled");
    };
  }, [productDetail]);
  const shareProduct = async () => {
    const data = { title: activeProduct?.name ?? "Ürün", url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else await navigator.clipboard?.writeText(data.url);
  };
  const search = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim())
      router.push(`/arama?q=${encodeURIComponent(query.trim())}`);
  };
  return (
    <>
      <div className="top-bar">
        <span>
          ▣ App’i İndir, Özel Kuponları Kaçırma!{" "}
          <Link href="/arama?q=indirim">İndirimli Ürünlere Git</Link>
        </span>
        <nav>
          <a href="#footer">Yardım & Destek</a>
          <Link href="/arama?q=kampanya">Kampanyalar</Link>
          <a href="https://marketplace-platform-seller-panel.vercel.app/apply">
            Satıcı Ol
          </a>
        </nav>
      </div>
      <header className="market-header">
        <div className="header-main">
          <button
            className="mobile-leading"
            onClick={() => (inner ? router.back() : setMobileMenu(!mobileMenu))}
            aria-label={inner ? "Geri" : "Menü"}
          >
            <i className={`fa-solid ${inner ? "fa-arrow-left" : "fa-bars"}`} />
          </button>
          <Link className="site-logo" href="/">
            <Image
              className="logo-bag"
              src="/img/sepet.png"
              width={205}
              height={187}
              alt=""
              priority
            />
            <Image
              className="logo-word"
              src="/img/anayazi.png"
              width={235}
              height={48}
              alt="BişeyEksik"
              priority
            />
          </Link>
          <form className="search" onSubmit={search}>
            <i className="fa-solid fa-magnifying-glass" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={prompt}
            />
            <button
              type="button"
              className="image-search-btn"
              aria-label="Fotoğraf ile ara"
            >
              <i className="fa-solid fa-camera" />
            </button>
            <button type="submit" className="search-submit">
              Ara
            </button>
          </form>
          <div className="header-actions">
            <Link href="/favoriler">
              <i className="fa-regular fa-heart" />
              Favorilerim{favorites.length > 0 && <b>{favorites.length}</b>}
            </Link>
            <Link href="/hesabim">
              <i className="fa-solid fa-user" />
              Hesabım
            </Link>
            <Link href="/sepet">
              <i className="fa-solid fa-cart-shopping" />
              Sepetim
              {cart.length > 0 && (
                <b>{cart.reduce((n, x) => n + x.quantity, 0)}</b>
              )}
            </Link>
          </div>
          <div className="mobile-icons">
            {!inner && (
              <>
                <Link href="/hesabim?tab=mesajlar" aria-label="Mesajlar"><i className="fa-solid fa-message" /></Link>
                <Link href="/hesabim?tab=bildirimler" aria-label="Bildirimler"><i className="fa-solid fa-bell" />{notificationCount>0&&<b className="notification-dot">{notificationCount}</b>}</Link>
              </>
            )}
            {productDetail && (
              <>
                <Link href="/sepet" aria-label="Sepet"><i className="fa-solid fa-cart-shopping" />{cart.length > 0 && <b>{cart.reduce((n, x) => n + x.quantity, 0)}</b>}</Link>
                <button type="button" onClick={shareProduct} aria-label="Ürünü paylaş"><i className="fa-solid fa-share-nodes" /></button>
                {productScrolled && activeProduct && (
                  <button className={`mobile-floating-favorite ${favorites.includes(activeProduct.id) ? "active" : ""}`} onClick={() => toggleFavorite(activeProduct.id)} aria-label="Favoriye ekle"><i className="fa-solid fa-heart" /></button>
                )}
              </>
            )}
            {inner && !productDetail && (
              <>
                <Link href="/favoriler"><i className="fa-regular fa-heart" />{favorites.length > 0 && <b>{favorites.length}</b>}</Link>
                <Link href="/hesabim"><i className="fa-solid fa-user" /></Link>
              </>
            )}
          </div>
        </div>
        <div className="category-row">
          <div className="all-categories-wrap">
            <Link className="all-categories" href="/kategoriler">
              <i className="fa-solid fa-bars" />
              Tüm Kategoriler
            </Link>
            <div className="category-mega-menu">
              {categories.slice(0, 9).map((category, index) => (
                <section key={category.id}>
                  <Link
                    href={`/kategori/${category.slug}`}
                  >
                    <i
                      className={`fa-solid ${["fa-laptop", "fa-house", "fa-shirt", "fa-baby", "fa-spray-can-sparkles", "fa-car", "fa-screwdriver-wrench", "fa-person-running", "fa-book"][index]}`}
                    />
                    {category.name}
                  </Link>
                </section>
              ))}
            </div>
          </div>
          <nav>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/kategori/${c.slug}`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </div>
        {mobileMenu && (
          <div className="mobile-category-menu">
            {categories.map((c) => (
              <Link
                onClick={() => setMobileMenu(false)}
                key={c.id}
                href={`/kategori/${c.slug}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
