"use client";

import Link from "next/link";

const categories = [
  {
    label: "شیرآلات",
    icon: "ti-circle-dotted",
    href: "/category/valves",
    children: [
      { label: "شیر توپی",      href: "/category/ball-valve",      icon: "ti-circle-dotted" },
      { label: "شیر سوزنی",     href: "/category/needle-valve",    icon: "ti-adjustments" },
      { label: "شیر یک‌طرفه",   href: "/category/check-valve",     icon: "ti-git-branch" },
      { label: "شیر فلکه",      href: "/category/gate-valve",      icon: "ti-filter" },
      { label: "شیر رادیاتور",  href: "/category/radiator-valve",  icon: "ti-tool" },
      { label: "شیر مخلوط",     href: "/category/mixer-valve",     icon: "ti-droplet" },
    ],
  },
  {
    label: "لوله‌ها",
    icon: "ti-minus",
    href: "/category/pipes",
    children: [
      { label: "لوله پلیکا PVC",    href: "/category/pvc-pipe",        icon: "ti-minus" },
      { label: "لوله پوش‌فیت",      href: "/category/pushfit-pipe",    icon: "ti-minus" },
      { label: "لوله پنج‌لایه",     href: "/category/multilayer-pipe", icon: "ti-minus" },
      { label: "لوله مانیسمان",     href: "/category/seamless-pipe",   icon: "ti-minus" },
      { label: "لوله گالوانیزه",    href: "/category/galvanized-pipe", icon: "ti-minus" },
      { label: "لوله پلی‌اتیلن",   href: "/category/pe-pipe",         icon: "ti-minus" },
    ],
  },
  {
    label: "اتصالات",
    icon: "ti-git-merge",
    href: "/category/fittings",
    children: [
      { label: "زانو",      href: "/category/elbow",    icon: "ti-git-merge" },
      { label: "سه‌راهی",   href: "/category/tee",      icon: "ti-git-branch-2" },
      { label: "بوشن",      href: "/category/coupling", icon: "ti-minus" },
      { label: "درپوش",     href: "/category/cap",      icon: "ti-circle" },
      { label: "تبدیل",     href: "/category/reducer",  icon: "ti-layout-sidebar" },
      { label: "فلنج",      href: "/category/flange",   icon: "ti-maximize" },
    ],
  },
  {
    label: "پمپ و تجهیزات",
    icon: "ti-activity",
    href: "/category/pumps",
    children: [
      { label: "پمپ آب",         href: "/category/water-pump",      icon: "ti-activity" },
      { label: "منبع انبساط",    href: "/category/expansion-tank",  icon: "ti-thermometer" },
      { label: "فیلتر آب",       href: "/category/water-filter",    icon: "ti-filter" },
      { label: "پمپ تخلیه",      href: "/category/drain-pump",      icon: "ti-bolt" },
    ],
  },
  {
    label: "لوازم بهداشتی",
    icon: "ti-droplet",
    href: "/category/sanitary",
    children: [
      { label: "شیر مخلوط",  href: "/category/mixer",    icon: "ti-droplet" },
      { label: "سیفون",       href: "/category/siphon",   icon: "ti-bath" },
      { label: "یراق‌آلات",   href: "/category/hardware", icon: "ti-tool" },
    ],
  },
];

export default function Megamenu() {
  return (
    <div
      className="megabar"
      style={{ position: "relative", zIndex: 49 }}
    >
      <div
        style={{
          width: "100%",
          padding: "0 2rem",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        {/* ── Category links with dropdowns ──────────────────────── */}
        {categories.map((item) => (
          <div key={item.label} className="mega-item" style={{ position: "relative" }}>
            <Link
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "14px 16px",
                color: "var(--text2)",
                fontSize: 13.5,
                fontWeight: 700,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 14, color: "var(--primary)" }} />
              {item.label}
              <i className="ti ti-chevron-down" style={{ fontSize: 10, opacity: 0.5 }} />
            </Link>

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
                  <i className={`ti ${child.icon}`} style={{ fontSize: 16, color: "var(--primary)" }} />
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* ── Left-side items ─────────────────────────────────────── */}
        <div style={{ marginRight: "auto", display: "flex", alignItems: "stretch" }}>

          {/* وبلاگ */}
          <Link
            href="/blog"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px", color: "var(--text2)", fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap" }}
          >
            <i className="ti ti-news" style={{ fontSize: 15, color: "var(--primary)" }} /> وبلاگ
          </Link>

          {/* فاکتورساز — [جدید] badge */}
          <div className="mega-item" style={{ position: "relative" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px", color: "var(--text2)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              <i className="ti ti-file-invoice" style={{ fontSize: 14, color: "var(--primary)" }} />
              فاکتورساز
              <span style={{ background: "#17a865", color: "#fff", fontSize: 10, fontWeight: 900, padding: "1px 7px", borderRadius: 20, lineHeight: 1.6 }}>
                جدید
              </span>
              <i className="ti ti-chevron-down" style={{ fontSize: 10, opacity: 0.5 }} />
            </span>
            <div className="mega-drop" style={{ minWidth: 300, padding: 16, right: 0, left: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                نوع فاکتور را انتخاب کنید
              </div>
              <Link href="/invoice?type=official" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", marginBottom: 10, textDecoration: "none" }}>
                <div style={{ width: 40, height: 40, background: "var(--bg)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-file-certificate" style={{ fontSize: 20, color: "var(--primary)" }} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 13, fontWeight: 900 }}>فاکتور فروش</strong>
                  <span style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>فاکتور کامل با اطلاعات خریدار، مالیات، تخفیف و چاپ رسمی</span>
                </div>
              </Link>
              <Link href="/invoice?type=contractor" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", textDecoration: "none" }}>
                <div style={{ width: 40, height: 40, background: "var(--bg)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-helmet" style={{ fontSize: 20, color: "var(--primary)" }} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 13, fontWeight: 900 }}>فاکتور مجریان</strong>
                  <span style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>لیست سریع لوله، اتصالات و شیرآلات با سایزبندی</span>
                </div>
              </Link>
            </div>
          </div>

          {/* خرید سازمانی — orange accent, far left */}
          <Link
            href="/organizational"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "14px 18px",
              color: "var(--accent)",
              fontSize: 13.5,
              fontWeight: 900,
              whiteSpace: "nowrap",
              borderRight: "1px solid var(--border)",
            }}
          >
            <i className="ti ti-building-skyscraper" style={{ fontSize: 14 }} />
            خرید سازمانی
          </Link>
        </div>
      </div>
    </div>
  );
}
