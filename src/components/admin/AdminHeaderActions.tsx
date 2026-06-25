"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAdminNotif } from "@/components/admin/AdminNotifProvider";

const NAV_SEARCH_MAP = [
  { href: "/admin", label: "آمار و گزارشات", icon: "ti-chart-bar" },
  { href: "/admin/users", label: "مدیریت کاربران", icon: "ti-users" },
  { href: "/admin/products", label: "محصولات", icon: "ti-package" },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: "ti-category" },
  { href: "/admin/brands", label: "برندها", icon: "ti-building-factory" },
  { href: "/admin/slider", label: "اسلایدر", icon: "ti-slideshow" },
  { href: "/admin/flashdeal", label: "مرجان تایم", icon: "ti-clock-bolt" },
  { href: "/admin/blog", label: "بلاگ", icon: "ti-news" },
  { href: "/admin/media", label: "رسانه‌ها", icon: "ti-photo" },
  { href: "/admin/orders", label: "سفارشات", icon: "ti-truck-delivery" },
  { href: "/admin/returns", label: "مرجوعی‌ها", icon: "ti-arrow-back-up" },
  { href: "/admin/finance", label: "مالی", icon: "ti-report-money" },
  { href: "/admin/coupons", label: "تخفیف و کوپن", icon: "ti-ticket" },
  { href: "/admin/org-requests", label: "خرید سازمانی", icon: "ti-building-skyscraper" },
  { href: "/admin/wallet", label: "کیف پول", icon: "ti-wallet" },
  { href: "/admin/notifications", label: "اطلاع‌رسانی", icon: "ti-bell" },
  { href: "/admin/comments", label: "نظرات", icon: "ti-message-circle" },
  { href: "/admin/newsletter", label: "خبرنامه", icon: "ti-mail" },
  { href: "/admin/contact-messages", label: "پیام‌های تماس", icon: "ti-message-dots" },
  { href: "/admin/reviews", label: "نظرات محصولات", icon: "ti-star" },
  { href: "/admin/faqs", label: "سوالات متداول", icon: "ti-help-circle" },
  { href: "/admin/product-questions", label: "سوالات محصولات", icon: "ti-question-mark" },
  { href: "/admin/showcase", label: "ویترین تصاویر", icon: "ti-photo-check" },
  { href: "/admin/chat", label: "چت پشتیبانی", icon: "ti-messages" },
  { href: "/admin/connections", label: "اتصالات", icon: "ti-plug-connected" },
  { href: "/admin/settings", label: "تنظیمات عمومی", icon: "ti-settings" },
  { href: "/admin/settings/payment", label: "درگاه پرداخت", icon: "ti-credit-card" },
  { href: "/admin/settings/seo", label: "سئو", icon: "ti-search" },
  { href: "/admin/settings/security", label: "امنیت", icon: "ti-lock" },
  { href: "/admin/backup", label: "پشتیبان‌گیری", icon: "ti-database" },
  { href: "/admin/logs", label: "لاگ سیستم", icon: "ti-terminal-2" },
  { href: "/admin/sessions", label: "نشست‌ها", icon: "ti-device-laptop" },
  { href: "/admin/roles", label: "نقش‌ها و دسترسی", icon: "ti-shield-half-filled" },
  { href: "/admin/trash", label: "سطل زباله", icon: "ti-trash" },
  { href: "/admin/cms", label: "مدیریت محتوا", icon: "ti-layout-cms" },
  { href: "/admin/maintenance", label: "حالت تعمیرات", icon: "ti-tools" },
  { href: "/admin/migration", label: "انتقال سایت", icon: "ti-package-export" },
  { href: "/admin/db-schema", label: "ساختار پایگاه داده", icon: "ti-database-export" },
];

