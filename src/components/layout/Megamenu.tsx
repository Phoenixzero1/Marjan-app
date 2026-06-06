"use client";

import Link from "next/link";

const menuItems = [
  { label: "خانه", href: "/", icon: "ti-home" },
  {
    label: "شیرآلات",
    icon: "ti-circle-dotted",
    href: "/category/valves",
    children: [
      { label: "شیر توپی", href: "/category/ball-valve", icon: "ti-circle-dotted" },
      { label: "شیر سوزنی", href: "/category/needle-valve", icon: "ti-adjustments" },
      { label: "شیر یک‌طرفه", href: "/category/check-valve", icon: "ti-git-branch" },
      { label: "شیر فلکه", href: "/category/gate-valve", icon: "ti-filter" },
      { label: "شیر رادیاتور", href: "/category/radiator-valve", icon: "ti-tool" },
      { label: "شیر مخلوط", href: "/category/mixer-valve", icon: "ti-droplet" },
    ],
  },
  {
    label: "لوله‌ها",
    icon: "ti-minus",
    href: "/category/pipes",
    children: [
      { label: "لوله پلیکا PVC", href: "/category/pvc-pipe", icon: "ti-minus" },
      { label: "لوله پوش‌فیت", href: "/category/pushfit-pipe", icon: "ti-minus" },
      { label: "لوله پنج‌لایه", href: "/category/multilayer-pipe", icon: "ti-minus" },
      { label: "لوله مانیسمان", href: "/category/seamless-pipe", icon: "ti-minus" },
      { label: "لوله گالوانیزه", href: "/category/galvanized-pipe", icon: "ti-minus" },
      { label: "لوله پلی‌اتیلن", href: "/category/pe-pipe", icon: "ti-minus" },
    ],
  },
  {
    label: "اتصالات",
    icon: "ti-git-merge",
    href: "/category/fittings",
    children: [
      { label: "زانو", href: "/category/elbow", icon: "ti-git-merge" },
      { label: "سه‌راهی", href: "/category/tee", icon: "ti-git-branch-2" },
      { label: "بوشن", href: "/category/coupling", icon: "ti-minus" },
      { label: "درپوش", href: "/category/cap", icon: "ti-circle" },
      { label: "تبدیل", href: "/category/reducer", icon: "ti-layout-sidebar" },
      { label: "فلنج", href: "/category/flange", icon: "ti-maximize" },
    ],
  },
  {
    label: "پمپ و تجهیزات",
    icon: "ti-activity",
    href: "/category/pumps",
    children: [
      { label: "پمپ آب", href: "/category/water-pump", icon: "ti-activity" },
      { label: "منبع انبساط", href: "/category/expansion-tank", icon: "ti-thermometer" },
      { label: "فیلتر آب", href: "/category/water-filter", icon: "ti-filter" },
      { label: "پمپ تخلیه", href: "/category/drain-pump", icon: "ti-bolt" },
    ],
  },
  {
    label: "لوازم بهداشتی",
    icon: "ti-droplet",
    href: "/category/sanitary",
    children: [
      { label: "شیر مخلوط", href: "/category/mixer", icon: "ti-droplet" },
      { label: "سیفون", href: "/category/siphon", icon: "ti-bath" },
      { label: "یراق‌آلات", href: "/category/hardware", icon: "ti-tool" },
    ],
  },
];

export default function Megamenu() {
  return (
    <div
      className="megabar"
      style={{
        background: "var(--primary-mid)",
        position: "sticky",
        top: 64,
        zIndex: 49,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "auto",
          padding: "0 2rem",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        {menuItems.map((item) => (
          <div key={item.label} className="mega-item" style={{ position: "relative" }}>
            <Link
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 15px",
                color: "rgba(255,255,255,.85)",
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} />
              {item.label}
              {item.children && (
                <i className="ti ti-chevron-down" style={{ fontSize: 11 }} />
              )}
            </Link>

            {item.children && (
              <div className="mega-drop">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 18px",
                      fontSize: 13,
                      color: "var(--text2)",
                      fontWeight: 700,
                    }}
                  >
                    <i
                      className={`ti ${child.icon}`}
                      style={{ fontSize: 16, color: "var(--primary)" }}
                    />
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Right-side items */}
        <div style={{ marginRight: "auto", display: "flex", alignItems: "stretch" }}>
          <Link
            href="/blog"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "12px 15px",
              color: "rgba(255,255,255,.85)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <i className="ti ti-news" /> وبلاگ
          </Link>
          <Link
            href="/about"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "12px 15px",
              color: "rgba(255,255,255,.85)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <i className="ti ti-info-circle" /> درباره ما
          </Link>
          <Link
            href="/contact"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "12px 15px",
              color: "rgba(255,255,255,.85)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <i className="ti ti-phone" /> تماس
          </Link>
          <Link
            href="/faq"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "12px 15px",
              color: "rgba(255,255,255,.85)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <i className="ti ti-help" /> FAQ
          </Link>

          {/* Invoice Builder hover */}
          <div className="mega-item" style={{ position: "relative" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 15px",
                color: "rgba(255,255,255,.85)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <i className="ti ti-file-invoice" /> فاکتورساز
              <i className="ti ti-chevron-down" style={{ fontSize: 11 }} />
            </span>
            <div
              className="mega-drop"
              style={{ minWidth: 320, padding: 16, right: 0, left: "auto" }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "var(--text3)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginBottom: 10,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                نوع فاکتور را انتخاب کنید
              </div>
              <Link
                href="/invoice?type=official"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: 12,
                  borderRadius: "var(--radius-sm)",
                  border: "1.5px solid var(--border)",
                  marginBottom: 10,
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: "var(--bg)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <i
                    className="ti ti-file-certificate"
                    style={{ fontSize: 20, color: "var(--primary)" }}
                  />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 13, fontWeight: 900 }}>
                    فاکتور فروش
                  </strong>
                  <span style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>
                    فاکتور کامل با اطلاعات خریدار، مالیات، تخفیف و چاپ رسمی
                  </span>
                </div>
              </Link>
              <Link
                href="/invoice?type=contractor"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: 12,
                  borderRadius: "var(--radius-sm)",
                  border: "1.5px solid var(--border)",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: "var(--bg)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <i
                    className="ti ti-helmet"
                    style={{ fontSize: 20, color: "var(--primary)" }}
                  />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 13, fontWeight: 900 }}>
                    فاکتور مجریان
                  </strong>
                  <span style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>
                    لیست سریع لوله، اتصالات و شیرآلات با سایزبندی
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
