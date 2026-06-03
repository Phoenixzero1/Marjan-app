import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getPost(slug: string) {
  try {
    return await prisma.blogPost.findUnique({
      where: { slug, isPublished: true, deletedAt: null },
      include: {
        category: { select: { name: true, slug: true } },
        comments: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch { return null; }
}

async function getRelated(categoryId: string | null, excludeId: string) {
  if (!categoryId) return [];
  try {
    return await prisma.blogPost.findMany({
      where: { isPublished: true, categoryId, id: { not: excludeId } },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: { id: true, title: true, slug: true, publishedAt: true, imageUrl: true },
    });
  } catch { return []; }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "مطلب یافت نشد | مارجان" };
  return {
    title: post.metaTitle ?? `${post.title} | وبلاگ مارجان`,
    description: post.metaDesc ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.metaDesc ?? post.excerpt ?? undefined,
      images: post.imageUrl ? [post.imageUrl] : [],
      locale: "fa_IR",
      type: "article",
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelated(post.categoryId, post.id);

  // Fire-and-forget view count increment
  prisma.blogPost
    .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const dateStr = post.publishedAt
    ? post.publishedAt.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
    : "";

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
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={{ color: "var(--primary)" }}>خانه</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <Link href="/blog" style={{ color: "var(--primary)" }}>وبلاگ</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <span style={{ color: "var(--text2)" }}>{post.title}</span>
        </div>
      </div>

      {/* Cover image or gradient banner */}
      {post.imageUrl ? (
        <div style={{ width: "100%", maxHeight: 420, overflow: "hidden", background: "var(--bg2)" }}>
          <img
            src={post.imageUrl}
            alt={post.title}
            style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }}
          />
        </div>
      ) : (
        <div
          style={{
            background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))",
            padding: "2.5rem 2rem",
          }}
        >
          <div style={{ maxWidth: 1280, margin: "auto" }}>
            {post.category && (
              <span
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,.15)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 900,
                  padding: "3px 12px",
                  borderRadius: 20,
                  marginBottom: 10,
                }}
              >
                {post.category.name}
              </span>
            )}
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1.5, marginBottom: 10 }}>
              {post.title}
            </h1>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,.65)", flexWrap: "wrap" }}>
              {dateStr && <span><i className="ti ti-calendar" style={{ marginLeft: 4 }} />{dateStr}</span>}
              <span><i className="ti ti-eye" style={{ marginLeft: 4 }} />{post.viewCount} بازدید</span>
              {post.comments.length > 0 && (
                <span><i className="ti ti-message" style={{ marginLeft: 4 }} />{post.comments.length} نظر</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: "2rem auto", padding: "0 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: related.length > 0 ? "1fr 300px" : "1fr", gap: "1.5rem", alignItems: "start" }}>

          {/* Article */}
          <div>
            {/* Title + meta (when cover image is shown) */}
            {post.imageUrl && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow)",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                {post.category && (
                  <span
                    style={{
                      display: "inline-block",
                      background: "var(--accent-light)",
                      color: "var(--accent)",
                      fontSize: 11,
                      fontWeight: 900,
                      padding: "3px 10px",
                      borderRadius: 20,
                      marginBottom: 10,
                    }}
                  >
                    {post.category.name}
                  </span>
                )}
                <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", lineHeight: 1.5, marginBottom: 10 }}>
                  {post.title}
                </h1>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text3)", flexWrap: "wrap" }}>
                  {dateStr && <span><i className="ti ti-calendar" style={{ marginLeft: 4 }} />{dateStr}</span>}
                  <span><i className="ti ti-eye" style={{ marginLeft: 4 }} />{post.viewCount} بازدید</span>
                </div>
              </div>
            )}

            {/* Excerpt */}
            {post.excerpt && (
              <div
                style={{
                  background: "var(--accent-light)",
                  borderRight: "4px solid var(--accent)",
                  borderRadius: "var(--radius-sm)",
                  padding: "1rem 1.25rem",
                  fontSize: 14,
                  color: "var(--text2)",
                  lineHeight: 1.8,
                  marginBottom: "1.5rem",
                  fontWeight: 700,
                }}
              >
                {post.excerpt}
              </div>
            )}

            {/* Content */}
            <div
              style={{
                background: "#fff",
                borderRadius: "var(--radius)",
                boxShadow: "var(--shadow)",
                padding: "2rem",
                marginBottom: "1.5rem",
                lineHeight: 2,
                fontSize: 14,
                color: "var(--text)",
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow)",
                  padding: "1rem 1.5rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text3)" }}>
                  <i className="ti ti-tag" style={{ marginLeft: 4 }} />تگ‌ها:
                </span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: "var(--bg)",
                      border: "1.5px solid var(--border)",
                      color: "var(--text2)",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 12px",
                      borderRadius: 20,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Comments */}
            {post.comments.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow)",
                  padding: "1.5rem",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1rem" }}>
                  <i className="ti ti-message" style={{ marginLeft: 6 }} />
                  نظرات ({post.comments.length})
                </div>
                {post.comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "1rem 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 14,
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        {c.authorName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{c.authorName}</div>
                        <div style={{ fontSize: 11, color: "var(--text3)" }}>
                          {c.createdAt.toLocaleDateString("fa-IR")}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.8, margin: 0 }}>{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Back button */}
            <div style={{ marginTop: "1.5rem" }}>
              <Link
                href="/blog"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  background: "var(--bg)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text2)",
                  textDecoration: "none",
                }}
              >
                <i className="ti ti-arrow-right" />
                بازگشت به وبلاگ
              </Link>
            </div>
          </div>

          {/* Related posts sidebar */}
          {related.length > 0 && (
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
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: "1rem" }}>
                مطالب مرتبط
              </div>
              {related.map((p) => (
                <div key={p.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div
                    style={{
                      width: 56,
                      height: 48,
                      background: p.imageUrl ? "transparent" : "var(--bg2)",
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <i className="ti ti-article" style={{ fontSize: 20, color: "var(--border)" }} />
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/blog/${p.slug}`}
                      style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", lineHeight: 1.4, display: "block", marginBottom: 3 }}
                    >
                      {p.title.length > 50 ? p.title.substring(0, 50) + "..." : p.title}
                    </Link>
                    {p.publishedAt && (
                      <span style={{ fontSize: 11, color: "var(--text3)" }}>
                        {p.publishedAt.toLocaleDateString("fa-IR")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
