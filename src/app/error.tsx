"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
    fetch("/api/admin/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message || "خطای نامشخص",
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        level: "ERROR",
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "2rem",
        textAlign: "center",
        fontFamily: "Vazirmatn",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "#fdecea",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className="ti ti-alert-triangle" style={{ fontSize: 36, color: "#c0392b" }} />
      </div>

      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>
          خطایی رخ داد
        </h2>
        <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.8 }}>
          متأسفانه مشکلی پیش آمد. لطفاً دوباره تلاش کنید.
        </p>
        {error.digest && (
          <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 6, direction: "ltr" }}>
            کد خطا: {error.digest}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            padding: "10px 24px",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "Vazirmatn",
            cursor: "pointer",
          }}
        >
          تلاش مجدد
        </button>
        <Link
          href="/"
          style={{
            background: "transparent",
            color: "var(--primary)",
            border: "1.5px solid var(--primary)",
            padding: "10px 24px",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          بازگشت به خانه
        </Link>
      </div>
    </div>
  );
}
