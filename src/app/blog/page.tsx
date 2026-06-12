import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marjan.ir";

export const metadata: Metadata = {
  title: "وبلاگ | مارجان",
  description: "آخرین مقالات، راهنماها و اخبار دنیای لوله، شیرآلات و تأسیسات ساختمانی در وبلاگ مارجان.",
  alternates: { canonical: `${BASE}/blog` },
  openGraph: {
    title: "وبلاگ مارجان — راهنمای تأسیسات ساختمانی",
    url: `${BASE}/blog`,
    siteName: "مارجان",
    locale: "fa_IR",
    type: "website",
  },
};

async function getData(q?: string, category?: string) {
  try {
    const where: Record<string, unknown> = { isPublished: true, deletedAt: null };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.category = { slug: category };
    }

    const [posts, categories] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: 12,
        include: { category: { select: { name: true, slug: true } } },
      }),
      prisma.blogCategory.findMany({ orderBy: { name: "asc" } }),
    ]);
    return { posts, categories };
  } catch {
    return { posts: [], categories: [] };
  }
}

const staticPosts = [
  { id: "1", title: "راهنمای کامل انتخاب شیر توپی مناسب برای لوله‌کشی ساختمانی", cat: "آموزش", date: "۱۵ خرداد ۱۴۰۴", views: "۲,۴۸۰", slug: "#", imageUrl: null },
  { id: "2", title: "تفاوت لوله پلیکا و پوش‌فیت — کدام یک برای فاضلاب بهتر است؟", cat: "مقایسه", date: "۸ خرداد ۱۴۰۴", views: "۱,۸۵۰", slug: "#", imageUrl: null },
  { id: "3", title: "نصب صحیح اتصالات پرسی — اشتباهات رایج و نکات طلایی", cat: "فنی", date: "۱ خرداد ۱۴۰۴", views: "۳,۱۲۰", slug: "#", imageUrl: null },
  { id: "4", title: "آشنایی با برند لگریس — تاریخچه و بهترین محصولات", cat: "معرفی برند", date: "۲۵ اردیبهشت ۱۴۰۴", views: "۱,۲۴۰", slug: "#", imageUrl: null },
  { id: "5", title: "چطور نشتی لوله را سریع پیدا و تعمیر کنیم؟", cat: "آموزش", date: "۱۸ اردیبهشت ۱۴۰۴", views: "۴,۵۶۰", slug: "#", imageUrl: null },
  { id: "6", title: "فشار کاری استاندارد شیرآلات صنعتی چقدر است؟", cat: "فنی", date: "۱۲ اردیبهشت ۱۴۰۴", views: "۲,۸۸۰", slug: "#", imageUrl: null },
];

