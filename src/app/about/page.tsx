import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "درباره ما | مارجان",
  description: "مارجان، معتبرترین فروشگاه آنلاین شیرآلات، لوله، اتصالات و لوازم ساختمانی در ایران. با ما آشنا شوید.",
  openGraph: {
    title: "درباره فروشگاه مارجان",
    description: "بیش از ۱۵ سال تجربه در تأمین لوازم ساختمانی و بهداشتی.",
    locale: "fa_IR",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <>
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1280, margin: "auto", padding: ".75rem 2rem", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          <Link href="/" style={{ color: "var(--primary)" }}>خانه</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <span>درباره ما</span>
        </div>
      </div>
      <div style={{ background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 6 }}>درباره Marjan</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)" }}>بیش از ۱۵ سال تجربه در تامین لوازم ساختمانی و تأسیساتی</p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "2rem auto", padding: "0 2rem" }}>
        {/* Story */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center", marginBottom: "4rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent-light)", color: "var(--accent)", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: "1.25rem" }}>
              <i className="ti ti-history" /> داستان ما
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "var(--primary)", lineHeight: 1.2, marginBottom: "1rem" }}>از یک انبار کوچک تا بزرگ‌ترین فروشگاه آنلاین تأسیساتی</h2>
            <p style={{ color: "var(--text2)", lineHeight: 1.9, marginBottom: "1rem" }}>
              Marjan در سال ۱۳۸۸ با یک انبار کوچک در تهران و تیمی سه‌نفره شروع به کار کرد. هدف ما از ابتدا یک چیز بود: تامین آسان، سریع و مطمئن لوازم ساختمانی برای پیمانکاران، مجریان و مشتریان خانگی.
            </p>
            <p style={{ color: "var(--text2)", lineHeight: 1.9, marginBottom: "1.5rem" }}>
              امروز با بیش از ۱۲,۰۰۰ محصول، ۸۵۰ برند و تیمی ۸۰ نفره، یکی از معتمدترین تامین‌کنندگان در صنعت ساختمان هستیم.
            </p>
            <div style={{ display: "flex", gap: "2rem" }}>
              {[{ val: "+۱۵", label: "سال تجربه" }, { val: "+۸۵۰", label: "برند معتبر" }, { val: "+۵۰هزار", label: "مشتری راضی" }].map((s) => (
                <div key={s.label} style={{ textAlign: "center", background: "var(--bg)", padding: "1.25rem 1.5rem", borderRadius: "var(--radius-sm)" }}>
                  <strong style={{ display: "block", fontSize: 26, fontWeight: 900, color: "var(--primary)" }}>{s.val}</strong>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "var(--bg2)", borderRadius: "var(--radius)", aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <i className="ti ti-building-warehouse" style={{ fontSize: 90, color: "var(--border)" }} />
            <p style={{ fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>انبار مرکزی Marjan — تهران</p>
          </div>
        </div>

        {/* Values */}
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
          <span style={{ display: "block", width: 5, height: 24, background: "var(--accent)", borderRadius: 3 }} />
          ارزش‌های ما
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem", marginBottom: "4rem" }}>
          {[
            { icon: "ti-shield-check", color: "var(--primary)", title: "کیفیت بدون타협", text: "تمام محصولات ما از برندهای تأیید شده تامین می‌شوند و دارای گارانتی اصالت هستند." },
            { icon: "ti-truck-delivery", color: "var(--accent)", title: "تحویل به موقع", text: "ارسال ۲۴ تا ۷۲ ساعته به تمام نقاط کشور یکی از اولویت‌های اصلی ماست." },
            { icon: "ti-headset", color: "#1a7a4a", title: "پشتیبانی فنی تخصصی", text: "تیم کارشناسان فنی ما آماده پاسخگویی به سوالات تخصصی درباره انتخاب، نصب و نگهداری محصولات هستند." },
          ].map((v) => (
            <div key={v.title} style={{ background: "#fff", borderRadius: "var(--radius)", padding: "2rem", boxShadow: "var(--shadow)", borderTop: `4px solid ${v.color}` }}>
              <i className={`ti ${v.icon}`} style={{ fontSize: 36, color: v.color, marginBottom: "1rem", display: "block" }} />
              <strong style={{ display: "block", fontSize: 16, fontWeight: 900, color: "var(--text)", marginBottom: ".5rem" }}>{v.title}</strong>
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.8 }}>{v.text}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
          <span style={{ display: "block", width: 5, height: 24, background: "var(--accent)", borderRadius: 3 }} />
          تیم ما
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem" }}>
          {[
            { name: "امیر محمدی", role: "مدیرعامل", bg: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", bio: "۲۰ سال تجربه در صنعت تأسیسات" },
            { name: "سارا کریمی", role: "مدیر فروش", bg: "linear-gradient(135deg,#1a4a2e,#2d7a4a)", bio: "متخصص در CRM و فروش B2B" },
            { name: "رضا احمدی", role: "مدیر انبار و لجستیک", bg: "linear-gradient(135deg,#7a1a1a,#c0392b)", bio: "۱۲ سال تجربه در زنجیره تامین" },
            { name: "مریم صادقی", role: "مدیر پشتیبانی فنی", bg: "linear-gradient(135deg,#4a3a00,var(--accent))", bio: "مهندس تأسیسات مکانیک" },
          ].map((t) => (
            <div key={t.name} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden", textAlign: "center" }}>
              <div style={{ background: t.bg, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-user-circle" style={{ fontSize: 64, color: "rgba(255,255,255,.3)" }} />
              </div>
              <div style={{ padding: "1.25rem" }}>
                <strong style={{ display: "block", fontSize: 14, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>{t.name}</strong>
                <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>{t.role}</span>
                <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 8, lineHeight: 1.6 }}>{t.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
