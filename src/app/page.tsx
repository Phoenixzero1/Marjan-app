import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import HomeProductCard from "@/components/home/HomeProductCard";
import HeroSlider, { type SliderSettings } from "@/components/home/HeroSlider";
import MarjanTime, { type FlashProduct } from "@/components/home/MarjanTime";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marjan.ir";

export const metadata: Metadata = {
  title: "مارجان | فروشگاه لوازم ساختمانی و تأسیساتی",
  description: "بیش از ۱۵ سال تجربه در تأمین لوازم ساختمانی، شیرآلات، لوله، اتصالات و پمپ. هزاران قطعه اصل با ضمانت کیفیت و تحویل سریع.",
  alternates: { canonical: BASE },
  openGraph: {
    title: "مارجان | فروشگاه لوازم ساختمانی و تأسیساتی",
    description: "بیش از ۱۵ سال تجربه در تأمین لوازم ساختمانی و تأسیساتی",
    url: BASE,
    siteName: "مارجان",
    locale: "fa_IR",
    type: "website",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

type BannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  buttonText: string | null;
  buttonLink: string | null;
};

function activeBannerWhere(type: string) {
  const now = new Date();
  return {
    type,
    isActive: true,
    OR: [
      { startDate: null, endDate: null },
      { startDate: { lte: now }, endDate: null },
      { startDate: null, endDate: { gte: now } },
      { startDate: { lte: now }, endDate: { gte: now } },
    ],
  };
}

// ─── Data fetchers (sequential — no Promise.all with Prisma) ─────────────────

async function getSliderSettings(): Promise<SliderSettings> {
  try {
    const rows = await prisma.siteSettings.findMany({
      where: { key: { in: ["slider_autoplay", "slider_interval", "slider_arrows", "slider_dots"] } },
    });
    const get = (key: string, def: string) => rows.find((r) => r.key === key)?.value ?? def;
    return {
      autoPlay: get("slider_autoplay", "true") === "true",
      interval: parseInt(get("slider_interval", "5000")),
      showArrows: get("slider_arrows", "true") === "true",
      showDots: get("slider_dots", "true") === "true",
    };
  } catch {
    return { autoPlay: true, interval: 5000, showArrows: true, showDots: true };
  }
}

async function getHeroBanners() {
  try {
    return await prisma.banner.findMany({
      where: activeBannerWhere("hero"),
      orderBy: { sortOrder: "asc" },
      take: 8,
    });
  } catch { return []; }
}

async function getCategories() {
  try {
    return await prisma.category.findMany({
      where: { isActive: true, parentId: null, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      take: 12,
    });
  } catch { return []; }
}

async function getFlashDeal(): Promise<{
  title: string;
  endTime: string;
  discountPct: number;
  products: FlashProduct[];
} | null> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { key: "marjan_time_config" } });
    if (!row) return null;
    const cfg = JSON.parse(row.value) as {
      isActive: boolean;
      title: string;
      endTime: string | null;
      productIds: string[];
      discountPct: number;
    };
    if (!cfg.isActive || !cfg.endTime || !cfg.productIds?.length) return null;
    if (new Date(cfg.endTime) < new Date()) return null;

    const products = await prisma.product.findMany({
      where: { id: { in: cfg.productIds }, status: "PUBLISHED", deletedAt: null },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        sizes: { take: 6 },
      },
      take: 6,
    });

    return {
      title: cfg.title,
      endTime: cfg.endTime,
      discountPct: cfg.discountPct,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        imageUrl: p.images[0]?.url ?? null,
        sizeSummary: p.sizeSummary ?? null,
        sizes: p.sizes.map((s) => ({ label: s.label })),
      })),
    };
  } catch { return null; }
}

async function getBannersByType(type: string, limit: number): Promise<BannerRow[]> {
  try {
    return await prisma.banner.findMany({
      where: activeBannerWhere(type),
      orderBy: { sortOrder: "asc" },
      take: limit,
      select: { id: true, title: true, subtitle: true, imageUrl: true, buttonText: true, buttonLink: true },
    });
  } catch { return []; }
}

async function getProducts(opts: {
  take: number;
  orderBy: Record<string, string>;
  where?: Record<string, unknown>;
}) {
  try {
    return await prisma.product.findMany({
      where: { status: "PUBLISHED", deletedAt: null, ...opts.where },
      take: opts.take,
      orderBy: opts.orderBy,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        sizes: { take: 6 },
      },
    });
  } catch { return []; }
}

async function getBrands() {
  try {
    return await prisma.brand.findMany({
      where: { isActive: true },
      take: 6,
      orderBy: { name: "asc" },
    });
  } catch { return []; }
}

async function getBlogPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
    });
  } catch { return []; }
}

// ─── Fallback categories ──────────────────────────────────────────────────────

