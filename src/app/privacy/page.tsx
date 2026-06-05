import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

async function getPage() {
  try { return await prisma.page.findUnique({ where: { slug: "privacy", isActive: true } }); }
  catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  const p = await getPage();
  return { title: (p?.title ?? "حریم خصوصی") + " | مارجان" };
}

export default async function PrivacyPage() {
  const page = await getPage();
  const title = page?.title ?? "حریم خصوصی";
  const content = page?.content ?? `<h3>جمع‌آوری اطلاعات</h3><p>مارجان اطلاعات شخصی شما را فقط برای پردازش سفارش و بهبود خدمات استفاده می‌کند.</p><h3>حفاظت از داده‌ها</h3><p>اطلاعات شما با بالاترین استانداردهای امنیتی ذخیره می‌شود.</p><h3>اشتراک‌گذاری اطلاعات</h3><p>اطلاعات کاربران بدون رضایت آنها به اشخاص ثالث منتقل نمی‌شود.</p>`;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        <div style={{ maxWidth: 860, margin: "auto", padding: ".75rem 0", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          <Link href="/" style={{ color: "var(--primary)" }}>خانه</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <span>{title}</span>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "2rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)", marginBottom: "1.5rem" }}>{title}</h1>
        <div className="prose-content" style={{ lineHeight: 2, color: "var(--text2)" }} dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}
