"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) setSent(true);
  }

  const inputStyle: React.CSSProperties = { border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, color: "var(--text)", outline: "none", width: "100%" };

  return (
    <>
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1280, margin: "auto", padding: ".75rem 2rem", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          <Link href="/" style={{ color: "var(--primary)" }}>خانه</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <span>تماس با ما</span>
        </div>
      </div>
      <div style={{ background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 6 }}>تماس با ما</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)" }}>در هر ساعتی از روز آماده پاسخگویی هستیم</p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "2rem auto", padding: "0 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
          {/* Form */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "2rem" }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-mail" /> ارسال پیام
            </h3>
            {sent ? (
              <div style={{ background: "#e8f5e9", color: "#1a7a4a", padding: "1.5rem", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                <i className="ti ti-check-circle" style={{ fontSize: 48, display: "block", marginBottom: 12 }} />
                <strong style={{ display: "block", fontSize: 16, fontWeight: 900, marginBottom: 8 }}>پیام شما ارسال شد!</strong>
                <p style={{ fontSize: 13, lineHeight: 1.7 }}>در کمتر از ۲۴ ساعت پاسخ می‌دهیم.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>نام و نام خانوادگی</label><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="نام شما" required /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>شماره تماس</label><input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="۰۹۱۲-XXX-XXXX" /></div>
                </div>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>ایمیل</label><input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>موضوع</label>
                  <select style={{ ...inputStyle, background: "#fff" }} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                    <option value="">انتخاب کنید...</option>
                    <option>سوال فنی درباره محصول</option>
                    <option>استعلام قیمت عمده</option>
                    <option>پیگیری سفارش</option>
                    <option>مرجوعی کالا</option>
                    <option>همکاری و نمایندگی</option>
                    <option>سایر</option>
                  </select>
                </div>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>پیام شما</label><textarea rows={5} style={{ ...inputStyle, resize: "vertical" }} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="پیام خود را اینجا بنویسید..." required /></div>
                <button type="submit" disabled={loading} style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "12px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 900, fontFamily: "Vazirmatn", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
                  <i className="ti ti-send" /> {loading ? "در حال ارسال..." : "ارسال پیام"}
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem" }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1.25rem" }}>اطلاعات تماس</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { icon: "ti-phone", color: "var(--primary)", title: "تلفن تماس", val: "۰۲۱-۴۴۵۵۶۶۷۷" },
                  { icon: "ti-brand-whatsapp", color: "#25d366", title: "واتساپ", val: "۰۹۱۲-۳۴۵-۶۷۸۹" },
                  { icon: "ti-mail", color: "var(--primary)", title: "ایمیل", val: "info@marjan.ir" },
                  { icon: "ti-map-pin", color: "var(--primary)", title: "آدرس", val: "تهران، خیابان ولیعصر، پلاک ۱۲۳" },
                  { icon: "ti-clock", color: "var(--primary)", title: "ساعات کاری", val: "شنبه تا پنجشنبه — ۸ صبح تا ۵ عصر" },
                ].map((c) => (
                  <div key={c.title} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: "var(--bg)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className={`ti ${c.icon}`} style={{ color: c.color, fontSize: 18 }} />
                    </div>
                    <div>
                      <strong style={{ display: "block", fontSize: 13, fontWeight: 900 }}>{c.title}</strong>
                      <span style={{ fontSize: 13, color: "var(--text2)" }}>{c.val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem" }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: "1rem" }}>شبکه‌های اجتماعی</h3>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ icon: "ti-brand-instagram", color: "#e1306c", label: "اینستاگرام" }, { icon: "ti-brand-telegram", color: "#229ed9", label: "تلگرام" }, { icon: "ti-brand-linkedin", color: "#0077b5", label: "لینکدین" }].map((s) => (
                  <a key={s.label} href="#" style={{ flex: 1, background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: 10, textAlign: "center" }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 22, color: s.color, display: "block", marginBottom: 4 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>{s.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
