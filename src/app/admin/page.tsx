"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import ProductForm from "@/components/admin/ProductForm";
import CategoryManager from "@/components/admin/CategoryManager";
import OrderManager from "@/components/admin/OrderManager";
import UserManager from "@/components/admin/UserManager";
import BlogManager from "@/components/admin/BlogManager";
import MediaLibrary from "@/components/admin/MediaLibrary";
import FinanceManager from "@/components/admin/FinanceManager";
import CouponManager from "@/components/admin/CouponManager";
import NotificationManager from "@/components/admin/NotificationManager";
import CommentManager from "@/components/admin/CommentManager";
import NewsletterManager from "@/components/admin/NewsletterManager";
import SettingsManager from "@/components/admin/SettingsManager";
import BackupManager from "@/components/admin/BackupManager";
import LogsManager from "@/components/admin/LogsManager";
import SessionsManager from "@/components/admin/SessionsManager";
import RolesManager from "@/components/admin/RolesManager";
import TrashManager from "@/components/admin/TrashManager";
import ReturnsManager from "@/components/admin/ReturnsManager";
import MaintenanceManager from "@/components/admin/MaintenanceManager";
import MigrationManager from "@/components/admin/MigrationManager";
import CmsManager from "@/components/admin/CmsManager";
import BrandManager from "@/components/admin/BrandManager";
import SliderManager from "@/components/admin/SliderManager";
import FlashDealManager from "@/components/admin/FlashDealManager";

interface ProductRow {
  id: string; name: string; sku: string | null; price: number;
  stockQty: number; status: string;
  category: { name: string } | null;
  brand: { name: string } | null;
}

type AdminSection =
  | "analytics" | "users" | "products" | "categories"
  | "orders-admin" | "finance" | "coupons" | "blog-admin"
  | "media" | "notifications-admin" | "comments" | "newsletter"
  | "settings-general" | "settings-payment" | "settings-seo"
  | "settings-security" | "backup" | "logs" | "sessions"
  | "roles" | "trash" | "returns" | "maintenance" | "migration" | "cms" | "brands" | "slider" | "flashdeal" | "product-form";

interface Stats {
  totalOrders: number; monthOrders: number; totalUsers: number; todayUsers: number;
  totalRevenue: number; monthRevenue: number; pendingOrders: number; todayVisits: number;
  pendingReviews: number; pendingBlogPosts: number;
}

interface NotifCounts { orders: number; comments: number; returns: number; sessions: number; logs: number; blog: number; }
interface SeenCounts { orders: number; comments: number; returns: number; sessions: number; logs: number; blog: number; }
interface ErrorNotif { id: string; message: string; detail: string; timestamp: string; }

interface ChartDay { label: string; value: number; }
interface ActivityItem {
  id: string; user: string; type: string; typeLabel: string;
  typeClass: string; detail: string; createdAt: string;
}
interface AnalyticsData {
  chart: ChartDay[];
  activity: ActivityItem[];
  revenueChange: number;
  ordersChange: number;
}

const ZERO_COUNTS: NotifCounts = { orders: 0, comments: 0, returns: 0, sessions: 0, logs: 0, blog: 0 };
const ZERO_SEEN: SeenCounts = { orders: 0, comments: 0, returns: 0, sessions: 0, logs: 0, blog: 0 };

interface BadgeInfo { count: string; color: string; }

