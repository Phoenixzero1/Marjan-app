"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  { q: "آیا محصولات شما دارای گارانتی هستند؟", a: "بله، تمامی محصولات ما از برندهای معتبر با گارانتی اصالت تامین می‌شوند. شرایط گارانتی بر اساس کارخانه سازنده متفاوت است." },
  { q: "زمان ارسال سفارش‌ها چقدر است؟", a: "برای سفارش‌های با موجودی کافی، زمان ارسال ۲۴ تا ۷۲ ساعت کاری است. برای تهران امکان تحویل اکسپرس همان روز نیز وجود دارد." },
  { q: "آیا می‌توانم سفارش خود را مرجوع کنم؟", a: "محصولات سالم و بدون استفاده را تا ۷ روز پس از دریافت می‌توانید مرجوع نمایید. جهت درخواست مرجوعی با پشتیبانی تماس بگیرید." },
  { q: "آیا قیمت‌ها شامل مالیات می‌شوند؟", a: "بله، تمامی قیمت‌ها نمایش داده شده در سایت شامل مالیات بر ارزش افزوده ۱۰٪ هستند." },
  { q: "حداقل مبلغ سفارش برای ارسال رایگان چقدر است؟", a: "برای سفارش‌های بالای ۵ میلیون تومان ارسال رایگان است. برای مبالغ کمتر هزینه ارسال بر اساس وزن و مقصد محاسبه می‌شود." },
  { q: "آیا امکان خرید عمده وجود دارد؟", a: "بله، برای پروژه‌های بزرگ و پیمانکاران قیمت ویژه عمده داریم. برای استعلام از فاکتورساز مجریان استفاده کنید یا با ما تماس بگیرید." },
  { q: "چگونه می‌توانم از صحت اصالت محصول اطمینان حاصل کنم؟", a: "تمامی محصولات دارای هولوگرام یا کد رهگیری هستند. در صورت شک به اصالت، با پشتیبانی تماس بگیرید تا کارشناسان ما راهنمایی کنند." },
  { q: "آیا امکان پرداخت اقساطی وجود دارد؟", a: "در حال حاضر پرداخت نقدی از طریق درگاه امن بانکی پذیرفته می‌شود. پرداخت اقساطی برای سفارش‌های بالای ۲۰ میلیون تومان در حال بررسی است." },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(null);

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
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)" }}>پاسخ سوالات رایج مشتریان ما</p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "2rem auto", padding: "0 2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Vazirmatn", textAlign: "right" }}
              >
                <span style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)" }}>{faq.q}</span>
                <i className={`ti ${open === i ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ fontSize: 18, color: "var(--primary)", flexShrink: 0, marginRight: 12 }} />
              </button>
              {open === i && (
                <div style={{ padding: "0 1.5rem 1.25rem", fontSize: 14, color: "var(--text2)", lineHeight: 1.8 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
