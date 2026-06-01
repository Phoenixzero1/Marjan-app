"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function PaymentSuccessContent() {
  const sp = useSearchParams();
  const refId = sp.get("refId");
  const orderId = sp.get("orderId");

  return (
    <div style={{ maxWidth: 600, margin: "5rem auto", padding: "0 2rem", textAlign: "center" }}>
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "3rem" }}>
        <div style={{ width: 80, height: 80, background: "#e8f5e9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <i className="ti ti-check" style={{ fontSize: 40, color: "#1a7a4a" }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1a7a4a", marginBottom: 8 }}>پرداخت موفق!</h1>
        <p style={{ fontSize: 15, color: "var(--text2)", marginBottom: "1.5rem" }}>سفارش شما با موفقیت ثبت شد.</p>
        {refId && <div style={{ background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: "1.5rem", fontSize: 13, fontWeight: 700, color: "var(--text2)" }}>کد رهگیری: <strong style={{ color: "var(--primary)" }}>{refId}</strong></div>}
        {orderId && <div style={{ background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: "1.5rem", fontSize: 13, fontWeight: 700, color: "var(--text2)" }}>شماره سفارش: <strong style={{ color: "var(--primary)" }}>{orderId}</strong></div>}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/dashboard" style={{ background: "var(--primary)", color: "#fff", padding: "12px 24px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, display: "inline-block" }}>مشاهده سفارش</Link>
          <Link href="/" style={{ background: "var(--bg)", color: "var(--text2)", padding: "12px 24px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, display: "inline-block", border: "1.5px solid var(--border)" }}>بازگشت به خانه</Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
