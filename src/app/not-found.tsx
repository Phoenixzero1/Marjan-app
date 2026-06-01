import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "صفحه یافت نشد | Marjan",
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: "2rem",
        textAlign: "center",
        fontFamily: "Vazirmatn",
      }}
    >
      <div style={{ position: "relative" }}>
        <span
          style={{
            fontSize: 140,
            fontWeight: 900,
            color: "var(--border)",
            lineHeight: 1,
            display: "block",
            userSelect: "none",
          }}
        >
          ۴۰۴
        </span>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i
            className="ti ti-mood-empty"
            style={{ fontSize: 56, color: "var(--text3)" }}
          />
        </div>
      </div>

      <div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: "var(--text)",
            marginBottom: 10,
          }}
        >
          صفحه‌ای یافت نشد
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text2)",
            lineHeight: 1.9,
            maxWidth: 400,
          }}
        >
          صفحه‌ای که دنبالش هستید وجود ندارد، حذف شده یا آدرس آن تغییر کرده
          است.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            background: "var(--primary)",
            color: "#fff",
            padding: "11px 28px",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="ti ti-home" />
          بازگشت به خانه
        </Link>
        <Link
          href="/products"
          style={{
            background: "transparent",
            color: "var(--primary)",
            border: "1.5px solid var(--primary)",
            padding: "11px 28px",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="ti ti-category" />
          مشاهده محصولات
        </Link>
      </div>
    </div>
  );
}
