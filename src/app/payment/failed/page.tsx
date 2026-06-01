"use client";

import Link from "next/link";

export default function PaymentFailedPage() {
  return (
    <div style={{ maxWidth: 600, margin: "5rem auto", padding: "0 2rem", textAlign: "center" }}>
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "3rem" }}>
        <div style={{ width: 80, height: 80, background: "#fdecea", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <i className="ti ti-x" style={{ fontSize: 40, color: "#c0392b" }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#c0392b", marginBottom: 8 }}>پرداخت ناموفق</h1>
        <p style={{ fontSize: 15, color: "var(--text2)", marginBottom: "1.5rem" }}>متأسفانه پرداخت شما با خطا مواجه شد. مبلغ کسر شده طی ۷۲ ساعت بازگشت داده می‌شود.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/checkout" style={{ background: "#c0392b", color: "#fff", padding: "12px 24px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, display: "inline-block" }}>تلاش مجدد</Link>
          <Link href="/" style={{ background: "var(--bg)", color: "var(--text2)", padding: "12px 24px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, display: "inline-block", border: "1.5px solid var(--border)" }}>بازگشت به خانه</Link>
        </div>
      </div>
    </div>
  );
}
