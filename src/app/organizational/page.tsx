"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  "شیرآلات صنعتی", "لوله و اتصالات", "پمپ و تجهیزات", "بهداشتی و دکوراتیو",
  "یراق‌آلات", "برقی و روشنایی", "سایر",
];

const AMOUNT_RANGES = [
  "کمتر از ۵۰ میلیون تومان", "۵۰ تا ۲۰۰ میلیون تومان",
  "۲۰۰ تا ۵۰۰ میلیون تومان", "بیش از ۵۰۰ میلیون تومان",
];

interface FormData {
  companyName: string; contactName: string; phone: string; email: string;
  nationalCode: string; category: string; estimatedAmount: string; description: string;
}

const EMPTY: FormData = {
  companyName: "", contactName: "", phone: "", email: "",
  nationalCode: "", category: "", estimatedAmount: "", description: "",
};

const BENEFITS = [
  { icon: "ti-percentage", title: "قیمت ویژه عمده", desc: "تخفیفات خاص برای خریدهای سازمانی و پروژه‌ای" },
  { icon: "ti-file-invoice", title: "فاکتور رسمی", desc: "صدور فاکتور رسمی با مهر شرکت برای همه خریدها" },
  { icon: "ti-truck-delivery", title: "ارسال اختصاصی", desc: "برنامه‌ریزی ارسال بر اساس نیاز پروژه شما" },
  { icon: "ti-headset", title: "پشتیبانی اختصاصی", desc: "کارشناس فروش اختصاصی برای هر مشتری سازمانی" },
  { icon: "ti-receipt", title: "اعتبار خرید", desc: "امکان خرید اعتباری برای مشتریان تأیید شده" },
  { icon: "ti-tools", title: "مشاوره فنی", desc: "مشاوره فنی رایگان توسط متخصصان مرجان" },
];

