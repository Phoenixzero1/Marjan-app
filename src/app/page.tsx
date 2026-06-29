import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import HomeProductCard from "@/components/home/HomeProductCard";
import HeroSlider, { type SliderSettings } from "@/components/home/HeroSlider";
import MarjanTime, { type FlashProduct } from "@/components/home/MarjanTime";
import CategoryCircle from "@/components/home/CategoryCircle";
import BrandCard from "@/components/home/BrandCard";
import FeaturedShowcase, { type ShowcaseSlide } from "@/components/home/FeaturedShowcase";
import HScrollSlider from "@/components/ui/HScrollSlider";

// Always render fresh — flash deal config, sliders and products change via admin
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

// ─── Data Fetchers ─────────────────────────────────────────────────────────────

async function getHeroBanners() {
  try {
    const now = new Date();
    return await prisma.banner.findMany({
      where: {
        type: "hero",
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { sortOrder: "asc" },
      take: 8,
    });
  } catch {
    return [];
  }
}

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

async function getCategories() {
  try {
    return await prisma.category.findMany({
      where: { isActive: true, parentId: null, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      take: 12,
    });
  } catch {
    return [];
  }
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
  } catch {
    return null;
  }
}

async function getBestsellerProducts() {
  try {
    return await prisma.product.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      take: 8,
      orderBy: { saleCount: "desc" },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        brand: { select: { name: true } },
        sizes: { take: 6 },
      },
    });
  } catch {
    return [];
  }
}

async function getNewestProducts() {
  try {
    return await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        brand: { select: { name: true } },
        sizes: { take: 6 },
      },
    });
  } catch {
    return [];
  }
}

async function getPromoBanners() {
  try {
    const now = new Date();
    return await prisma.banner.findMany({
      where: {
        type: "promo",
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { sortOrder: "asc" },
      take: 4,
    });
  } catch {
    return [];
  }
}

async function getShowcaseSlides(): Promise<ShowcaseSlide[]> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { key: "featured_showcase" } });
    if (!row) return [];
    const cfg = JSON.parse(row.value) as { slides: ShowcaseSlide[] };
    return cfg.slides ?? [];
  } catch {
    return [];
  }
}

async function getBrands() {
  try {
    return await prisma.brand.findMany({
      where: { isActive: true },
      take: 12,
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

async function getLatestPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: { category: { select: { name: true } } },
    });
  } catch {
    return [];
  }
}

