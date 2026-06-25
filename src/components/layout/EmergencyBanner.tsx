import { prisma } from "@/lib/prisma";

export default async function EmergencyBanner() {
  try {
    const rows = await prisma.siteSettings.findMany({
      where: { key: { in: ["emergency_banner", "emergency_banner_message"] } },
      select: { key: true, value: true },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    if (map.emergency_banner !== "true") return null;
    const message = map.emergency_banner_message || "پیام مهم از مارجان";

    return (
      <div className="emergency-banner" style={{
        background: "linear-gradient(90deg, #1e40af, #2563eb)",
        color: "#fff",
        textAlign: "center",
        padding: "8px 1rem",
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "Vazirmatn",
        position: "relative",
        zIndex: 800,
      }}>
        <i className="ti ti-alert-circle" style={{ marginLeft: 6 }} />
        {message}
      </div>
    );
  } catch {
    return null;
  }
}
