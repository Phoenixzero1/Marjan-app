"use client";

export default function Topbar() {
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
        {process.env.NEXT_PUBLIC_APP_PHONE ?? "۰۲۱-۴۴۵۵۶۶۷۷"}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <i className="ti ti-clock" />
        شنبه تا پنجشنبه ۸ تا ۱۷
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <i className="ti ti-truck-delivery" />
        ارسال رایگان بالای ۵ میلیون تومان
      </span>
    </div>
  );
}
