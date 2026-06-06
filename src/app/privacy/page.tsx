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
  return {
    title: (p?.metaTitle ?? p?.title ?? "حریم خصوصی") + " | مارجان",
    description: p?.metaDesc ?? "سیاست حفظ حریم خصوصی فروشگاه آنلاین مارجان",
  };
}

const sections = [
  {
    icon: "ti-database",
    color: "#e3f2fd",
    iconColor: "#1565c0",
    title: "اطلاعاتی که جمع‌آوری می‌کنیم",
    items: [
      "نام، شماره تماس و آدرس ایمیل هنگام ثبت‌نام",
      "آدرس تحویل سفارش برای ارسال کالا",
      "تاریخچه سفارشات برای بهبود خدمات",
      "اطلاعات مرور مانند صفحات بازدید‌شده (ناشناس)",
    ],
  },
  {
    icon: "ti-lock",
    color: "#e8f5e9",
    iconColor: "#1a7a4a",
    title: "حفاظت از اطلاعات شما",
    items: [
      "رمزنگاری تمام اطلاعات با پروتکل SSL/TLS",
      "ذخیره‌سازی رمز عبور به صورت یک‌طرفه (hashed)",
      "اطلاعات کارت بانکی هرگز ذخیره نمی‌شود",
      "دسترسی محدود کارکنان به اطلاعات حساس",
    ],
  },
  {
    icon: "ti-share",
    color: "#fff3e0",
    iconColor: "#e8920a",
    title: "اشتراک‌گذاری اطلاعات",
    items: [
      "اطلاعات شما بدون رضایت به اشخاص ثالث منتقل نمی‌شود",
      "فقط شرکت‌های حمل‌ونقل برای ارسال سفارش آدرس را دریافت می‌کنند",
      "در صورت الزام قانونی ممکن است اطلاعات به مراجع قضایی ارائه شود",
      "آمار ناشناس برای بهبود خدمات استفاده می‌شود",
    ],
  },
  {
    icon: "ti-cookie",
    color: "#fde8f0",
    iconColor: "#c0392b",
    title: "کوکی‌ها و ردیابی",
    items: [
      "از کوکی برای حفظ وضعیت ورود استفاده می‌شود",
      "سبد خرید با کوکی‌های محلی ذخیره می‌شود",
      "گوگل آنالیتیکس برای آمار بازدید ناشناس استفاده می‌شود",
      "با تنظیمات مرورگر می‌توانید کوکی‌ها را مدیریت کنید",
    ],
  },
  {
    icon: "ti-user-check",
    color: "#f3e5f5",
    iconColor: "#7b1fa2",
    title: "حقوق شما",
    items: [
      "حق دسترسی و دریافت نسخه اطلاعات شخصی‌تان",
      "حق درخواست اصلاح اطلاعات نادرست",
      "حق حذف حساب و اطلاعات شخصی",
      "حق لغو اشتراک از خبرنامه‌های ایمیلی",
    ],
  },
];

export default async function PrivacyPage() {
  const page = await getPage();
  const title = page?.title ?? "حریم خصوصی";
  const hasCustomContent = !!page?.content;

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1280, margin: "auto", padding: ".75rem 2rem", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          <Link href="/" style={{ color: "var(--primary)" }}>خانه</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <span>{title}</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", padding: "2.75rem 2rem" }}>
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
            <div style={{ width: 56, height: 56, background: "rgba(255,255,255,.1)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-shield-lock" style={{ fontSize: 28, color: "var(--accent)" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{title}</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.65)" }}>ما به حفظ اطلاعات شخصی شما متعهدیم</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "3rem auto", padding: "0 2rem" }}>
        {hasCustomContent ? (
          /* CMS custom content */
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "2rem" }}>
            <div className="prose-content" style={{ lineHeight: 2, color: "var(--text2)" }} dangerouslySetInnerHTML={{ __html: page!.content }} />
          </div>
        ) : (
          /* Default structured layout */
          <>
            <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 2, marginBottom: "2.5rem", padding: "1.25rem 1.5rem", background: "var(--bg2)", borderRadius: "var(--radius)", borderRight: "4px solid var(--primary)" }}>
              مارجان متعهد است اطلاعات شخصی کاربران را با بالاترین استانداردهای امنیتی حفظ کند. این سیاست توضیح می‌دهد چه اطلاعاتی جمع‌آوری می‌شود و چگونه استفاده می‌گردد.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "1.25rem" }}>
              {sections.map((s) => (
                <div key={s.title} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
                  {/* Section header */}
                  <div style={{ background: s.color, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, background: "#fff", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className={`ti ${s.icon}`} style={{ fontSize: 20, color: s.iconColor }} />
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 900, color: s.iconColor }}>{s.title}</h3>
                  </div>
                  {/* Items */}
                  <ul style={{ padding: "1.25rem", listStyle: "none" }}>
                    {s.items.map((item) => (
                      <li key={item} style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.8, padding: "4px 0", display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <i className="ti ti-check" style={{ fontSize: 14, color: s.iconColor, flexShrink: 0, marginTop: 3 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "2rem", padding: "1.25rem 1.5rem", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", display: "flex", alignItems: "center", gap: 12 }}>
              <i className="ti ti-mail" style={{ fontSize: 24, color: "var(--accent)", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", marginBottom: 2 }}>سوال درباره حریم خصوصی؟</div>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>از طریق <Link href="/contact" style={{ color: "var(--primary)", fontWeight: 700 }}>فرم تماس با ما</Link> اطلاع دهید.</div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