function buildNavGroups(counts: NotifCounts, seen: SeenCounts) {
  const badge = (raw: number, seenCount: number, color = "var(--accent)"): BadgeInfo | undefined => {
    const unseen = Math.max(0, raw - seenCount);
    return unseen > 0 ? { count: String(unseen), color } : undefined;
  };
  return [
    { label: "داشبورد", items: [{ id: "analytics", icon: "ti-chart-bar", label: "آمار و گزارشات", badge: undefined as BadgeInfo | undefined }] },
    { label: "کاربران", items: [{ id: "users", icon: "ti-users", label: "مدیریت کاربران", badge: undefined as BadgeInfo | undefined }] },
    {
      label: "محتوا", items: [
        { id: "products", icon: "ti-package", label: "محصولات", badge: undefined as BadgeInfo | undefined },
        { id: "categories", icon: "ti-category", label: "دسته‌بندی‌ها", badge: undefined as BadgeInfo | undefined },
        { id: "brands", icon: "ti-building-factory", label: "برندها", badge: undefined as BadgeInfo | undefined },
        { id: "slider", icon: "ti-slideshow", label: "اسلایدر", badge: undefined as BadgeInfo | undefined },
        { id: "flashdeal", icon: "ti-clock-bolt", label: "مرجان تایم", badge: undefined as BadgeInfo | undefined },
        { id: "blog-admin", icon: "ti-news", label: "بلاگ", badge: badge(counts.blog, seen.blog) },
        { id: "media", icon: "ti-photo", label: "رسانه‌ها", badge: undefined as BadgeInfo | undefined },
      ],
    },
    {
      label: "فروش", items: [
        { id: "orders-admin", icon: "ti-truck-delivery", label: "سفارشات", badge: badge(counts.orders, seen.orders) },
        { id: "returns", icon: "ti-arrow-back-up", label: "مرجوعی‌ها", badge: badge(counts.returns, seen.returns) },
        { id: "finance", icon: "ti-report-money", label: "مالی", badge: undefined as BadgeInfo | undefined },
        { id: "coupons", icon: "ti-ticket", label: "تخفیف و کوپن", badge: undefined as BadgeInfo | undefined },
      ],
    },
    {
      label: "سیستم‌های جانبی", items: [
        { id: "notifications-admin", icon: "ti-bell", label: "اطلاع‌رسانی", badge: undefined as BadgeInfo | undefined },
        { id: "comments", icon: "ti-message-circle", label: "نظرات", badge: badge(counts.comments, seen.comments) },
        { id: "newsletter", icon: "ti-mail", label: "خبرنامه", badge: undefined as BadgeInfo | undefined },
      ],
    },
    {
      label: "تنظیمات", items: [
        { id: "settings-general", icon: "ti-settings", label: "عمومی", badge: undefined as BadgeInfo | undefined },
        { id: "settings-payment", icon: "ti-credit-card", label: "درگاه پرداخت", badge: undefined as BadgeInfo | undefined },
        { id: "settings-seo", icon: "ti-search", label: "سئو", badge: undefined as BadgeInfo | undefined },
        { id: "settings-security", icon: "ti-lock", label: "امنیت", badge: undefined as BadgeInfo | undefined },
        { id: "backup", icon: "ti-database", label: "پشتیبان‌گیری", badge: undefined as BadgeInfo | undefined },
        { id: "logs", icon: "ti-terminal-2", label: "لاگ سیستم", badge: badge(counts.logs, seen.logs, "#c0392b") },
        { id: "sessions", icon: "ti-device-laptop", label: "نشست‌ها", badge: badge(counts.sessions, seen.sessions) },
      ],
    },
    {
      label: "دسترسی", items: [
        { id: "roles", icon: "ti-shield-half-filled", label: "نقش‌ها و دسترسی", badge: undefined as BadgeInfo | undefined },
      ],
    },
    {
      label: "سطل زباله", items: [
        { id: "trash", icon: "ti-trash", label: "آیتم‌های حذف‌شده", badge: undefined as BadgeInfo | undefined },
      ],
    },
    {
      label: "مدیریت محتوا", items: [
        { id: "cms", icon: "ti-layout-cms", label: "صفحات / بنرها / منوها", badge: undefined as BadgeInfo | undefined },
      ],
    },
    {
      label: "ابزار مدیر ارشد", items: [
        { id: "maintenance", icon: "ti-tools", label: "حالت تعمیرات", badge: undefined as BadgeInfo | undefined },
        { id: "migration", icon: "ti-package-export", label: "انتقال سایت", badge: undefined as BadgeInfo | undefined },
      ],
    },
  ];
}

