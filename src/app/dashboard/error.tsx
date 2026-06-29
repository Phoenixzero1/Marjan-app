"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
    fetch("/api/admin/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message || "خطای نامشخص در داشبورد",
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
        padding: "3rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        textAlign: "center",
        fontFamily: "Vazirmatn",
      }}
    >
      <i className="ti ti-alert-circle" style={{ fontSize: 48, color: "#c0392b" }} />
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", marginBottom: 6 }}>
          خطا در بارگذاری داشبورد
        </h3>
        <p style={{ fontSize: 13, color: "var(--text2)" }}>
          لطفاً دوباره تلاش کنید.
        </p>
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
