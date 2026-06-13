import { getSiteSettings } from "@/lib/settings";

export default async function Topbar() {
  const s = await getSiteSettings();
  const text = s.site_free_shipping_text || "بیش از ۱۲,۰۰۰ محصول اصل — ارسال سریع سراسری — ضمانت اصالت کالا";

  return (
    <div
      className="topbar"
      style={{
        background: "var(--primary-dark)",
        padding: "7px 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <span
        style={{
          background: "var(--accent)",
          color: "#fff",
          padding: "3px 12px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          gap: 5,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <i className="ti ti-tag-starred" /> فروش ویژه
      </span>

      <span
        style={{
          flex: 1,
          textAlign: "center",
          fontSize: 12.5,
          fontWeight: 700,
          color: "rgba(255,255,255,.9)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {text}
      </span>

      <span
        style={{
          background: "var(--accent)",
          color: "#fff",
          padding: "3px 12px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          gap: 5,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <i className="ti ti-tag-starred" /> فروش ویژه
      </span>
    </div>
  );
}
