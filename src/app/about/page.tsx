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

const stats = [
  { icon: "ti-building", value: "۶+", label: "سال تجربه" },
  { icon: "ti-package", value: "۱۲٬۰۰۰+", label: "نوع محصول" },
  { icon: "ti-users", value: "۲۵٬۰۰۰+", label: "مشتری راضی" },
  { icon: "ti-map-pin", value: "۳۱", label: "استان کشور" },
];

const values = [
  {
    icon: "ti-shield-check",
    color: "#e3f2fd",
    iconColor: "#1565c0",
    title: "اصالت کالا",
    desc: "تمام محصولات با گارانتی اصالت و مستقیم از نمایندگی رسمی برندهای معتبر داخلی و خارجی تامین می‌شوند.",
  },
  {
    icon: "ti-truck-delivery",
    color: "#e8f5e9",
    iconColor: "#1a7a4a",
    title: "ارسال سریع",
    desc: "ارسال به تمام نقاط ایران در کمترین زمان ممکن با بسته‌بندی استاندارد، ایمن و مقاوم.",
  },
  {
    icon: "ti-headset",
    color: "#fff3e0",
    iconColor: "#e8920a",
    title: "پشتیبانی تخصصی",
    desc: "تیم مهندسین و متخصصان فنی ما آماده مشاوره و پاسخگویی به تمام سوالات شما در ساعات کاری هستند.",
  },
  {
    icon: "ti-cash",
    color: "#fde8f0",
    iconColor: "#c0392b",
    title: "قیمت رقابتی",
    desc: "با حذف واسطه‌ها و خرید مستقیم از کارخانه، بهترین قیمت‌ها را به مشتریان خود ارائه می‌دهیم.",
  },
  {
    icon: "ti-rotate-clockwise",
    color: "#f3e5f5",
    iconColor: "#7b1fa2",
    title: "بازگشت آسان",
    desc: "امکان مرجوعی و تعویض کالا تا ۷ روز پس از دریافت، بدون هیچ سوال و پیچیدگی.",
  },
  {
    icon: "ti-certificate",
    color: "#e8f5e9",
    iconColor: "#2e7d32",
    title: "استانداردهای کیفی",
    desc: "تمام محصولات پیش از عرضه، بازرسی کیفی دقیق شده و با استانداردهای ملی و بین‌المللی مطابقت دارند.",
  },
];

const defaultStory = `مارجان در سال ۱۳۹۸ با هدف ایجاد بزرگ‌ترین پلتفرم آنلاین تخصصی تأسیسات ساختمانی در ایران تأسیس شد. ما با درک عمیق از نیازهای مهندسان، پیمانکاران و مصرف‌کنندگان نهایی، تجربه‌ای متفاوت از خرید آنلاین لوله، شیرآلات، اتصالات و تجهیزات ساختمانی ارائه می‌دهیم.

تیم ما متشکل از مهندسان تأسیسات، متخصصان فناوری اطلاعات و کارشناسان فروش با تجربه است که شبانه‌روز تلاش می‌کنند تا بهترین تجربه خرید را برای شما فراهم کنند. از انتخاب محصول تا تحویل در درب منزل، در هر مرحله همراه شما هستیم.`;

export default async function AboutPage() {
  const page = await getPage();
  const title = page?.title ?? "درباره مارجان";
  const story = page?.content ?? defaultStory;

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
      <div style={{ background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", padding: "3rem 2rem" }}>
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 10 }}>{title}</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.7)", maxWidth: 600 }}>
            پیشرو در ارائه تجهیزات تأسیسات ساختمانی با بیش از ۶ سال تجربه و اعتماد هزاران مشتری سراسر کشور
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: "var(--primary)", padding: "0" }}>
        <div style={{ maxWidth: 1280, margin: "auto", padding: "0 2rem", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {stats.map((s) => (
            <div key={s.label} style={{ padding: "1.75rem 1rem", textAlign: "center", borderLeft: "1px solid rgba(255,255,255,.15)" }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 28, color: "var(--accent)", display: "block", marginBottom: 8 }} />
              <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)", marginTop: 4, fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Story */}
      <div style={{ maxWidth: 900, margin: "3.5rem auto", padding: "0 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
          <div style={{ width: 4, height: 28, background: "var(--accent)", borderRadius: 4 }} />
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)" }}>داستان ما</h2>
        </div>
        {page?.content ? (
          <div
            className="prose-content"
            style={{ fontSize: 15, lineHeight: 2, color: "var(--text2)" }}
            dangerouslySetInnerHTML={{ __html: story }}
          />
        ) : (
          <div style={{ fontSize: 15, lineHeight: 2, color: "var(--text2)" }}>
            {story.split("\n\n").map((para, i) => (
              <p key={i} style={{ marginBottom: "1rem" }}>{para}</p>
            ))}
          </div>
        )}
      </div>

      {/* Values */}
      <div style={{ background: "var(--bg2)", padding: "3.5rem 2rem" }}>
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--primary)", marginBottom: 8 }}>ارزش‌های ما</h2>
            <p style={{ fontSize: 14, color: "var(--text3)", maxWidth: 500, margin: "auto" }}>چرا هزاران مشتری به مارجان اعتماد می‌کنند</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {values.map((v) => (
              <div key={v.title} style={{ background: "#fff", borderRadius: "var(--radius)", padding: "1.75rem", boxShadow: "var(--shadow)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 52, height: 52, background: v.color, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`ti ${v.icon}`} style={{ fontSize: 24, color: v.iconColor }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>{v.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.9 }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: "linear-gradient(135deg,var(--primary-dark),var(--primary))", padding: "3rem 2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 12 }}>آماده خرید هستید؟</h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,.7)", marginBottom: "1.5rem" }}>بیش از ۱۲٬۰۰۰ محصول تأسیساتی با قیمت رقابتی در انتظار شماست</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/products" style={{ background: "var(--accent)", color: "#fff", padding: "12px 28px", borderRadius: "var(--radius-sm)", fontWeight: 900, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-shopping-bag" /> مشاهده محصولات
          </Link>
          <Link href="/contact" style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", padding: "12px 28px", borderRadius: "var(--radius-sm)", fontWeight: 900, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-phone" /> تماس با ما
          </Link>
        </div>
      </div>
    </>
  );
}
