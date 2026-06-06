import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

async function getPage() {
  try { return await prisma.page.findUnique({ where: { slug: "terms", isActive: true } }); }
  catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  const p = await getPage();
  return {
    title: (p?.metaTitle ?? p?.title ?? "قوانین و مقررات") + " | مارجان",
    description: p?.metaDesc ?? "قوانین و مقررات خرید از فروشگاه آنلاین مارجان",
  };
}

const sections = [
  {
    icon: "ti-shopping-cart",
    color: "#e3f2fd",
    iconColor: "#1565c0",
    title: "قوانین خرید",
    content: "با ثبت سفارش، کاربر قوانین و مقررات فروشگاه مارجان را می‌پذیرد. قیمت‌ها به تومان و شامل مالیات بر ارزش افزوده ۱۰٪ هستند. مارجان حق تغییر قیمت‌ها را بدون اطلاع قبلی برای خود محفوظ می‌دارد، اما سفارش‌های ثبت‌شده با همان قیمت اولیه پردازش می‌شوند.",
  },
  {
    icon: "ti-rotate-clockwise",
    color: "#e8f5e9",
    iconColor: "#1a7a4a",
    title: "شرایط بازگشت کالا",
    content: "مرجوعی کالا تا ۷ روز پس از تحویل، در صورت سالم بودن و داشتن بسته‌بندی اصلی امکان‌پذیر است. محصولات سفارشی و بریده‌شده مرجوع نمی‌شوند. هزینه ارسال مرجوعی بر عهده مشتری است مگر اینکه کالا معیوب یا اشتباه ارسال شده باشد.",
  },
  {
    icon: "ti-truck-delivery",
    color: "#fff3e0",
    iconColor: "#e8920a",
    title: "شرایط ارسال",
    content: "ارسال به تمام نقاط ایران از طریق پست پیشتاز و باربری. زمان ارسال ۲۴ تا ۷۲ ساعت کاری است. برای سفارش‌های بالای ۵ میلیون تومان ارسال رایگان است. مسئولیت آسیب کالا در حین حمل‌ونقل بر عهده شرکت حمل‌ونقل است.",
  },
  {
    icon: "ti-credit-card",
    color: "#fde8f0",
    iconColor: "#c0392b",
    title: "پرداخت و تسویه",
    content: "پرداخت از طریق درگاه‌های بانکی معتبر انجام می‌شود. اطلاعات کارت بانکی شما ذخیره نمی‌شود. در صورت لغو سفارش، مبلغ ظرف ۷۲ ساعت کاری به حساب بانکی شما بازگشت داده می‌شود.",
  },
  {
    icon: "ti-shield-lock",
    color: "#f3e5f5",
    iconColor: "#7b1fa2",
    title: "حریم خصوصی",
    content: "اطلاعات شخصی کاربران نزد مارجان محفوظ می‌ماند و تحت هیچ شرایطی بدون رضایت کاربر به اشخاص ثالث منتقل نمی‌شود. اطلاعات تماس فقط برای پردازش سفارش و اطلاع‌رسانی استفاده می‌شود.",
  },
  {
    icon: "ti-message-circle",
    color: "#e8f5e9",
    iconColor: "#2e7d32",
    title: "ارتباط با پشتیبانی",
    content: "در صورت بروز هرگونه مشکل در خرید، با تیم پشتیبانی از طریق تلفن، ایمیل یا چت آنلاین تماس بگیرید. تیم ما در ساعات کاری (شنبه تا چهارشنبه ۸ تا ۱۷ و پنجشنبه ۸ تا ۱۳) آماده پاسخگویی است.",
  },
];

export default async function TermsPage() {
  const page = await getPage();
  const title = page?.title ?? "قوانین و مقررات";
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
              <i className="ti ti-file-text" style={{ fontSize: 28, color: "var(--accent)" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{title}</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.65)" }}>آخرین بروزرسانی: خرداد ۱۴۰۵</p>
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
              لطفاً قبل از خرید، قوانین و مقررات زیر را به دقت مطالعه فرمایید. استفاده از خدمات مارجان به منزله پذیرش کامل این قوانین است.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {sections.map((s, i) => (
                <div key={s.title} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden", display: "flex" }}>
                  {/* Number strip */}
                  <div style={{ width: 56, background: s.color, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, gap: 6 }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 22, color: s.iconColor }} />
                    <span style={{ fontSize: 11, fontWeight: 900, color: s.iconColor }}>{(i + 1).toLocaleString("fa-IR")}</span>
                  </div>
                  <div style={{ padding: "1.25rem 1.5rem", flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: 8 }}>{s.title}</h3>
                    <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.9 }}>{s.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "2rem", padding: "1.25rem 1.5rem", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", display: "flex", alignItems: "center", gap: 12 }}>
              <i className="ti ti-phone" style={{ fontSize: 24, color: "var(--accent)", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", marginBottom: 2 }}>سوال دارید؟</div>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>با تیم پشتیبانی مارجان تماس بگیرید: <Link href="/contact" style={{ color: "var(--primary)", fontWeight: 700 }}>صفحه تماس با ما</Link></div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
