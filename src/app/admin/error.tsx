"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div
      style={{
        padding: "3rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        textAlign: "center",
        fontFamily: "Vazirmatn",
      }}
    >
      <i className="ti ti-shield-off" style={{ fontSize: 48, color: "#c0392b" }} />
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", marginBottom: 6 }}>
          خطا در پنل مدیریت
        </h3>
        <p style={{ fontSize: 13, color: "var(--text2)" }}>
          مشکلی در بارگذاری پنل مدیریت رخ داد. لطفاً دوباره تلاش کنید.
        </p>
        {error.digest && (
          <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4, direction: "ltr" }}>
            {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        style={{
          background: "var(--primary)",
          color: "#fff",
          border: "none",
          padding: "10px 24px",
          borderRadius: "var(--radius-sm)",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "Vazirmatn",
          cursor: "pointer",
        }}
      >
        تلاش مجدد
      </button>
    </div>
  );
}
