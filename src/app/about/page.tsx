import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

async function getPage() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: "about" } });
    return page?.isActive ? page : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage();
  return {
    title: page?.metaTitle ?? "درباره ما | مارجان",
    description: page?.metaDesc ?? "مارجان، معتبرترین فروشگاه آنلاین شیرآلات، لوله، اتصالات و لوازم ساختمانی در ایران.",
  };
}

export default async function AboutPage() {
  const page = await getPage();

  return (
    <>
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1280, margin: "auto", padding: ".75rem 2rem", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          <Link href="/" style={{ color: "var(--primary)" }}>خانه</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <span>{page?.title ?? "درباره ما"}</span>
        </div>
      </div>
      <div style={{ background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 6 }}>{page?.title ?? "درباره مارجان"}</h1>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "3rem auto", padding: "0 2rem" }}>
        {page ? (
          <div
            className="cms-content"
            style={{ fontSize: 14, lineHeight: 2, color: "var(--text2)" }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        ) : (
          <div style={{ fontSize: 14, lineHeight: 2, color: "var(--text2)" }}>
            <p>محتوای این صفحه در پنل مدیریت تنظیم نشده است.</p>
          </div>
        )}
      </div>
    </>
  );
}
