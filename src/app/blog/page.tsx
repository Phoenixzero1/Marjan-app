import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "وبلاگ | مارجان",
  description: "آخرین مقالات، راهنماها و اخبار دنیای لوله، شیرآلات و تأسیسات ساختمانی در وبلاگ مارجان.",
  openGraph: {
    title: "وبلاگ مارجان — راهنمای تأسیسات ساختمانی",
    locale: "fa_IR",
    type: "website",
  },
};

async function getPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 12,
      include: { category: { select: { name: true } } },
    });
  } catch { return []; }
}

const staticPosts = [
  { id: "1", title: "راهنمای کامل انتخاب شیر توپی مناسب برای لوله‌کشی ساختمانی", cat: "آموزش", date: "۱۵ خرداد ۱۴۰۴", views: "۲,۴۸۰", slug: "#" },
  { id: "2", title: "تفاوت لوله پلیکا و پوش‌فیت — کدام یک برای فاضلاب بهتر است؟", cat: "مقایسه", date: "۸ خرداد ۱۴۰۴", views: "۱,۸۵۰", slug: "#" },
  { id: "3", title: "نصب صحیح اتصالات پرسی — اشتباهات رایج و نکات طلایی", cat: "فنی", date: "۱ خرداد ۱۴۰۴", views: "۳,۱۲۰", slug: "#" },
  { id: "4", title: "آشنایی با برند لگریس — تاریخچه و بهترین محصولات", cat: "معرفی برند", date: "۲۵ اردیبهشت ۱۴۰۴", views: "۱,۲۴۰", slug: "#" },
  { id: "5", title: "چطور نشتی لوله را سریع پیدا و تعمیر کنیم؟", cat: "آموزش", date: "۱۸ اردیبهشت ۱۴۰۴", views: "۴,۵۶۰", slug: "#" },
  { id: "6", title: "فشار کاری استاندارد شیرآلات صنعتی چقدر است؟", cat: "فنی", date: "۱۲ اردیبهشت ۱۴۰۴", views: "۲,۸۸۰", slug: "#" },
];

export default async function BlogPage() {
  const dbPosts = await getPosts();
  const posts = dbPosts.length > 0 ? dbPosts.map((p) => ({ id: p.id, title: p.title, cat: p.category?.name ?? "عمومی", date: p.publishedAt?.toLocaleDateString("fa-IR") ?? "", views: String(p.viewCount), slug: p.slug })) : staticPosts;

  return (
    <>
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1280, margin: "auto", padding: ".75rem 2rem", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          <Link href="/" style={{ color: "var(--primary)" }}>خانه</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <span>وبلاگ</span>
        </div>
      </div>
      <div style={{ background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 6 }}>وبلاگ Marjan</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)" }}>راهنمای فنی، مقایسه محصولات و اخبار صنعت</p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "2rem auto", padding: "0 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" }}>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden", transition: "all .25s", display: "block" }}>
                  <div style={{ background: "var(--bg2)", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-article" style={{ fontSize: 48, color: "var(--border)" }} />
                  </div>
                  <div style={{ padding: "1.25rem" }}>
                    <span style={{ display: "inline-block", background: "var(--accent-light)", color: "var(--accent)", fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, marginBottom: 8 }}>{post.cat}</span>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", marginBottom: 8, lineHeight: 1.5 }}>{post.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--text3)" }}>
                      <span><i className="ti ti-calendar" /> {post.date}</span>
                      <span><i className="ti ti-eye" /> {post.views}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", position: "sticky", top: 140 }}>
            <div style={{ display: "flex", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden", marginBottom: "1.25rem" }}>
              <input style={{ flex: 1, border: "none", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none" }} placeholder="جستجو..." />
              <button style={{ background: "var(--primary)", border: "none", color: "#fff", padding: "0 14px", fontSize: 16 }}><i className="ti ti-search" /></button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: ".75rem" }}>دسته‌ها</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1.25rem" }}>
              {["آموزش", "مقایسه", "فنی", "معرفی برند", "اخبار", "نصب"].map((tag) => (
                <span key={tag} style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text2)", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, cursor: "pointer" }}>{tag}</span>
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: ".75rem" }}>مطالب محبوب</div>
            {posts.slice(0, 3).map((post) => (
              <div key={post.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 56, height: 48, background: "var(--bg2)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-article" style={{ fontSize: 20, color: "var(--border)" }} />
                </div>
                <div>
                  <Link href={`/blog/${post.slug}`} style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", lineHeight: 1.4, display: "block", marginBottom: 3 }}>
                    {post.title.substring(0, 40)}...
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