const FALLBACK_CATS = [
  { id: "1", name: "شیرآلات",    slug: "valves",   iconClass: "ti-circle-dotted", imageUrl: null },
  { id: "2", name: "لوله‌ها",    slug: "pipes",    iconClass: "ti-minus",          imageUrl: null },
  { id: "3", name: "اتصالات",   slug: "fittings", iconClass: "ti-git-merge",      imageUrl: null },
  { id: "4", name: "پمپ‌ها",     slug: "pumps",    iconClass: "ti-activity",       imageUrl: null },
  { id: "5", name: "بهداشتی",   slug: "sanitary", iconClass: "ti-droplet",         imageUrl: null },
  { id: "6", name: "یراق‌آلات", slug: "hardware", iconClass: "ti-tool",            imageUrl: null },
  { id: "7", name: "عایق‌ها",   slug: "insulation",iconClass:"ti-layers",          imageUrl: null },
  { id: "8", name: "ابزارآلات", slug: "tools",    iconClass: "ti-tool-2",          imageUrl: null },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // Sequential fetches — no Promise.all (Prisma PrismaPg adapter)
  const sliderSettings  = await getSliderSettings();
  const heroBanners     = await getHeroBanners();
  const dbCategories    = await getCategories();
  const flashDeal       = await getFlashDeal();
  const promo3Col       = await getBannersByType("promo_3col", 3);
  const bestsellers     = await getProducts({ take: 5, orderBy: { saleCount: "desc" }, where: { isFeatured: true } });
  const promo2ColA      = await getBannersByType("promo_2col_a", 2);
  const heroMainBanners = await getBannersByType("hero_main", 1);
  const newest          = await getProducts({ take: 5, orderBy: { createdAt: "desc" } });
  const promo2ColB      = await getBannersByType("promo_2col_b", 2);
  const brands          = await getBrands();
  const featured        = await getProducts({ take: 5, orderBy: { saleCount: "desc" }, where: { comparePrice: { not: null } } });
  const promo2ColC      = await getBannersByType("promo_2col_c", 2);
  const squareBanners   = await getBannersByType("square", 5);
  const blogPosts       = await getBlogPosts();

  const categories = dbCategories.length > 0
    ? dbCategories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, iconClass: c.iconClass ?? "ti-package", imageUrl: c.imageUrl }))
    : FALLBACK_CATS;

  const heroMainBanner = heroMainBanners[0] ?? null;

  // square banners fallback: use blog posts
  const squareItems: { id: string; title: string; imageUrl: string | null; link: string }[] =
    squareBanners.length > 0
      ? squareBanners.map((b) => ({ id: b.id, title: b.title, imageUrl: b.imageUrl, link: b.buttonLink ?? "#" }))
      : blogPosts.map((p) => ({ id: p.id, title: p.title, imageUrl: p.imageUrl, link: `/blog/${p.slug}` }));

  return (
    <>
      {/* ── HERO SLIDER ──────────────────────────────────────────────── */}
      {heroBanners.length > 0 ? (
        <HeroSlider
          slides={heroBanners.map((b) => ({ id: b.id, imageUrl: b.imageUrl, buttonLink: b.buttonLink }))}
          settings={sliderSettings}
        />
      ) : (
        <section style={{
          background: "linear-gradient(135deg,var(--primary-dark) 0%,var(--primary-mid) 60%,#1a5fa0 100%)",
          color: "#fff",
          padding: "4rem 2rem 3rem",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ maxWidth: 1240, margin: "auto", position: "relative" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(232,146,10,.2)", border: "1px solid rgba(232,146,10,.4)",
              color: "var(--accent)", padding: "5px 14px", borderRadius: 20,
              fontSize: 12, fontWeight: 700, marginBottom: "1.5rem",
            }}>
              <i className="ti ti-star-filled" /> تامین‌کننده معتمد لوازم ساختمانی
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.3, marginBottom: "1rem" }}>
              کامل‌ترین فروشگاه<br />
              <span style={{ color: "var(--accent)" }}>شیرآلات و لوله</span> در ایران
            </h1>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/products" style={{ background: "var(--accent)", color: "#fff", padding: "12px 28px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                <i className="ti ti-shopping-cart" /> مشاهده محصولات
              </Link>
              <Link href="/invoice" style={{ background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,.4)", padding: "10px 24px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                <i className="ti ti-file-invoice" /> فاکتور آنلاین
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── TRUST BAR ────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", boxShadow: "var(--shadow)" }}>
        <div style={{ maxWidth: 1240, margin: "auto", padding: "1.25rem 12px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
          {[
            { icon: "ti-shield-check",   title: "ضمانت اصالت کالا",  sub: "تمام محصولات دارای گارانتی" },
            { icon: "ti-truck-delivery", title: "ارسال سریع سراسری", sub: "۲۴ تا ۷۲ ساعت کاری" },
            { icon: "ti-refresh",        title: "۷ روز مرجوعی",      sub: "بدون شرط و دردسر" },
            { icon: "ti-headset",        title: "پشتیبانی فنی",       sub: "کارشناسان متخصص آماده‌اند" },
          ].map((t) => (
            <div key={t.title} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, background: "var(--bg)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className={`ti ${t.icon}`} style={{ fontSize: 20, color: "var(--primary)" }} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: 13, fontWeight: 900 }}>{t.title}</strong>
                <span style={{ fontSize: 11, color: "var(--text3)" }}>{t.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOMEPAGE TEMPLATE ─────────────────────────────────────────── */}
      <div className="hp-wrap">

        {/* ── 1. CATEGORY ICONS BAR ── */}
        <section className="categories-bar">
          {categories.slice(0, 8).map((cat) => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`} className="cat-item">
              <div className="cat-icon">
                {cat.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.imageUrl} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <i className={`ti ${cat.iconClass}`} style={{ fontSize: 24, color: "var(--primary)" }} />
                )}
              </div>
              <span>{cat.name}</span>
            </Link>
          ))}
        </section>

        {/* ── 2. MARJAN TIME (dark row) ── */}
        {flashDeal && (
          <MarjanTime
            title={flashDeal.title}
            endTime={flashDeal.endTime}
            discountPct={flashDeal.discountPct}
            products={flashDeal.products}
          />
        )}

        {/* ── 3. THREE-COLUMN BANNER ROW ── */}
        {promo3Col.length > 0 && (
          <div className="banner-row banner-row--3">
            {promo3Col.map((b) => (
              <Link key={b.id} href={b.buttonLink ?? "#"} className="promo-banner">
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt={b.title} className="promo-banner-img" />
                ) : (
                  <div className="promo-banner-img" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%)" }} />
                )}
                <div className="promo-banner-text">
                  <p>{b.title}</p>
                  {b.buttonText && <span className="btn-link">{b.buttonText}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── 4. BESTSELLERS (light row, 5 cols) ── */}
        {bestsellers.length > 0 && (
          <section className="product-row product-row--light">
            <div className="row-header">
              <Link href="/products" className="show-all">مشاهده همه</Link>
              <h2 className="row-title">
                پرفروش‌ترین محصولات
                <span className="badge-count">{bestsellers.length}</span>
              </h2>
            </div>
            <div className="row-cards row-cards--5">
              {bestsellers.map((p) => (
                <HomeProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                  price={p.price}
                  comparePrice={p.comparePrice}
                  images={p.images}
                  sizes={p.sizes.map((s) => ({ label: s.label }))}
                  sizeSummary={p.sizeSummary}
                  isNew={p.isNew}
                  stockQty={p.stockQty}
                  sectionLabel="پرفروش"
                  variant="light"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 5. TWO-COLUMN BANNER ROW A ── */}
        {promo2ColA.length > 0 && (
          <div className="banner-row banner-row--2">
            {promo2ColA.map((b) => (
              <Link key={b.id} href={b.buttonLink ?? "#"} className="promo-banner promo-banner--wide">
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt={b.title} className="promo-banner-img" />
                ) : (
                  <div className="promo-banner-img" style={{ background: "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-mid) 100%)" }} />
                )}
                <div className="promo-banner-text">
                  <p>{b.title}</p>
                  {b.buttonText && <span className="btn-link">{b.buttonText}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── 6. CIRCLE ICONS SECTION ── */}
        {categories.length > 0 && (
          <section className="circle-icons-section">
            <h3 className="section-title-center">دسته‌بندی محصولات</h3>
            <div className="circle-icons-row">
              {categories.slice(0, 8).map((cat) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className="circle-item">
                  <div className="circle-icon">
                    {cat.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cat.imageUrl} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <i className={`ti ${cat.iconClass}`} style={{ fontSize: 28, color: "var(--primary)" }} />
                    )}
                  </div>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 7. HERO BANNER (full width single) ── */}
        {heroMainBanner && (
          <div className="hero-banner-section">
            <Link href={heroMainBanner.buttonLink ?? "#"} className="hero-banner">
              {heroMainBanner.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroMainBanner.imageUrl} alt={heroMainBanner.title} className="hero-banner-img" />
              ) : (
                <div className="hero-banner-img" />
              )}
              <div className="hero-banner-content">
                <h3>{heroMainBanner.title}</h3>
                {heroMainBanner.subtitle && <p>{heroMainBanner.subtitle}</p>}
                {heroMainBanner.buttonText && <span className="btn-link">{heroMainBanner.buttonText}</span>}
              </div>
            </Link>
          </div>
        )}

        {/* ── 8. NEWEST PRODUCTS (light row, 5 cols) ── */}
        {newest.length > 0 && (
          <section className="product-row product-row--light">
            <div className="row-header">
              <Link href="/products?sort=newest" className="show-all">مشاهده همه</Link>
              <h2 className="row-title">
                جدیدترین محصولات
                <span className="badge-count">{newest.length}</span>
              </h2>
            </div>
            <div className="row-cards row-cards--5">
              {newest.map((p) => (
                <HomeProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                  price={p.price}
                  comparePrice={p.comparePrice}
                  images={p.images}
                  sizes={p.sizes.map((s) => ({ label: s.label }))}
                  sizeSummary={p.sizeSummary}
                  isNew={p.isNew}
                  stockQty={p.stockQty}
                  sectionLabel="جدید"
                  variant="light"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 9. TWO-COLUMN BANNER ROW B ── */}
        {promo2ColB.length > 0 && (
          <div className="banner-row banner-row--2">
            {promo2ColB.map((b) => (
              <Link key={b.id} href={b.buttonLink ?? "#"} className="promo-banner promo-banner--wide">
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt={b.title} className="promo-banner-img" />
                ) : (
                  <div className="promo-banner-img" style={{ background: "linear-gradient(135deg, #a50f22 0%, #c0392b 100%)" }} />
                )}
                <div className="promo-banner-text">
                  <p>{b.title}</p>
                  {b.buttonText && <span className="btn-link">{b.buttonText}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── 10. BRANDS SECTION ── */}
        {brands.length > 0 && (
          <section className="brands-section">
            <div className="brands-row">
              {brands.map((b) => (
                <div key={b.id} className="brand-logo">
                  {b.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logoUrl} alt={b.name} />
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, textAlign: "center", padding: "0 4px" }}>{b.name}</span>
                  )}
                </div>
              ))}
            </div>
            <Link href="/products" className="brands-cta">
              <span>همه برندها</span>
              <i className="ti ti-arrow-left" />
            </Link>
          </section>
        )}

        {/* ── 11. SQUARE ICONS SECTION (dark navy) ── */}
        {categories.length > 0 && (
          <section className="square-icons-section">
            <div className="section-title-with-link">
              <span>دسته‌بندی‌ها</span>
              <span className="subtitle-light">انتخاب بر اساس نوع کالا</span>
              <Link href="/products" className="show-all--right">مشاهده همه</Link>
            </div>
            <div className="square-icons-grid">
              {categories.slice(0, 6).map((cat) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className="square-item">
                  <div className="square-icon">
                    {cat.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cat.imageUrl} alt={cat.name} />
                    ) : (
                      <i className={`ti ${cat.iconClass}`} style={{ fontSize: 24, color: "rgba(255,255,255,.8)" }} />
                    )}
                  </div>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 12. FEATURED / SALE PRODUCTS (dark row, 5 cols) ── */}
        {featured.length > 0 && (
          <section className="product-row product-row--dark">
            <div className="row-header">
              <Link href="/products?filter=sale" className="show-all">مشاهده همه</Link>
              <h2 className="row-title">
                پیشنهادات ویژه
                <span className="badge-count">{featured.length}</span>
              </h2>
            </div>
            <div className="row-cards row-cards--5">
              {featured.map((p) => (
                <HomeProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                  price={p.price}
                  comparePrice={p.comparePrice}
                  images={p.images}
                  sizes={p.sizes.map((s) => ({ label: s.label }))}
                  sizeSummary={p.sizeSummary}
                  isNew={p.isNew}
                  stockQty={p.stockQty}
                  sectionLabel="تخفیف"
                  variant="dark"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 13. TWO-COLUMN BANNER ROW C ── */}
        {promo2ColC.length > 0 && (
          <div className="banner-row banner-row--2">
            {promo2ColC.map((b) => (
              <Link key={b.id} href={b.buttonLink ?? "#"} className="promo-banner promo-banner--wide">
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt={b.title} className="promo-banner-img" />
                ) : (
                  <div className="promo-banner-img" style={{ background: "linear-gradient(135deg, var(--primary) 0%, #1a5fa0 100%)" }} />
                )}
                <div className="promo-banner-text">
                  <p>{b.title}</p>
                  {b.buttonText && <span className="btn-link">{b.buttonText}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── 14. SQUARE BANNERS (blog posts or admin-managed square banners) ── */}
        {squareItems.length > 0 && (
          <section className="square-banners-section">
            <div className="row-header">
              <Link href="/blog" className="show-all">مشاهده همه</Link>
              <h2 className="row-title">آخرین مطالب</h2>
            </div>
            <div className="square-banners-row">
              {squareItems.slice(0, 5).map((item) => (
                <Link key={item.id} href={item.link} className="square-banner">
                  <div className="square-banner-img">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.title} />
                    ) : (
                      <i className="ti ti-article" style={{ fontSize: 36, color: "var(--border)" }} />
                    )}
                  </div>
                  <p>{item.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </>
  );
}