export default function OrganizationalPage() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  function validate(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.companyName.trim()) errs.companyName = "نام شرکت الزامی است";
    if (!form.contactName.trim()) errs.contactName = "نام مسئول الزامی است";
    if (!/^09\d{9}$/.test(form.phone)) errs.phone = "شماره موبایل معتبر وارد کنید";
    if (form.email && !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) errs.email = "ایمیل معتبر نیست";
    if (form.description.trim().length < 10) errs.description = "توضیحات حداقل ۱۰ کاراکتر باشد";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/org-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) {
        setSuccess(true);
        setForm(EMPTY);
      } else {
        setApiError(d.error ?? "خطا در ارسال درخواست");
      }
    } catch {
      setApiError("خطا در ارتباط با سرور");
    }
    setLoading(false);
  }

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1.5px solid var(--border)",
    fontSize: 13,
    fontFamily: "Vazirmatn",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <>
      {/* ── Hero ── */}
      <section
        style={{
          background: "linear-gradient(135deg, var(--primary-dark) 0%, #1a3d7c 100%)",
          padding: "5rem 2rem 4rem",
          position: "relative",
          overflow: "hidden",
          color: "#fff",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 20% 60%, rgba(232,146,10,.15) 0%, transparent 55%)",
          }}
        />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(232,146,10,.18)",
              border: "1px solid rgba(232,146,10,.35)",
              color: "var(--accent)",
              padding: "6px 18px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: "1.5rem",
            }}
          >
            <i className="ti ti-building-skyscraper" />
            ویژه سازمان‌ها و پیمانکاران
          </div>
          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 48px)",
              fontWeight: 900,
              lineHeight: 1.25,
              marginBottom: "1.25rem",
            }}
          >
            خرید سازمانی<br />
            <span style={{ color: "var(--accent)" }}>مرجان</span>
          </h1>
          <p
            style={{
              fontSize: "clamp(13px, 1.5vw, 16px)",
              color: "rgba(255,255,255,.75)",
              maxWidth: 580,
              margin: "0 auto 2rem",
              lineHeight: 1.8,
            }}
          >
            برای پروژه‌های ساختمانی، شرکت‌های پیمانکاری، و سازمان‌ها — قیمت ویژه عمده،
            فاکتور رسمی، ارسال اختصاصی و پشتیبانی ۲۴ ساعته.
          </p>
          <a
            href="#request-form"
            style={{
              background: "var(--accent)",
              color: "#fff",
              padding: "14px 32px",
              borderRadius: "var(--radius-sm)",
              fontSize: 15,
              fontWeight: 900,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(232,146,10,.5)",
            }}
          >
            <i className="ti ti-send" /> ثبت درخواست همکاری
          </a>
        </div>
      </section>

      {/* ── Benefits ── */}
      <div style={{ background: "#fff", padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 900,
              textAlign: "center",
              marginBottom: "2.5rem",
              color: "var(--primary)",
            }}
          >
            مزایای خرید سازمانی
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                style={{
                  padding: "1.5rem",
                  borderRadius: "var(--radius)",
                  border: "1.5px solid var(--border)",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "var(--accent-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <i className={`ti ${b.icon}`} style={{ fontSize: 22, color: "var(--accent)" }} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 14, fontWeight: 900, marginBottom: 6 }}>
                    {b.title}
                  </strong>
                  <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Request Form ── */}
      <div
        id="request-form"
        style={{ background: "var(--bg)", padding: "4rem 2rem" }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)", marginBottom: 8 }}>
              ثبت درخواست همکاری سازمانی
            </h2>
            <p style={{ fontSize: 13, color: "var(--text2)" }}>
              فرم زیر را تکمیل کنید. کارشناسان ما ظرف ۲۴ ساعت با شما تماس می‌گیرند.
            </p>
          </div>

          {success ? (
            <div
              style={{
                background: "#f0fdf4",
                border: "2px solid #86efac",
                borderRadius: "var(--radius)",
                padding: "3rem 2rem",
                textAlign: "center",
              }}
            >
              <i
                className="ti ti-circle-check"
                style={{ fontSize: 56, color: "#16a34a", display: "block", marginBottom: 16 }}
              />
              <h3 style={{ fontSize: 20, fontWeight: 900, color: "#15803d", marginBottom: 10 }}>
                درخواست شما با موفقیت ثبت شد
              </h3>
              <p style={{ fontSize: 14, color: "#166534", marginBottom: 24 }}>
                کارشناسان مرجان ظرف ۲۴ ساعت کاری با شما تماس خواهند گرفت.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => setSuccess(false)}
                  style={{
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    padding: "10px 24px",
                    borderRadius: 8,
                    fontFamily: "Vazirmatn",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ثبت درخواست جدید
                </button>
                <Link
                  href="/"
                  style={{
                    background: "transparent",
                    border: "1.5px solid #16a34a",
                    color: "#16a34a",
                    padding: "10px 24px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  بازگشت به صفحه اصلی
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={submit}
              style={{
                background: "#fff",
                borderRadius: "var(--radius)",
                boxShadow: "var(--shadow)",
                padding: "2.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {apiError && (
                <div
                  style={{
                    background: "#fdecea",
                    border: "1px solid #f5c6c6",
                    color: "#c0392b",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {apiError}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Company name */}
                <Field label="نام شرکت / سازمان *" error={errors.companyName}>
                  <input style={inp} value={form.companyName} onChange={set("companyName")} placeholder="شرکت عمران پایدار" />
                </Field>

                {/* Contact name */}
                <Field label="نام مسئول خرید *" error={errors.contactName}>
                  <input style={inp} value={form.contactName} onChange={set("contactName")} placeholder="علی محمدی" />
                </Field>

                {/* Phone */}
                <Field label="شماره موبایل *" error={errors.phone}>
                  <input style={{ ...inp, direction: "ltr" }} value={form.phone} onChange={set("phone")} placeholder="09121234567" />
                </Field>

                {/* Email */}
                <Field label="ایمیل" error={errors.email}>
                  <input style={{ ...inp, direction: "ltr" }} value={form.email} onChange={set("email")} placeholder="info@company.com" type="email" />
                </Field>

                {/* National code */}
                <Field label="کد ملی / ثبتی شرکت" error={errors.nationalCode}>
                  <input style={{ ...inp, direction: "ltr" }} value={form.nationalCode} onChange={set("nationalCode")} placeholder="10861234567" />
                </Field>

                {/* Estimated amount */}
                <Field label="مبلغ تخمینی خرید">
                  <select style={inp} value={form.estimatedAmount} onChange={set("estimatedAmount")}>
                    <option value="">انتخاب کنید</option>
                    {AMOUNT_RANGES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </Field>
              </div>

              {/* Category */}
              <Field label="حوزه محصول مورد نیاز">
                <select style={inp} value={form.category} onChange={set("category")}>
                  <option value="">انتخاب کنید</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              {/* Description */}
              <Field label="توضیحات درخواست *" error={errors.description}>
                <textarea
                  style={{ ...inp, minHeight: 110, resize: "vertical" }}
                  value={form.description}
                  onChange={set("description")}
                  placeholder="محصولات مورد نیاز، مقدار تقریبی، شرایط خاص و هر چیزی که فکر می‌کنید باید بدانیم..."
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  padding: "14px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 900,
                  fontFamily: "Vazirmatn",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <i className={`ti ${loading ? "ti-loader-2" : "ti-send"}`} />
                {loading ? "در حال ارسال..." : "ثبت درخواست همکاری"}
              </button>

              <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
                اطلاعات شما محرمانه بوده و فقط برای ارتباط با تیم فروش مرجان استفاده می‌شود.
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: "#c0392b", marginTop: 4 }}>{error}</p>}
    </div>
  );
}