// Fallback categories when DB is empty
const FALLBACK_CATEGORIES = [
  { id: "1", name: "شیرآلات",    slug: "valves",    iconClass: "ti-circle-dotted", imageUrl: null, count: "+۳۴۰۰" },
  { id: "2", name: "لوله‌ها",    slug: "pipes",     iconClass: "ti-minus",          imageUrl: null, count: "+۱۸۰۰" },
  { id: "3", name: "اتصالات",   slug: "fittings",  iconClass: "ti-git-merge",      imageUrl: null, count: "+۲۲۰۰" },
  { id: "4", name: "پمپ‌ها",     slug: "pumps",     iconClass: "ti-activity",       imageUrl: null, count: "+۵۰۰" },
  { id: "5", name: "بهداشتی",   slug: "sanitary",  iconClass: "ti-droplet",         imageUrl: null, count: "+۱۲۰۰" },
  { id: "6", name: "یراق‌آلات", slug: "hardware",  iconClass: "ti-tool",            imageUrl: null, count: "+۸۰۰" },
];

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({
  title, href, linkLabel = "مشاهده همه", badge, bar,
}: {
  title: string;
  href: string;
  linkLabel?: string;
  badge?: { icon: string; text: string };
  bar?: { bg: string; icon?: string };
}) {
  if (bar) {
    // Full-width colored bar spanning the top of the section card
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: bar.bg,
          margin: "-1.75rem -2rem 1.5rem",
          padding: "13px 2rem",
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          {bar.icon && <i className={`ti ${bar.icon}`} style={{ fontSize: 18 }} />}
          {title}
        </h2>
        <Link
          href={href}
          style={{ color: "rgba(255,255,255,.85)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}
        >
          {linkLabel} <i className="ti ti-arrow-left" />
        </Link>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {badge && (
        <span className="section-badge" style={{ marginBottom: 8 }}>
          <i className={`ti ${badge.icon}`} /> {badge.text}
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
          <span style={{ display: "block", width: 5, height: 24, background: "var(--accent)", borderRadius: 3, flexShrink: 0 }} />
          {title}
        </h2>
        <Link href={href} className="sec-link">
          {linkLabel} <i className="ti ti-arrow-left" />
        </Link>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [
    heroBanners,
    sliderSettings,
    dbCategories,
    flashDeal,
    bestsellers,
    newest,
    promoBanners,
    brands,
    posts,
    showcaseSlides,
  ] = await Promise.all([
    getHeroBanners(),
    getSliderSettings(),
    getCategories(),
    getFlashDeal(),
    getBestsellerProducts(),
    getNewestProducts(),
    getPromoBanners(),
    getBrands(),
    getLatestPosts(),
    getShowcaseSlides(),
  ]);

  const categories = dbCategories.length > 0
    ? dbCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        iconClass: c.iconClass ?? "ti-package",
        imageUrl: c.imageUrl,
        count: null,
      }))
    : FALLBACK_CATEGORIES;

  // MarjanTime product ID set — lets ProductCard know which cards are in the deal
  const marjanIds = new Set(flashDeal?.products.map((p) => p.id) ?? []);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      {heroBanners.length > 0 ? (
        <HeroSlider
          slides={heroBanners.map((b) => ({
            id: b.id,
            imageUrl: b.imageUrl,
            buttonLink: b.buttonLink,
          }))}
          settings={sliderSettings}
        />
      ) : (
        <section
          style={{
            background:
              "linear-gradient(135deg,var(--primary-dark) 0%,var(--primary-mid) 60%,#1a5fa0 100%)",
            color: "#fff",
            padding: "5rem 2rem 4rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 80% 50%,rgba(232,146,10,.12) 0%,transparent 60%)",
            }}
          />
          <div
            className="grid grid-cols-1 lg:grid-cols-2 items-center"
            style={{ maxWidth: 1280, margin: "auto", gap: "3rem", position: "relative" }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(232,146,10,.2)",
                  border: "1px solid rgba(232,146,10,.4)",
                  color: "var(--accent)",
                  padding: "5px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: "1.5rem",
                }}
              >
                <i className="ti ti-star-filled" /> تامین‌کننده معتمد لوازم ساختمانی
              </div>
              <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.2, marginBottom: "1rem" }}>
                کامل‌ترین فروشگاه<br />
                <span style={{ color: "var(--accent)" }}>شیرآلات و لوله</span>
                <br />در ایران
              </h1>
              <p style={{ color: "rgba(255,255,255,.75)", fontSize: 15, maxWidth: 420, marginBottom: "2rem" }}>
                هزاران قطعه اصل از بهترین برندها — تبریز، لگریس، ویر، پیوند — با ضمانت کیفیت و
                تحویل سریع.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link
                  href="/products"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    padding: "13px 28px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    fontWeight: 900,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    textDecoration: "none",
                  }}
                >
                  <i className="ti ti-shopping-cart" /> مشاهده محصولات
                </Link>
                <Link
                  href="/invoice"
                  style={{
                    background: "transparent",
                    color: "#fff",
                    border: "2px solid rgba(255,255,255,.4)",
                    padding: "11px 24px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    textDecoration: "none",
                  }}
                >
                  <i className="ti ti-file-invoice" /> فاکتور آنلاین
                </Link>
              </div>
              <div
                style={{ display: "flex", gap: "2rem", marginTop: "2.5rem", flexWrap: "wrap" }}
              >
                {[
                  { val: "+۱۲۰۰۰", label: "محصول" },
                  { val: "+۸۵۰", label: "برند" },
                  { val: "+۱۵سال", label: "تجربه" },
                  { val: "۲۴/۷", label: "پشتیبانی" },
                ].map((s) => (
                  <div key={s.label}>
                    <strong
                      style={{ display: "block", fontSize: 24, fontWeight: 900, color: "var(--accent)" }}
                    >
                      {s.val}
                    </strong>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <div
                style={{
                  background: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.15)",
                  borderRadius: "var(--radius)",
                  width: "100%",
                  maxWidth: 420,
                  aspectRatio: "4/3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <i
                  className="ti ti-building-warehouse"
                  style={{ fontSize: 90, color: "rgba(255,255,255,.2)" }}
                />
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", fontWeight: 700 }}>
                  انبار مرکزی Marjan
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── TRUST BAR ────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", boxShadow: "var(--shadow)" }}>
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ maxWidth: 1280, margin: "auto", padding: "1.25rem 2rem" }}
        >
          {[
            { icon: "ti-shield-check",   title: "ضمانت اصالت کالا",  sub: "تمام محصولات دارای گارانتی" },
            { icon: "ti-truck-delivery", title: "ارسال سریع سراسری", sub: "۲۴ تا ۷۲ ساعت کاری" },
            { icon: "ti-refresh",        title: "۷ روز مرجوعی",      sub: "بدون شرط و دردسر" },
            { icon: "ti-headset",        title: "پشتیبانی فنی",       sub: "کارشناسان متخصص آماده‌اند" },
          ].map((t) => (
            <div key={t.title} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: "var(--bg)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
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

      {/* ── CATEGORY CIRCLES ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "1.5rem auto 1rem", padding: "0 1rem" }}>
        <div className="section-card">
          <SectionHeader title="دسته‌بندی محصولات" href="/products" linkLabel="همه دسته‌ها" bar={{ bg: "var(--primary-mid)", icon: "ti-category" }} />
          <HScrollSlider gap={16} scrollAmount={220}>
            {categories.map((cat) => (
              <CategoryCircle key={cat.id} {...cat} />
            ))}
          </HScrollSlider>
        </div>
      </div>

      {/* ── مرجان تایم FLASH DEALS ────────────────────────────────────── */}
      {flashDeal && (
        <div style={{ maxWidth: 1280, margin: "1rem auto", padding: "0 1rem" }}>
          <MarjanTime
            title={flashDeal.title}
            endTime={flashDeal.endTime}
            discountPct={flashDeal.discountPct}
            products={flashDeal.products}
          />
        </div>
      )}

      {/* ── BESTSELLERS ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "1rem auto", padding: "0 1rem" }}>
        <div className="section-card">
          <SectionHeader
            title="پرفروش‌ترین محصولات"
            href="/products"
            bar={{ bg: "var(--primary)", icon: "ti-flame" }}
          />
          {bestsellers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
              <i className="ti ti-package" style={{ fontSize: 48, display: "block", marginBottom: 12 }} />
              <p>پس از افزودن محصول توسط ادمین اینجا نمایش داده می‌شود.</p>
            </div>
          ) : (
            <HScrollSlider gap={12} scrollAmount={190}>
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
                  marjanTime={marjanIds.has(p.id) && flashDeal ? { discountPct: flashDeal.discountPct, endTime: flashDeal.endTime } : undefined}
                />
              ))}
            </HScrollSlider>
          )}
        </div>
      </div>

      {/* ── FEATURED SHOWCASE ────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "1rem auto", padding: "0 1rem" }}>
        <FeaturedShowcase slides={showcaseSlides} />
      </div>

      {/* ── PROMO BANNERS ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "1rem auto", padding: "0 1rem" }}>
        <div className="section-card">
          <SectionHeader
            title="پیشنهادهای ویژه"
            href="/products?tag=promo"
            bar={{ bg: "linear-gradient(135deg,#b54a00,var(--accent))", icon: "ti-tag" }}
          />
          <div className="grid banner-grid gap-4">
            {(promoBanners.length > 0 ? promoBanners.map((b) => ({
              key: b.id,
              bg: b.imageUrl
                ? `url(${b.imageUrl}) center/cover no-repeat`
                : "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))",
              overlay: !!b.imageUrl,
              title: b.title,
              subtitle: b.subtitle,
              btnText: b.buttonText,
              btnLink: b.buttonLink,
              btnColor: "var(--primary)",
              icon: "ti-tag",
            })) : [
              { key: "promo1", bg: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", overlay: false, title: "خرید عمده با بهترین قیمت", subtitle: "برای پروژه‌های بزرگ و پیمانکاران، قیمت ویژه عمده داریم.", btnText: "استعلام عمده", btnLink: "/invoice?type=contractor", btnColor: "var(--primary)", icon: "ti-building" },
              { key: "promo2", bg: "linear-gradient(135deg,#b54a00,var(--accent))", overlay: false, title: "فاکتور آنلاین رایگان", subtitle: "همین الان فاکتور حرفه‌ای بسازید.", btnText: "ساخت فاکتور", btnLink: "/invoice", btnColor: "var(--accent)", icon: "ti-file-invoice" },
            ]).map((b) => (
              <div
                key={b.key}
                style={{ borderRadius: 12, position: "relative", minHeight: 180, display: "flex", alignItems: "center", padding: "2rem", background: b.bg, overflow: "hidden" }}
              >
                {b.overlay && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)" }} />}
                <div style={{ position: "relative" }}>
                  {b.title && <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 6 }}>{b.title}</h3>}
                  {b.subtitle && <p style={{ fontSize: 13, color: "rgba(255,255,255,.8)", marginBottom: "1rem" }}>{b.subtitle}</p>}
                  {b.btnText && b.btnLink && (
                    <Link href={b.btnLink} style={{ background: "#fff", color: b.btnColor, padding: "9px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, display: "inline-block", textDecoration: "none" }}>
                      {b.btnText}
                    </Link>
                  )}
                </div>
                <i className={`ti ${b.icon}`} style={{ position: "absolute", left: "1.5rem", bottom: -10, fontSize: 100, color: "rgba(255,255,255,.1)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── NEWEST PRODUCTS ──────────────────────────────────────────── */}
      {newest.length > 0 && (
        <div style={{ maxWidth: 1280, margin: "1rem auto", padding: "0 1rem" }}>
          <div className="section-card">
            <SectionHeader
              title="جدیدترین محصولات"
              href="/products?sort=newest"
              bar={{ bg: "var(--primary-mid)", icon: "ti-sparkles" }}
            />
            <HScrollSlider gap={12} scrollAmount={190}>
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
                  marjanTime={marjanIds.has(p.id) && flashDeal ? { discountPct: flashDeal.discountPct, endTime: flashDeal.endTime } : undefined}
                />
              ))}
            </HScrollSlider>
          </div>
        </div>
      )}

      {/* ── BRANDS ROW ───────────────────────────────────────────────── */}
      {brands.length > 0 && (
        <div style={{ maxWidth: 1280, margin: "1rem auto", padding: "0 1rem" }}>
          <div className="section-card">
            <SectionHeader title="برندهای معتبر" href="/products" linkLabel="همه برندها" />
            <HScrollSlider gap={24} scrollAmount={240}>
              {brands.map((b) => (
                <BrandCard key={b.id} {...b} />
              ))}
            </HScrollSlider>
          </div>
        </div>
      )}

      {/* ── BLOG PREVIEW ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "1rem auto 2rem", padding: "0 1rem" }}>
        <div className="section-card">
          <SectionHeader title="آخرین مطالب وبلاگ" href="/blog" linkLabel="همه مطالب" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(posts.length === 0
              ? [
                  { id: "1", title: "راهنمای کامل انتخاب شیر توپی مناسب برای لوله‌کشی ساختمانی", cat: "آموزش", slug: "#", imageUrl: null },
                  { id: "2", title: "تفاوت لوله پلیکا و پوش‌فیت — کدام یک برای فاضلاب بهتر است؟", cat: "مقایسه", slug: "#", imageUrl: null },
                  { id: "3", title: "نصب صحیح اتصالات پرسی — اشتباهات رایج و نکات طلایی", cat: "فنی", slug: "#", imageUrl: null },
                ]
              : posts.map((p) => ({
                  id: p.id,
                  title: p.title,
                  cat: p.category?.name ?? "عمومی",
                  slug: p.slug,
                  imageUrl: p.imageUrl,
                }))
            ).map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="hover-card"
                style={{ background: "var(--bg)", borderRadius: "var(--radius)", overflow: "hidden", display: "block", textDecoration: "none" }}
              >
                <div style={{ background: post.imageUrl ? undefined : "var(--bg2)", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {post.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <i className="ti ti-article" style={{ fontSize: 48, color: "var(--border)" }} />
                  )}
                </div>
                <div style={{ padding: "1.25rem" }}>
                  <span style={{ display: "inline-block", background: "var(--accent-light)", color: "var(--accent)", fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, marginBottom: 8 }}>
                    {post.cat}
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", marginBottom: 8, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {post.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--text3)" }}>
                    <span><i className="ti ti-calendar" /> ۱۵ خرداد ۱۴۰۴</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
