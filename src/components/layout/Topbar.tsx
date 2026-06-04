import { getSiteSettings } from "@/lib/settings";

export default async function Topbar() {
  const s = await getSiteSettings();

  return (
    <div
      className="topbar"
      style={{
        background: "var(--primary-dark)",
        color: "#b8c8e8",
        fontSize: 12,
        padding: "7px 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <i className="ti ti-phone" />
        {s.site_phone}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <i className="ti ti-clock" />
        {s.site_hours}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <i className="ti ti-truck-delivery" />
        {s.site_free_shipping_text}
      </span>
    </div>
  );
}