const staticCategories = ["آموزش", "مقایسه", "فنی", "معرفی برند", "اخبار", "نصب"];

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const sp = searchParams;
  const q = typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined;
  const category = typeof sp.category === "string" && sp.category.trim() ? sp.category.trim() : undefined;

  const { posts: dbPosts, categories: dbCategories } = await getData(q, category);

  const posts =
    dbPosts.length > 0
      ? dbPosts.map((p) => ({
          id: p.id,
          title: p.title,
          cat: p.category?.name ?? "عمومی",
          date: p.publishedAt?.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }) ?? "",
          views: String(p.viewCount),
          slug: p.slug,
          imageUrl: p.imageUrl ?? null,
        }))
      : staticPosts;

  const hasDbCategories = dbCategories.length > 0;

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "auto",
            padding: ".75rem 2rem",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--text3)",
            fontWeight: 700,
          }}
        >
          <Link href="/" style={{ color: "var(--primary)" }}>خانه</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <span>وبلاگ</span>
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))",
          padding: "2.5rem 2rem",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 6 }}>وبلاگ Marjan</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)" }}>
            راهنمای فنی، مقایسه محصولات و اخبار صنعت
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "2rem auto", padding: "0 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" }}>

          {/* Posts grid */}
          <div>
            {/* Active filter indicator */}
            {(q || category) && (
              <div
                style={{
                  background: "var(--accent-light)",
                  border: "1px solid var(--accent)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 14px",
                  marginBottom: "1rem",
                  fontSize: 13,
                  color: "var(--text2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <i className="ti ti-filter" style={{ color: "var(--accent)" }} />
                {q && <span>جستجو: <strong>{q}</strong></span>}
                {category && <span>دسته: <strong>{category}</strong></span>}
                <Link
                  href="/blog"
                  style={{ marginRight: "auto", fontSize: 11, color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}
                >
                  پاک کردن فیلتر ×
                </Link>
              </div>
            )}

            {posts.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow)",
                  padding: "3rem",
                  textAlign: "center",
                  color: "var(--text3)",
                }}
              >
                <i className="ti ti-article-off" style={{ fontSize: 48, display: "block", marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 700 }}>مطلبی یافت نشد</div>
                <Link href="/blog" className="sec-link" style={{ marginTop: 8 }}>
                  مشاهده همه مطالب <i className="ti ti-arrow-left" />
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="hover-card"
                    style={{
                      background: "#fff",
                      borderRadius: "var(--radius)",
                      boxShadow: "var(--shadow)",
                      overflow: "hidden",
                      display: "block",
                      textDecoration: "none",
                    }}
                  >
                    {/* Cover image */}
                    <div
                      style={{
                        background: "var(--bg2)",
                        aspectRatio: "16/9",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <i className="ti ti-article" style={{ fontSize: 48, color: "var(--border)" }} />
                      )}
                    </div>

                    <div style={{ padding: "1.25rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          background: "var(--accent-light)",
                          color: "var(--accent)",
                          fontSize: 11,
                          fontWeight: 900,
                          padding: "3px 10px",
                          borderRadius: 20,
                          marginBottom: 8,
                        }}
                      >
                        {post.cat}
                      </span>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 900,
                          color: "var(--text)",
                          marginBottom: 8,
                          lineHeight: 1.5,
                        }}
                      >
                        {post.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: "var(--text3)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <i className="ti ti-calendar" />{post.date}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <i className="ti ti-eye" />{post.views} بازدید
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside
            style={{
              background: "#fff",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow)",
              padding: "1.5rem",
              position: "sticky",
              top: 140,
            }}
          >
            {/* Search form */}
            <form action="/blog" method="GET" style={{ display: "flex", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden", marginBottom: "1.25rem" }}>
              <input
                name="q"
                defaultValue={q ?? ""}
                style={{
                  flex: 1,
                  border: "none",
                  padding: "9px 12px",
                  fontFamily: "Vazirmatn",
                  fontSize: 13,
                  outline: "none",
                  background: "transparent",
                }}
                placeholder="جستجو..."
              />
              <button
                type="submit"
                style={{ background: "var(--primary)", border: "none", color: "#fff", padding: "0 14px", fontSize: 16, cursor: "pointer" }}
              >
                <i className="ti ti-search" />
              </button>
            </form>

            {/* Categories */}
            <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: ".75rem" }}>
              دسته‌ها
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1.25rem" }}>
              {hasDbCategories
                ? dbCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={category === cat.slug ? "/blog" : `/blog?category=${cat.slug}`}
                      style={{
                        background: category === cat.slug ? "var(--primary)" : "var(--bg)",
                        border: "1.5px solid var(--border)",
                        color: category === cat.slug ? "#fff" : "var(--text2)",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 12px",
                        borderRadius: 20,
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                    >
                      {cat.name}
                    </Link>
                  ))
                : staticCategories.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: "var(--bg)",
                        border: "1.5px solid var(--border)",
                        color: "var(--text2)",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 12px",
                        borderRadius: 20,
                        cursor: "pointer",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
            </div>

            {/* Popular posts */}
            <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: ".75rem" }}>
              مطالب محبوب
            </div>
            {posts.slice(0, 3).map((post) => (
              <div
                key={post.id}
                style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}
              >
                <div
                  style={{
                    width: 56,
                    height: 48,
                    background: "var(--bg2)",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <i className="ti ti-article" style={{ fontSize: 20, color: "var(--border)" }} />
                  )}
                </div>
                <div>
                  <Link
                    href={`/blog/${post.slug}`}
                    style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", lineHeight: 1.4, display: "block", marginBottom: 3, textDecoration: "none" }}
                  >
                    {post.title.length > 40 ? post.title.substring(0, 40) + "..." : post.title}
                  </Link>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{post.date}</span>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </>
  );
}
