import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "در حال به‌روزرسانی | مارجان",
  robots: { index: false, follow: false },
};

async function getMaintenanceSettings() {
  try {
    const rows = await prisma.siteSettings.findMany({
      where: { key: { in: ["maintenance_message", "maintenance_estimated", "site_name", "site_phone"] } },
      select: { key: true, value: true },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

export default async function MaintenancePage() {
  const s = await getMaintenanceSettings();
  const message = s.maintenance_message ?? "در حال به‌روزرسانی هستیم. به زودی برمی‌گردیم.";
  const estimated = s.maintenance_estimated ?? "";
  const siteName = s.site_name ?? "Marjan";
  const phone = s.site_phone ?? "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f2040 0%, #1a3a6e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Vazirmatn, sans-serif",
        direction: "rtl",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,.05)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,.12)",
          padding: "3rem 4rem",
          maxWidth: 560,
          width: "100%",
          textAlign: "center",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            background: "rgba(255,193,7,.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}
        >
          <span style={{ fontSize: 40 }}>🔧</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#fff",
            margin: "0 0 .75rem",
          }}
        >
          {siteName}
          <span style={{ color: "#ffc107" }}>.</span>
        </h1>

        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "rgba(255,255,255,.85)",
            margin: "0 0 1.25rem",
          }}
        >
          سایت در حال به‌روزرسانی است
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: 14,
            lineHeight: 2,
            color: "rgba(255,255,255,.65)",
            margin: "0 0 1.5rem",
          }}
        >
          {message}
        </p>

        {/* Estimated time */}
        {estimated && (
          <div
            style={{
              background: "rgba(255,255,255,.08)",
              borderRadius: 10,
              padding: "12px 20px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: "rgba(255,255,255,.75)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <span>⏰</span>
            <span>زمان تخمینی بازگشت: {estimated}</span>
          </div>
        )}

        {/* Contact */}
        {phone && (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>
            برای اطلاعات بیشتر تماس بگیرید:
            <a
              href={`tel:${phone}`}
              style={{
                color: "#ffc107",
                fontWeight: 700,
                marginRight: 6,
                textDecoration: "none",
                direction: "ltr",
                display: "inline-block",
              }}
            >
              {phone}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