// Maps section id → seen/counts key
const SECTION_SEEN_KEY: Partial<Record<AdminSection, keyof SeenCounts>> = {
  "orders-admin": "orders",
  "comments": "comments",
  "blog-admin": "blog",
  "returns": "returns",
  "sessions": "sessions",
  "logs": "logs",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>("analytics");
  const [stats, setStats] = useState<Stats | null>(null);
  const [counts, setCounts] = useState<NotifCounts>(ZERO_COUNTS);
  const [seen, setSeen] = useState<SeenCounts>(ZERO_SEEN);
  const [markingRead, setMarkingRead] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorNotifs, setErrorNotifs] = useState<ErrorNotif[]>([]);

  // Hide site Topbar, Megamenu, and Footer while on admin page
  useEffect(() => {
    document.body.classList.add("admin-mode");
    return () => document.body.classList.remove("admin-mode");
  }, []);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [editProductId, setEditProductId] = useState<string | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adminToast, setAdminToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const showAdminToast = useCallback((type: "success" | "error", msg: string) => {
    setAdminToast({ type, msg });
    setTimeout(() => setAdminToast(null), 4000);
  }, []);

  const addErrorNotif = useCallback((message: string, detail: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp = new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setErrorNotifs((prev) => [...prev.slice(-9), { id, message, detail, timestamp }]);
  }, []);

  const dismissError = useCallback((id: string) => {
    setErrorNotifs((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Unhandled promise rejections → show error notification
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      addErrorNotif("خطای ناشناخته در پنل", e.reason?.message ?? String(e.reason ?? "unknown"));
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, [addErrorNotif]);

  const loadCounts = useCallback(() => {
    fetch("/api/admin/notifications/counts")
      .then((r) => r.text())
      .then((t) => {
        try {
          const d = t ? JSON.parse(t) : {};
          if (d && typeof d.orders === "number") setCounts(d);
        } catch { /* ignore */ }
      })
      .catch(() => { /* counts are non-critical background refresh */ });
  }, []);

  const handleDeleteProduct = useCallback(async (id: string, name: string) => {
    if (!window.confirm(`آیا از حذف "${name}" مطمئن هستید؟\nاین عملیات برگشت‌پذیر نیست.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showAdminToast("error", data.error ?? "خطا در حذف محصول"); return; }
      showAdminToast("success", `"${name}" با موفقیت حذف شد`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      showAdminToast("error", "خطای سرور");
    } finally {
      setDeletingId(null);
    }
  }, [showAdminToast]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status === "authenticated") {
      const role = (session.user as { role?: string }).role ?? "";
      if (!["ADMIN", "SUPER_ADMIN"].includes(role)) { router.push("/"); return; }

      fetch("/api/admin/stats").then((r) => r.text()).then((t) => { try { if (t) setStats(JSON.parse(t)); } catch { /* ignore */ } });

      loadCounts();

      fetch("/api/admin/notifications/seen").then((r) => r.text()).then((t) => {
        try {
          const d = t ? JSON.parse(t) : {};
          if (d && typeof d.orders === "number") setSeen(d);
        } catch { /* ignore */ }
      });
    }
  }, [status, session, router, loadCounts]);

  // Auto-refresh badge counts every 60 seconds
  useEffect(() => {
    if (status !== "authenticated") return;
    const interval = setInterval(loadCounts, 60_000);
    return () => clearInterval(interval);
  }, [status, loadCounts]);

  useEffect(() => {
    if (section === "products") {
      fetch("/api/admin/products")
        .then((r) => r.text())
        .then((t) => {
          try {
            const d = t ? JSON.parse(t) : {};
            setProducts(d.products ?? []);
          } catch {
            addErrorNotif("خطا در دریافت داده محصولات", "GET /api/admin/products");
          }
        })
        .catch(() => addErrorNotif("خطا در اتصال به سرور", "GET /api/admin/products"));
    }
    if (section === "analytics" && !analyticsData) {
      fetch("/api/admin/analytics")
        .then((r) => r.text())
        .then((t) => { try { if (t) setAnalyticsData(JSON.parse(t)); } catch { addErrorNotif("خطا در دریافت داده آمار", "GET /api/admin/analytics"); } })
        .catch(() => addErrorNotif("خطا در اتصال به سرور", "GET /api/admin/analytics"));
    }
  }, [section, analyticsData, addErrorNotif]);

  // Mark current section as read
  const markSectionRead = useCallback(async () => {
    const seenKey = SECTION_SEEN_KEY[section];
    if (!seenKey) return;
    const rawCount = counts[seenKey] ?? 0;
    setMarkingRead(true);
    try {
      const res = await fetch("/api/admin/notifications/seen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: seenKey, count: rawCount }),
      });
      if (!res.ok) {
        addErrorNotif("خطا در ثبت وضعیت خوانده‌شده", `PUT /api/admin/notifications/seen → ${res.status}`);
      } else {
        setSeen((prev) => ({ ...prev, [seenKey]: rawCount }));
        showAdminToast("success", "همه موارد به عنوان خوانده‌شده علامت‌گذاری شدند");
      }
    } catch {
      addErrorNotif("خطا در اتصال به سرور", "PUT /api/admin/notifications/seen");
    } finally {
      setMarkingRead(false);
    }
  }, [section, counts, addErrorNotif, showAdminToast]);

  // Reload products list after returning from product form
  const handleProductFormSuccess = useCallback(() => {
    setSection("products");
    fetch("/api/admin/products").then((r) => r.text()).then((t) => { try { const d = t ? JSON.parse(t) : {}; setProducts(d.products ?? []); } catch { /* ignore */ } });
  }, []);

  if (status === "loading") return <div style={{ textAlign: "center", padding: "5rem" }}>در حال بارگذاری...</div>;

  const navGroups = buildNavGroups(counts, seen);

  // Badge count for current section (to show in mark-read button)
  const currentSeenKey = SECTION_SEEN_KEY[section];
  const currentRawCount = currentSeenKey ? (counts[currentSeenKey] ?? 0) : 0;
  const currentUnseenCount = Math.max(0, currentRawCount - (currentSeenKey ? seen[currentSeenKey] : 0));
  const showMarkRead = !!currentSeenKey && currentUnseenCount > 0;

  const titleMap: Record<string, string> = {
    analytics: "آمار و گزارشات", users: "مدیریت کاربران", products: "محصولات",
    categories: "دسته‌بندی‌ها", "orders-admin": "سفارشات", finance: "مالی",
    "blog-admin": "بلاگ", media: "رسانه‌ها", coupons: "تخفیف و کوپن",
    logs: "لاگ سیستم", sessions: "نشست‌ها", "settings-general": "تنظیمات عمومی",
    "settings-payment": "درگاه پرداخت", "settings-seo": "سئو", "settings-security": "امنیت",
    roles: "نقش‌ها و دسترسی", "product-form": "افزودن محصول جدید",
    maintenance: "حالت تعمیرات",
    migration: "انتقال سایت",
    cms: "مدیریت محتوا",
    returns: "مرجوعی‌ها",
    slider: "مدیریت اسلایدر",
    flashdeal: "مرجان تایم",
  };

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
      {/* Admin Sidebar — fixed, scrolls independently */}
      <aside
        className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}
        style={{ width: 240, background: "var(--primary-dark)", flexShrink: 0, display: "flex", flexDirection: "column", position: "fixed", top: 64, right: 0, height: "calc(100vh - 64px)", overflowY: "auto", overflowX: "hidden", zIndex: 50, scrollbarWidth: "thin" }}
      >
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-shield-lock" style={{ fontSize: 22, color: "var(--accent)" }} />
          <span style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>پنل مدیریت</span>
        </div>

        {navGroups.map((group) => (
          <div key={group.label} style={{ padding: ".75rem 0" }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,.35)", letterSpacing: ".1em", textTransform: "uppercase", padding: ".25rem 1.5rem .5rem" }}>
              {group.label}
            </div>
            {group.items.map((item) => (
              <div
                key={item.id}
                onClick={() => { setSection(item.id as AdminSection); setSidebarOpen(false); }}
                className={`admin-nav-item ${section === item.id ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 1.5rem", color: section === item.id ? "#fff" : "rgba(255,255,255,.65)", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s", borderRight: section === item.id ? "3px solid var(--accent)" : "3px solid transparent", background: section === item.id ? "rgba(255,255,255,.1)" : "transparent" }}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: 17, flexShrink: 0 }} />
                {item.label}
                {item.badge && (
                  <span style={{ marginRight: "auto", background: item.badge.color, color: "#fff", fontSize: 10, fontWeight: 900, padding: "1px 7px", borderRadius: 10 }}>
                    {item.badge.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,.1)", marginTop: "1rem" }}>
          <div onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.65)", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: ".5rem 0" }}>
            <i className="ti ti-arrow-right" /> بازگشت به سایت
          </div>
        </div>
      </aside>

      {/* Admin Main — offset by sidebar width on desktop */}
      <main className="admin-main" style={{ flex: 1, background: "var(--bg)", overflowY: "auto", minWidth: 0, marginRight: 240 }}>
        {/* Topbar */}
        <div style={{ background: "#fff", padding: ".75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
              style={{ background: "transparent", border: "none", fontSize: 22, color: "var(--primary)", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <i className="ti ti-menu-2" />
            </button>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)" }}>
              {titleMap[section] ?? section}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {showMarkRead && (
              <button
                onClick={markSectionRead}
                disabled={markingRead}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "var(--accent)", color: "#fff",
                  border: "none", borderRadius: "var(--radius-sm)",
                  padding: "6px 14px", fontFamily: "Vazirmatn",
                  fontSize: 12, fontWeight: 700, cursor: markingRead ? "not-allowed" : "pointer",
                  opacity: markingRead ? 0.7 : 1,
                }}
              >
                <i className="ti ti-checks" style={{ fontSize: 14 }} />
                {markingRead ? "در حال ثبت..." : `علامت‌گذاری همه به عنوان خوانده‌شده (${currentUnseenCount})`}
              </button>
            )}
            <div className="hidden md:block" style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700 }}>مدیر سیستم</div>
            <div style={{ width: 34, height: 34, background: "var(--primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-user" style={{ color: "#fff", fontSize: 16 }} />
            </div>
          </div>
        </div>

        {/* Admin-level toast (action feedback) */}
        {adminToast && (
          <div style={{
            position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
            background: adminToast.type === "success" ? "#1a7a4a" : "#c0392b",
            color: "#fff", padding: "12px 28px", borderRadius: 10,
            fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700,
            zIndex: 9999, boxShadow: "0 6px 24px rgba(0,0,0,.25)",
            display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap",
          }}>
            <i className={`ti ${adminToast.type === "success" ? "ti-circle-check" : "ti-circle-x"}`} style={{ fontSize: 18 }} />
            {adminToast.msg}
          </div>
        )}

        {/* Global error notifications — persistent, top-left, dismissible */}
        {errorNotifs.length > 0 && (
          <div style={{
            position: "fixed", top: 80, left: 16, zIndex: 99998,
            display: "flex", flexDirection: "column", gap: 8, maxWidth: 380,
          }}>
            {errorNotifs.map((n) => (
              <div key={n.id} style={{
                background: "#c0392b", color: "#fff",
                padding: "10px 12px", borderRadius: 10,
                boxShadow: "0 4px 20px rgba(0,0,0,.3)",
                fontFamily: "Vazirmatn", fontSize: 13,
                display: "flex", gap: 10, alignItems: "flex-start",
                animation: "fadeIn .2s ease",
              }}>
                <i className="ti ti-circle-x" style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900 }}>{n.message}</div>
                  <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2, direction: "ltr", wordBreak: "break-all" }}>{n.detail}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3 }}>[{n.timestamp}]</div>
                </div>
                <button
                  onClick={() => dismissError(n.id)}
                  style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: "2px 4px", flexShrink: 0, fontSize: 14 }}
                  title="بستن"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: "1rem" }}>

          {/* ANALYTICS */}
          {section === "analytics" && stats && (
            <>
              {(() => {
                const revChange = analyticsData?.revenueChange ?? 0;
                const ordChange = analyticsData?.ordersChange ?? 0;
                const cards = [
                  { icon: "ti-currency-dollar", color: "var(--primary)", val: `${Math.round(stats.totalRevenue / 1_000_000)}M`, label: "فروش کل (تومان)", change: revChange === 0 ? "—" : `${revChange > 0 ? "+" : ""}${revChange}٪ vs ماه قبل`, up: revChange >= 0 },
                  { icon: "ti-package", color: "#1a7a4a", val: stats.monthOrders, label: "سفارشات این ماه", change: ordChange === 0 ? "—" : `${ordChange > 0 ? "+" : ""}${ordChange}٪ vs ماه قبل`, up: ordChange >= 0 },
                  { icon: "ti-users", color: "var(--accent)", val: stats.totalUsers, label: "کاربران ثبت‌نام", change: `+${stats.todayUsers} امروز`, up: true },
                  { icon: "ti-eye", color: "#c0392b", val: stats.todayVisits, label: "بازدید امروز (لاگ)", change: stats.todayVisits > 0 ? "داده واقعی" : "—", up: true },
                ];
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem", marginBottom: "1.5rem" }}>
                    {cards.map((s, i) => (
                      <div key={i} style={{ background: "#fff", borderRadius: "var(--radius)", padding: "1.5rem", boxShadow: "var(--shadow)", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: s.color }}>
                          <i className={`ti ${s.icon}`} style={{ fontSize: 26, color: "#fff" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 26, fontWeight: 900, color: "var(--primary)", lineHeight: 1 }}>{s.val}</div>
                          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4, fontWeight: 700 }}>{s.label}</div>
                          <div style={{ fontSize: 11, fontWeight: 900, marginTop: 6, color: s.up ? "#1a7a4a" : "#c0392b" }}>
                            <i className={`ti ${s.up ? "ti-trending-up" : "ti-trending-down"}`} /> {s.change}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Bar chart — real 7-day sales */}
              <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", marginBottom: "1.5rem" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-chart-line" /> فروش ۷ روز اخیر (تومان)
                  </div>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  {!analyticsData ? (
                    <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}>در حال بارگذاری...</div>
                  ) : (() => {
                    const maxVal = Math.max(...(analyticsData?.chart ?? []).map(d => d.value), 1);
                    return (
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                        {(analyticsData?.chart ?? []).map((d, i) => {
                          const pct = Math.round((d.value / maxVal) * 100);
                          return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                              <span style={{ fontSize: 10, color: "var(--primary)", fontWeight: 900 }}>
                                {d.value > 0 ? `${(d.value / 1_000_000).toFixed(1)}M` : "—"}
                              </span>
                              <div style={{ width: "100%", background: "var(--primary)", borderRadius: "4px 4px 0 0", height: `${Math.max(pct, d.value > 0 ? 4 : 2)}%`, minHeight: 2, opacity: d.value === 0 ? 0.15 : 1 }} />
                              <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700 }}>{d.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Recent activity — real DB data */}
              <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-clock-hour-4" /> آخرین فعالیت‌ها
                  </div>
                </div>
                <div style={{ padding: 0 }}>
                  {!analyticsData ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)" }}>در حال بارگذاری...</div>
                  ) : (analyticsData?.activity ?? []).length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)" }}>هنوز فعالیتی ثبت نشده است</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>
                          {["کاربر", "عملیات", "جزئیات", "زمان"].map((h) => (
                            <th key={h} style={{ background: "var(--bg)", padding: "10px 12px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(analyticsData?.activity ?? []).map((row, i) => (
                          <tr key={row.id + i} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 700 }}>{row.user || "کاربر ناشناس"}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <span className={row.typeClass} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{row.typeLabel}</span>
                            </td>
                            <td style={{ padding: "10px 12px", direction: "ltr", color: "var(--text3)" }}>{row.detail}</td>
                            <td style={{ padding: "10px 12px", color: "var(--text3)", fontSize: 12 }}>
                              {new Date(row.createdAt).toLocaleString("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {/* USERS */}
          {section === "users" && <UserManager />}

          {/* PRODUCTS ADMIN */}
          {section === "products" && (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem" }}>
                <input
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="جستجو نام محصول..."
                  style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, color: "var(--text)", outline: "none", maxWidth: 300 }}
                />
                <button onClick={() => { setEditProductId(undefined); setSection("product-form"); }} style={{ marginRight: "auto", background: "var(--primary)", color: "#fff", border: "none", padding: "9px 16px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <i className="ti ti-plus" /> محصول جدید
                </button>
                <button style={{ background: "var(--bg)", color: "var(--text2)", border: "1px solid var(--border)", padding: "9px 16px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <i className="ti ti-file-export" /> خروجی Excel
                </button>
              </div>
              <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["", "محصول", "دسته‌بندی", "برند", "قیمت", "موجودی", "وضعیت", "عملیات"].map((h) => (
                        <th key={h} style={{ background: "var(--bg)", padding: "10px 12px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(productSearch.toLowerCase())).map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 12px" }}><input type="checkbox" /></td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 900 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text3)" }}>{p.sku}</div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>{p.category?.name ?? "—"}</td>
                        <td style={{ padding: "10px 12px" }}>{p.brand?.name ?? "—"}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 900 }}>{formatPrice(p.price)}</td>
                        <td style={{ padding: "10px 12px" }}>{p.stockQty}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span className={p.status === "PUBLISHED" ? "pill-green" : p.status === "DRAFT" ? "pill-orange" : "pill-gray"} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>
                            {p.status === "PUBLISHED" ? "منتشر" : p.status === "DRAFT" ? "پیش‌نویس" : "آرشیو"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", display: "flex", gap: 4 }}>
                          <button
                            onClick={() => { setEditProductId(p.id); setSection("product-form"); }}
                            style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "Vazirmatn", color: "var(--text2)" }}
                          >
                            <i className="ti ti-edit" /> ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            disabled={deletingId === p.id}
                            style={{ background: "#fdecea", border: "1px solid #f5c6cb", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: deletingId === p.id ? "not-allowed" : "pointer", fontFamily: "Vazirmatn", color: "#c0392b", opacity: deletingId === p.id ? .6 : 1 }}
                          >
                            <i className="ti ti-trash" /> {deletingId === p.id ? "حذف..." : "حذف"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>{productSearch ? `محصولی با نام "${productSearch}" یافت نشد` : "محصولی یافت نشد"}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* PRODUCT FORM */}
          {section === "product-form" && (
            <ProductForm
              productId={editProductId}
              onSuccess={handleProductFormSuccess}
              onCancel={() => setSection("products")}
            />
          )}

          {/* CATEGORIES ADMIN */}
          {section === "categories" && <CategoryManager />}

          {/* ORDERS ADMIN */}
          {section === "orders-admin" && <OrderManager />}

          {/* BLOG ADMIN */}
          {section === "blog-admin" && <BlogManager />}

          {section === "media" && <MediaLibrary />}

          {section === "finance" && <FinanceManager />}

          {section === "coupons" && <CouponManager />}

          {section === "notifications-admin" && <NotificationManager />}

          {section === "comments" && <CommentManager />}

          {section === "newsletter" && <NewsletterManager />}

          {section === "settings-general" && <SettingsManager tab="general" />}
          {section === "settings-payment" && <SettingsManager tab="payment" />}
          {section === "settings-seo" && <SettingsManager tab="seo" />}
          {section === "settings-security" && <SettingsManager tab="security" />}

          {section === "backup" && <BackupManager />}

          {section === "logs" && <LogsManager />}

          {section === "sessions" && <SessionsManager />}

          {section === "roles" && <RolesManager />}

          {section === "trash" && <TrashManager />}

          {section === "returns" && <ReturnsManager />}

          {section === "maintenance" && <MaintenanceManager />}

          {section === "migration" && <MigrationManager />}

          {section === "cms" && <CmsManager />}

          {section === "brands" && <BrandManager />}

          {section === "slider" && <SliderManager />}

          {section === "flashdeal" && <FlashDealManager />}

          {/* Generic placeholder for other sections */}
          {!["analytics", "users", "products", "product-form", "orders-admin", "categories", "blog-admin", "media", "finance", "coupons", "notifications-admin", "comments", "newsletter", "settings-general", "settings-payment", "settings-seo", "settings-security", "backup", "logs", "sessions", "roles", "trash", "returns", "maintenance", "migration", "cms", "brands", "slider", "flashdeal"].includes(section) && (
            <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "3rem", textAlign: "center", color: "var(--text3)" }}>
              <i className="ti ti-tool" style={{ fontSize: 48, display: "block", marginBottom: 12 }} />
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--primary)", marginBottom: 8 }}>بخش {titleMap[section]}</h3>
              <p>این بخش در حال توسعه است.</p>
            </div>
          )}

        </div>
      </main>

      {/* Sidebar overlay — mobile only */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  );
}
