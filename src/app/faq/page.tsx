"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FaqItem { id: string; question: string; answer: string; sortOrder: number; }

export default function FaqPage() {
  const [open, setOpen] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faq")
      .then(r => r.json())
      .then(d => setFaqs(d.faqs ?? []))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  // Fallback static FAQs if DB is empty
  const staticFaqs: FaqItem[] = [
    { id: "1", question: "آیا محصولات شما دارای گارانتی هستند؟", answer: "بله، تمامی محصولات ما از برندهای معتبر با گارانتی اصالت تامین می‌شوند. شرایط گارانتی بر اساس کارخانه سازنده متفاوت است.", sortOrder: 0 },
    { id: "2", question: "زمان ارسال سفارش‌ها چقدر است؟", answer: "برای سفارش‌های با موجودی کافی، زمان ارسال ۲۴ تا ۷۲ ساعت کاری است. برای تهران امکان تحویل اکسپرس همان روز نیز وجود دارد.", sortOrder: 1 },
    { id: "3", question: "آیا می‌توانم سفارش خود را مرجوع کنم؟", answer: "محصولات سالم و بدون استفاده را تا ۷ روز پس از دریافت می‌توانید مرجوع نمایید. جهت درخواست مرجوعی با پشتیبانی تماس بگیرید.", sortOrder: 2 },
    { id: "4", question: "آیا قیمت‌ها شامل مالیات می‌شوند؟", answer: "بله، تمامی قیمت‌های نمایش داده شده در سایت شامل مالیات بر ارزش افزوده ۱۰٪ هستند.", sortOrder: 3 },
    { id: "5", question: "حداقل مبلغ سفارش برای ارسال رایگان چقدر است؟", answer: "برای سفارش‌های بالای ۵ میلیون تومان ارسال رایگان است. برای مبالغ کمتر هزینه ارسال بر اساس وزن و مقصد محاسبه می‌شود.", sortOrder: 4 },
    { id: "6", question: "آیا امکان خرید عمده وجود دارد؟", answer: "بله، برای پروژه‌های بزرگ و پیمانکاران قیمت ویژه عمده داریم. برای استعلام از فاکتورساز مجریان استفاده کنید یا با ما تماس بگیرید.", sortOrder: 5 },
  ];

  const items = faqs.length > 0 ? faqs : (loading ? [] : staticFaqs);

  return (
    <>
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1280, margin: "auto", padding: ".75rem 2rem", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          <Link href="/" style={{ color: "var(--primary)" }}>خانه</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <span>سوالات متداول</span>
        </div>
      </div>
      <div style={{ background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 6 }}>سوالات متداول</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)" }}>پاسخ سوالات رایج مشتریان</p>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "3rem auto", padding: "0 2rem", fontFamily: "Vazirmatn" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>در حال بارگذاری...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map(faq => (
              <div key={faq.id} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
                <button
                  onClick={() => setOpen(open === faq.id ? null : faq.id)}
                  style={{ width: "100%", padding: "1rem 1.25rem", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontFamily: "Vazirmatn", textAlign: "right", gap: 12 }}
                >
                  <span style={{ fontSize: 14, fontWeight: 900, color: "var(--text)" }}>{faq.question}</span>
                  <i className={`ti ti-chevron-${open === faq.id ? "up" : "down"}`} style={{ fontSize: 16, color: "var(--primary)", flexShrink: 0 }} />
                </button>
                {open === faq.id && (
                  <div style={{ padding: "0 1.25rem 1rem", fontSize: 13, color: "var(--text2)", lineHeight: 1.9, borderTop: "1px solid var(--border)" }}>
                    <p style={{ marginTop: "1rem" }}>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
