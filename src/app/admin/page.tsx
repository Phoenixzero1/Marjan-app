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
  | "shipping" | "invoices" | "tax" | "roles" | "api-docs"
  | "product-form";

interface Stats {
  totalOrders: number; monthOrders: number; totalUsers: number; todayUsers: number;
  totalRevenue: number; monthRevenue: number; pendingOrders: number; todayVisits: number;
}

const navGroups = [
  { label: "داشبورد", items: [{ id: "analytics", icon: "ti-chart-bar", label: "آمار و گزارشات" }] },
  { label: "کاربران", items: [{ id: "users", icon: "ti-users", label: "مدیریت کاربران", badge: "۲۴۸" }] },
  {
    label: "محتوا", items: [
      { id: "products", icon: "ti-package", label: "محصولات" },
      { id: "categories", icon: "ti-category", label: "دسته‌بندی‌ها" },
      { id: "blog-admin", icon: "ti-news", label: "بلاگ", badge: "۳" },
      { id: "media", icon: "ti-photo", label: "رسانه‌ها" },
    ],
  },
  {
    label: "فروش", items: [
      { id: "orders-admin", icon: "ti-truck-delivery", label: "سفارشات", badge: "۷" },
      { id: "finance", icon: "ti-report-money", label: "مالی" },
      { id: "coupons", icon: "ti-ticket", label: "تخفیف و کوپن" },
    ],
  },
  {
    label: "سیستم‌های جانبی", items: [
      { id: "notifications-admin", icon: "ti-bell", label: "اطلاع‌رسانی" },
      { id: "comments", icon: "ti-message-circle", label: "نظرات", badge: "۱۲" },
      { id: "newsletter", icon: "ti-mail", label: "خبرنامه" },
    ],
  },
  {
    label: "تنظیمات", items: [
      { id: "settings-general", icon: "ti-settings", label: "عمومی" },
      { id: "settings-payment", icon: "ti-credit-card", label: "درگاه پرداخت" },
      { id: "settings-seo", icon: "ti-search", label: "سئو" },
      { id: "settings-security", icon: "ti-lock", label: "امنیت" },
      { id: "backup", icon: "ti-database", label: "پشتیبان‌گیری" },
      { id: "logs", icon: "ti-terminal-2", label: "لاگ سیستم" },
      { id: "sessions", icon: "ti-device-laptop", label: "نشست‌ها" },
    ],
  },
  {
    label: "دسترسی", items: [
      { id: "roles", icon: "ti-shield-half-filled", label: "نقش‌ها و دسترسی" },
    ],
  },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>("analytics");
  const [stats, setStats] = useState<Stats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [editProductId, setEditProductId] = useState<string | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adminToast, setAdminToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showAdminToast = useCallback((type: "success" | "error", msg: string) => {
    setAdminToast({ type, msg });
    setTimeout(() => setAdminToast(null), 4000);
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
      fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
    }
  }, [status, session, router]);

  useEffect(() => {
    if (section === "products") fetch("/api/admin/products").then((r) => r.json()).then((d) => setProducts(d.products ?? []));
  }, [section]);

  // Reload products list after returning from product form
  const handleProductFormSuccess = useCallback(() => {
    setSection("products");
    fetch("/api/admin/products").then((r) => r.json()).then((d) => setProducts(d.products ?? []));
  }, []);

  if (status === "loading") return <div style={{ textAlign: "center", padding: "5rem" }}>در حال بارگذاری...</div>;

  const titleMap: Record<string, string> = {
    analytics: "آمار و گزارشات", users: "مدیریت کاربران", products: "محصولات",
    categories: "دسته‌بندی‌ها", "orders-admin": "سفارشات", finance: "مالی",
    "blog-admin": "بلاگ", media: "رسانه‌ها", coupons: "تخفیف و کوپن",
    logs: "لاگ سیستم", sessions: "نشست‌ها", "settings-general": "تنظیمات عمومی",
    "settings-payment": "درگاه پرداخت", "settings-seo": "سئو", "settings-security": "امنیت",
    roles: "نقش‌ها و دسترسی", "product-form": "افزودن محصول جدید",
  };

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 64px)", overflow: "hidden" }}>
      {/* Admin Sidebar — sticky on desktop, drawer on mobile */}
      <aside
        className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}
        style={{ width: 240, background: "var(--primary-dark)", flexShrink: 0, display: "flex", flexDirection: "column", position: "sticky", top: 64, height: "calc(100vh - 64px)", overflowY: "auto" }}
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
                {"badge" in item && item.badge && (
                  <span style={{ marginRight: "auto", background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 900, padding: "1px 7px", borderRadius: 10 }}>{item.badge}</span>
                )}
              </div>
            ))}
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <div onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.65)", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: ".5rem 0" }}>
            <i className="ti ti-arrow-right" /> بازگشت به سایت
          </div>
        </div>
      </aside>

      {/* Admin Main */}
      <main className="admin-main" style={{ flex: 1, background: "var(--bg)", overflowY: "auto", minWidth: 0 }}>
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
            <div className="hidden md:block" style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700 }}>مدیر سیستم</div>
            <div style={{ width: 34, height: 34, background: "var(--primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-user" style={{ color: "#fff", fontSize: 16 }} />
            </div>
          </div>
        </div>

        {/* Admin-level toast (delete, etc.) */}
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

        <div style={{ padding: "1rem" }}>

          {/* ANALYTICS */}
          {section === "analytics" && stats && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem", marginBottom: "1.5rem" }}>
                {[
                  { icon: "ti-currency-dollar", color: "var(--primary)", val: `${Math.round(stats.totalRevenue / 1000000)}M`, label: "فروش کل (تومان)", change: "+۱۲٪ این ماه", up: true },
                  { icon: "ti-package", color: "#1a7a4a", val: stats.monthOrders, label: "سفارشات این ماه", change: "+۸٪", up: true },
                  { icon: "ti-users", color: "var(--accent)", val: stats.totalUsers, label: "کاربران ثبت‌نام", change: `+${stats.todayUsers} امروز`, up: true },
                  { icon: "ti-eye", color: "#c0392b", val: stats.todayVisits, label: "بازدید امروز", change: "-۳٪", up: false },
                ].map((s, i) => (
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

              {/* Bar chart */}
              <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", marginBottom: "1.5rem" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-chart-line" /> فروش ۷ روز اخیر
                  </div>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                    {[45, 72, 38, 90, 64, 55, 82].map((h, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 10, color: "var(--primary)", fontWeight: 900 }}>{h}M</span>
                        <div style={{ width: "100%", background: "var(--primary)", borderRadius: "4px 4px 0 0", height: `${h}%`, minHeight: 4 }} />
                        <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700 }}>{["ش", "ی", "د", "س", "چ", "پ", "ج"][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-clock-hour-4" /> آخرین فعالیت‌ها
                  </div>
                </div>
                <div style={{ padding: 0 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        {["کاربر", "عملیات", "جزئیات", "زمان"].map((h) => (
                          <th key={h} style={{ background: "var(--bg)", padding: "10px 12px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { user: "علی رضایی", op: "سفارش جدید", opClass: "pill-green", detail: "ORD-۱۴۰۴-۰۰۱۲", time: "۲ دقیقه پیش" },
                        { user: "مریم کریمی", op: "ثبت‌نام", opClass: "pill-blue", detail: "از طریق گوگل", time: "۸ دقیقه پیش" },
                        { user: "رضا احمدی", op: "بررسی سفارش", opClass: "pill-orange", detail: "ORD-۱۴۰۴-۰۰۱۱", time: "۱۵ دقیقه پیش" },
                        { user: "سیستم", op: "پشتیبان‌گیری", opClass: "pill-gray", detail: "backup_1404_03_30.zip", time: "۱ ساعت پیش" },
                      ].map((row, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 700 }}>{row.user}</td>
                          <td style={{ padding: "10px 12px" }}><span className={row.opClass} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{row.op}</span></td>
                          <td style={{ padding: "10px 12px" }}>{row.detail}</td>
                          <td style={{ padding: "10px 12px", color: "var(--text3)" }}>{row.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                <input placeholder="جستجو نام محصول..." style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, color: "var(--text)", outline: "none", maxWidth: 300 }} />
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
                    {products.map((p) => (
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
                    {products.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>محصولی یافت نشد</td></tr>
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

          {/* Generic placeholder for other sections */}
          {!["analytics", "users", "products", "product-form", "orders-admin", "categories", "blog-admin", "media", "finance", "coupons", "notifications-admin", "comments", "newsletter", "settings-general", "settings-payment", "settings-seo", "settings-security", "backup", "logs", "sessions"].includes(section) && (
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
