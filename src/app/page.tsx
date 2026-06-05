import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";

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
      take: 5,
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

async function getFeaturedProducts() {
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

const categories = [
  { name: "شیرآلات",    icon: "ti-circle-dotted", count: "+۳۴۰۰", slug: "valves" },
  { name: "لوله‌ها",    icon: "ti-minus",          count: "+۱۸۰۰", slug: "pipes" },
  { name: "اتصالات",   icon: "ti-git-merge",      count: "+۲۲۰۰", slug: "fittings" },
  { name: "پمپ‌ها",     icon: "ti-activity",       count: "+۵۰۰",  slug: "pumps" },
  { name: "بهداشتی",   icon: "ti-droplet",         count: "+۱۲۰۰", slug: "sanitary" },
  { name: "یراق‌آلات", icon: "ti-tool",            count: "+۸۰۰",  slug: "hardware" },
];

export default async function HomePage() {
  const [products, posts, heroBanners, promoBanners] = await Promise.all([
    getFeaturedProducts(), getLatestPosts(), getHeroBanners(), getPromoBanners(),
  ]);

  return (
    <>
      {/* HERO — DB banners or fallback */}
      {heroBanners.length > 0 ? (
        <section style={{ position: "relative", overflow: "hidden" }}>
          {heroBanners.map((b, i) => (
            <div
              key={b.id}
              style={{
                display: i === 0 ? "block" : "none", // client-side slider can enhance this
                background: b.imageUrl
                  ? `url(${b.imageUrl}) center/cover no-repeat`
                  : "linear-gradient(135deg,var(--primary-dark) 0%,var(--primary-mid) 100%)",
                minHeight: 420,
                position: "relative",
              }}
            >
              {b.imageUrl && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)" }} />}
              <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "5rem 2rem 4rem", color: "#fff" }}>
                {b.title && <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.3, marginBottom: "1rem" }}>{b.title}</h1>}
                {b.subtitle && <p style={{ fontSize: 16, color: "rgba(255,255,255,.8)", maxWidth: 500, marginBottom: "2rem" }}>{b.subtitle}</p>}
                {b.buttonText && b.buttonLink && (
                  <Link href={b.buttonLink} style={{ background: "var(--accent)", color: "#fff", padding: "13px 28px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 8 }}>
                    {b.buttonText}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </section>
      ) : (
      <section
        className="hero-section"
        style={{
          background: "linear-gradient(135deg,var(--primary-dark) 0%,var(--primary-mid) 60%,#1a5fa0 100%)",
          color: "#fff",
          padding: "5rem 2rem 4rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 50%,rgba(232,146,10,.12) 0%,transparent 60%)" }} />
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ maxWidth: 1280, margin: "auto", gap: "3rem", position: "relative" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(232,146,10,.2)", border: "1px solid rgba(232,146,10,.4)", color: "var(--accent)", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: "1.5rem" }}>
              <i className="ti ti-star-filled" /> تامین‌کننده معتمد لوازم ساختمانی
            </div>
            <h1 className="hero-title" style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.2, marginBottom: "1rem" }}>
              کامل‌ترین فروشگاه<br />
              <span style={{ color: "var(--accent)" }}>شیرآلات و لوله</span><br />در ایران
            </h1>
            <p style={{ color: "rgba(255,255,255,.75)", fontSize: 15, maxWidth: 420, marginBottom: "2rem" }}>
              هزاران قطعه اصل از بهترین برندها — تبریز، لگریس، ویر، پیوند — با ضمانت کیفیت و تحویل سریع.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/products" style={{ background: "var(--accent)", color: "#fff", padding: "13px 28px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-shopping-cart" /> مشاهده محصولات
              </Link>
              <Link href="/invoice" style={{ background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,.4)", padding: "11px 24px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-file-invoice" /> فاکتور آنلاین
              </Link>
            </div>
            <div className="hero-stats" style={{ display: "flex", gap: "2rem", marginTop: "2.5rem", flexWrap: "wrap" }}>
              {[{ val: "+۱۲۰۰۰", label: "محصول" }, { val: "+۸۵۰", label: "برند" }, { val: "+۱۵سال", label: "تجربه" }, { val: "۲۴/۷", label: "پشتیبانی" }].map((s) => (
                <div key={s.label}>
                  <strong style={{ display: "block", fontSize: 24, fontWeight: 900, color: "var(--accent)" }}>{s.val}</strong>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center">
            <div style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--radius)", width: "100%", maxWidth: 420, aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
              <i className="ti ti-building-warehouse" style={{ fontSize: 90, color: "rgba(255,255,255,.2)" }} />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", fontWeight: 700 }}>انبار مرکزی Marjan</p>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* TRUST BAR */}
      <div style={{ background: "#fff", boxShadow: "var(--shadow)" }}>
        {/* 2 cols mobile, 4 cols md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ maxWidth: 1280, margin: "auto", padding: "1.25rem 2rem" }}>
          {[
            { icon: "ti-shield-check",   title: "ضمانت اصالت کالا",    sub: "تمام محصولات دارای گارانتی" },
            { icon: "ti-truck-delivery", title: "ارسال سریع سراسری",   sub: "۲۴ تا ۷۲ ساعت کاری" },
            { icon: "ti-refresh",        title: "۷ روز مرجوعی",        sub: "بدون شرط و دردسر" },
            { icon: "ti-headset",        title: "پشتیبانی فنی",         sub: "کارشناسان متخصص آماده‌اند" },
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

      {/* CATEGORIES */}
      <div style={{ maxWidth: 1280, margin: "3rem auto", padding: "0 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "block", width: 5, height: 24, background: "var(--accent)", borderRadius: 3 }} />
            دسته‌بندی محصولات
          </h2>
          <Link href="/products" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            همه دسته‌ها <i className="ti ti-arrow-left" />
          </Link>
        </div>
        {/* 2 cols mobile, 3 cols sm, 6 cols lg */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} style={{ background: "#fff", borderRadius: "var(--radius)", padding: "1.5rem 1rem", textAlign: "center", boxShadow: "var(--shadow)", border: "1.5px solid transparent", transition: "all .25s", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <i className={`ti ${cat.icon}`} style={{ fontSize: 36, color: "var(--primary)", marginBottom: ".75rem", display: "block" }} />
              <strong style={{ display: "block", fontSize: 13, fontWeight: 900, marginBottom: 3 }}>{cat.name}</strong>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>{cat.count} کالا</span>
            </Link>
          ))}
        </div>
      </div>

      {/* FEATURED PRODUCTS */}
      <div style={{ maxWidth: 1280, margin: "3rem auto", padding: "0 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "block", width: 5, height: 24, background: "var(--accent)", borderRadius: 3 }} />
            پرفروش‌ترین محصولات
          </h2>
          <Link href="/products" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            مشاهده همه <i className="ti ti-arrow-left" />
          </Link>
        </div>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
            <i className="ti ti-package" style={{ fontSize: 48, display: "block", marginBottom: 12 }} />
            <p>محصولی برای نمایش وجود ندارد. پس از افزودن محصول توسط ادمین اینجا نمایش داده می‌شود.</p>
          </div>
        ) : (
          /* 1 col mobile, 2 cols sm, 4 cols lg */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                price={p.price}
                comparePrice={p.comparePrice}
                brand={p.brand}
                images={p.images}
                sizes={p.sizes.map((s) => ({ ...s, price: s.price ?? null }))}
                isNew={p.isNew}
                isFeatured={p.isFeatured}
                stockQty={p.stockQty}
              />
            ))}
          </div>
        )}
      </div>

      {/* PROMO BANNERS — DB or fallback */}
      <div style={{ maxWidth: 1280, margin: "3rem auto", padding: "0 2rem" }}>
        {promoBanners.length > 0 ? (
          <div className="grid banner-grid gap-5">
            {promoBanners.map((b) => (
              <div
                key={b.id}
                style={{
                  borderRadius: "var(--radius)",
                  position: "relative",
                  minHeight: 180,
                  display: "flex",
                  alignItems: "center",
                  padding: "2rem",
                  background: b.imageUrl
                    ? `url(${b.imageUrl}) center/cover no-repeat`
                    : "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))",
                  overflow: "hidden",
                }}
              >
                {b.imageUrl && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)", borderRadius: "var(--radius)" }} />}
                <div style={{ position: "relative" }}>
                  {b.title && <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 6 }}>{b.title}</h3>}
                  {b.subtitle && <p style={{ fontSize: 13, color: "rgba(255,255,255,.8)", marginBottom: "1rem" }}>{b.subtitle}</p>}
                  {b.buttonText && b.buttonLink && (
                    <Link href={b.buttonLink} style={{ background: "#fff", color: "var(--primary)", padding: "9px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, display: "inline-block" }}>
                      {b.buttonText}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid banner-grid gap-5">
            <div style={{ borderRadius: "var(--radius)", position: "relative", minHeight: 180, display: "flex", alignItems: "center", padding: "2rem", background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", overflow: "hidden" }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 6 }}>خرید عمده با بهترین قیمت</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginBottom: "1rem" }}>برای پروژه‌های بزرگ و پیمانکاران، قیمت ویژه عمده داریم.</p>
                <Link href="/invoice?type=contractor" style={{ background: "#fff", color: "var(--primary)", padding: "9px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, display: "inline-block" }}>استعلام عمده</Link>
              </div>
              <i className="ti ti-building" style={{ position: "absolute", left: "1.5rem", bottom: -10, fontSize: 100, color: "rgba(255,255,255,.1)" }} />
            </div>
            <div style={{ borderRadius: "var(--radius)", position: "relative", minHeight: 180, display: "flex", alignItems: "center", padding: "2rem", background: "linear-gradient(135deg,#b54a00,var(--accent))", overflow: "hidden" }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 6 }}>فاکتور آنلاین<br />رایگان</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginBottom: "1rem" }}>همین الان فاکتور حرفه‌ای بسازید.</p>
                <Link href="/invoice" style={{ background: "#fff", color: "var(--accent)", padding: "9px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, display: "inline-block" }}>ساخت فاکتور</Link>
              </div>
              <i className="ti ti-file-invoice" style={{ position: "absolute", left: "1.5rem", bottom: -10, fontSize: 100, color: "rgba(255,255,255,.1)" }} />
            </div>
          </div>
        )}
      </div>

      {/* BLOG */}
      <div style={{ maxWidth: 1280, margin: "3rem auto", padding: "0 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "block", width: 5, height: 24, background: "var(--accent)", borderRadius: 3 }} />
            آخرین مطالب وبلاگ
          </h2>
          <Link href="/blog" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            همه مطالب <i className="ti ti-arrow-left" />
          </Link>
        </div>
        {/* 1 col mobile, 2 cols md, 3 cols lg */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(posts.length === 0
            ? [
                { id: "1", title: "راهنمای کامل انتخاب شیر توپی مناسب برای لوله‌کشی ساختمانی", cat: "آموزش", slug: "#" },
                { id: "2", title: "تفاوت لوله پلیکا و پوش‌فیت — کدام یک برای فاضلاب بهتر است؟", cat: "مقایسه", slug: "#" },
                { id: "3", title: "نصب صحیح اتصالات پرسی — اشتباهات رایج و نکات طلایی", cat: "فنی", slug: "#" },
              ]
            : posts.map((p) => ({ id: p.id, title: p.title, cat: p.category?.name ?? "عمومی", slug: p.slug }))
          ).map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden", transition: "all .25s", display: "block" }}>
              <div style={{ background: "var(--bg2)", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-article" style={{ fontSize: 48, color: "var(--border)" }} />
              </div>
              <div style={{ padding: "1.25rem" }}>
                <span style={{ display: "inline-block", background: "var(--accent-light)", color: "var(--accent)", fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, marginBottom: 8 }}>{post.cat}</span>
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", marginBottom: 8, lineHeight: 1.5 }}>{post.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--text3)" }}>
                  <span><i className="ti ti-calendar" /> ۱۵ خرداد ۱۴۰۴</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