export function AdminHeaderActions() {
  const router = useRouter();
  const { data: session } = useSession();
  const { counts } = useAdminNotif();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  const totalNotif = counts.orders + counts.comments + counts.returns + counts.logs;

  const searchResults = searchQuery.length > 0
    ? NAV_SEARCH_MAP.filter(item => item.label.includes(searchQuery) || item.href.includes(searchQuery.toLowerCase())).slice(0, 7)
    : [];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <i className="ti ti-search" style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "rgba(255,255,255,0.40)", pointerEvents: "none" }} />
        <input
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowSearchDrop(e.target.value.length > 0); }}
          onBlur={() => setTimeout(() => setShowSearchDrop(false), 160)}
          onFocus={() => searchQuery.length > 0 && setShowSearchDrop(true)}
          placeholder="جستجو..."
          style={{ paddingRight: 30, paddingLeft: 10, paddingTop: 6, paddingBottom: 6, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.09)", borderRadius: "var(--radius-sm)", fontFamily: "Vazirmatn", fontSize: 12, color: "#fff", outline: "none", width: 150 }}
        />
        {showSearchDrop && searchResults.length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: 230, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "0 8px 24px rgba(0,0,0,0.14)", zIndex: 500, overflow: "hidden" }}>
            {searchResults.map((item, idx) => (
              <button key={item.href} onMouseDown={() => { router.push(item.href); setSearchQuery(""); setShowSearchDrop(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "none", border: "none", borderBottom: idx < searchResults.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "right" }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 15, color: "var(--primary)", flexShrink: 0 }} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bell */}
      <div style={{ position: "relative" }}>
        <button onClick={() => { setShowNotifPanel(p => !p); setShowProfilePanel(false); }}
          style={{ position: "relative", background: showNotifPanel ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.18)", width: 34, height: 34, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#fff" }}>
          <i className="ti ti-bell" />
          {totalNotif > 0 && <span style={{ position: "absolute", top: -4, left: -4, minWidth: 15, height: 15, background: "#c0392b", borderRadius: 8, border: "2px solid var(--primary-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "#fff", padding: "0 2px" }}>{totalNotif > 9 ? "9+" : totalNotif}</span>}
        </button>
        {showNotifPanel && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, width: 290, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 500, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,var(--primary) 0%,#1a5fa0 100%)" }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>اعلان‌ها</span>
              <button onClick={() => setShowNotifPanel(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", fontSize: 13, cursor: "pointer", color: "#fff", width: 24, height: 24, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-x" /></button>
            </div>
            {([
              { label: "سفارشات جدید", count: counts.orders, icon: "ti-shopping-cart", color: "#1a7a4a", bg: "rgba(26,122,74,0.08)", href: "/admin/orders" },
              { label: "نظرات بلاگ", count: counts.comments, icon: "ti-message-circle", color: "var(--primary)", bg: "rgba(10,42,94,0.07)", href: "/admin/comments" },
              { label: "مرجوعی‌ها", count: counts.returns, icon: "ti-arrow-back-up", color: "var(--accent)", bg: "rgba(232,146,10,0.07)", href: "/admin/returns" },
              { label: "لاگ‌های جدید", count: counts.logs, icon: "ti-terminal-2", color: "#c0392b", bg: "rgba(192,57,43,0.07)", href: "/admin/logs" },
            ]).map((item, idx) => (
              <button key={idx} onClick={() => { router.push(item.href); setShowNotifPanel(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "none", border: "none", borderBottom: idx < 3 ? "1px solid var(--border)" : "none", cursor: "pointer", fontFamily: "Vazirmatn", textAlign: "right" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRight: `3px solid ${item.color}` }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: 15, color: item.color }} />
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{item.label}</span>
                {item.count > 0
                  ? <span style={{ background: item.color, color: "#fff", fontSize: 11, fontWeight: 900, padding: "1px 7px", borderRadius: 8 }}>{item.count}</span>
                  : <span style={{ fontSize: 11, color: "var(--text3)" }}>—</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Profile */}
      <div style={{ position: "relative" }}>
        <button onClick={() => { setShowProfilePanel(p => !p); setShowNotifPanel(false); }}
          style={{ width: 34, height: 34, background: showProfilePanel ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "1px solid rgba(255,255,255,0.22)" }}
          title={session?.user?.email ?? ""}>
          <i className="ti ti-user" style={{ color: "#fff", fontSize: 15 }} />
        </button>
        {showProfilePanel && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, width: 220, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 500, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", background: "linear-gradient(135deg,var(--primary) 0%,#1a5fa0 100%)", display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, background: "rgba(255,255,255,0.15)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="ti ti-user" style={{ color: "#fff", fontSize: 18 }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.name || session?.user?.email || "مدیر"}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>{(session?.user as { role?: string })?.role === "SUPER_ADMIN" ? "ادمین ارشد" : "ادمین"}</div>
              </div>
            </div>
            <div style={{ padding: 8 }}>
              <div style={{ padding: "7px 10px", fontSize: 11, color: "var(--text3)", background: "var(--bg)", borderRadius: "var(--radius-sm)", direction: "ltr", fontFamily: "monospace", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.email ?? "—"}</div>
              <button onClick={() => router.push("/")}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>
                <i className="ti ti-home" style={{ fontSize: 14 }} /> بازگشت به سایت
              </button>
              <button onClick={() => { window.location.href = "/api/auth/signout"; }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fdecea", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, color: "#c0392b" }}>
                <i className="ti ti-logout" style={{ fontSize: 14 }} /> خروج از حساب
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
