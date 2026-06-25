"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminNotif } from "@/components/admin/AdminNotifProvider";
import { RevenueAreaChart, OrderStatusDonut, KpiSparkline } from "@/components/admin/DashboardCharts";

interface Stats {
  totalOrders: number; monthOrders: number; totalUsers: number; todayUsers: number;
  totalRevenue: number; monthRevenue: number; pendingOrders: number; todayVisits: number;
  pendingReviews: number; pendingBlogPosts: number;
}
interface ChartDay { label: string; value: number; isFriday?: boolean; isFuture?: boolean; }
interface DashboardExtra {
  revenue: { today: number; week: number; month: number };
  topProducts: { id: string; name: string; totalSold: number; totalRevenue: number; images?: { url: string }[] }[];
  topCustomers: { id: string; name?: string; email?: string; orderCount: number; totalSpent: number }[];
}
interface ActivityItem {
  id: string; user: string; type: string; typeLabel: string; typeClass: string; detail: string; createdAt: string;
}
interface AnalyticsData {
  chart: ChartDay[];
  activity: ActivityItem[];
  revenueChange: number;
  ordersChange: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { counts } = useAdminNotif();

  const [stats, setStats] = useState<Stats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dashboardExtra, setDashboardExtra] = useState<DashboardExtra | null>(null);
  const [dashMounted, setDashMounted] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string[] | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.text()).then(t => { try { if (t) setStats(JSON.parse(t)); } catch { /* ignore */ } }).catch(() => {});

    setDashMounted(false);
    const mt = setTimeout(() => setDashMounted(true), 80);

    fetch("/api/admin/analytics").then(r => r.text()).then(t => { try { if (t) setAnalyticsData(JSON.parse(t)); } catch { /* ignore */ } }).catch(() => {});
    fetch("/api/admin/analytics/dashboard").then(r => r.text()).then(t => { try { if (t) setDashboardExtra(JSON.parse(t)); } catch { /* ignore */ } }).catch(() => {});

    return () => clearTimeout(mt);
  }, []);

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? "#1a7a4a" : "#c0392b", color: "#fff", padding: "12px 28px", borderRadius: 10, fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, zIndex: 9999, boxShadow: "0 6px 24px rgba(0,0,0,.25)", display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
          <i className={`ti ${toast.type === "success" ? "ti-circle-check" : "ti-circle-x"}`} style={{ fontSize: 18 }} />
          {toast.msg}
        </div>
      )}

      {/* ── Seed Banner ── */}
      {seedResult ? (
        <div className="admin-card" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderRight: "4px solid #1a7a4a" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#1a7a4a", marginBottom: 6 }}>✅ داده‌های آزمایشی با موفقیت ایجاد شدند</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
              {seedResult.map((r, i) => <span key={i} style={{ fontSize: 11, color: "var(--text3)" }}>{r}</span>)}
            </div>
          </div>
          <button onClick={() => { setSeedResult(null); setAnalyticsData(null); setDashboardExtra(null); window.location.reload(); }}
            style={{ background: "#1a7a4a", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            <i className="ti ti-refresh" /> بارگذاری مجدد
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={async () => {
            setSeeding(true);
            try {
              const res = await fetch("/api/admin/dev-seed-full", { method: "POST" });
              const d = await res.json();
              if (res.ok) { setSeedResult(d.summary ?? ["انجام شد"]); }
              else showToast("error", d.error ?? "خطا در seed");
            } catch { showToast("error", "خطای سرور"); }
            finally { setSeeding(false); }
          }} disabled={seeding}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: seeding ? "not-allowed" : "pointer", opacity: seeding ? 0.7 : 1 }}>
            <i className={`ti ${seeding ? "ti-loader" : "ti-database-import"}`} />
            {seeding ? "در حال ساخت داده..." : "ساخت داده آزمایشی (۱۰۰M تومان)"}
          </button>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>محصول، سفارش، کاربر، نظر، لاگ و بقیه بخش‌ها پر می‌شوند</span>
        </div>
      )}

      {!stats ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--text3)", gap: 10, flexDirection: "column" }}>
          <i className="ti ti-loader-2" style={{ fontSize: 32, opacity: 0.4 }} />
          <span style={{ fontSize: 13 }}>در حال بارگذاری آمار...</span>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          {(() => {
            const revChange = analyticsData?.revenueChange ?? 0;
            const ordChange = analyticsData?.ordersChange ?? 0;
            const cards = [
              { icon: "ti-report-money", label: "فروش کل", iconBg: "rgba(10,42,94,0.10)", iconColor: "var(--primary)", badge: revChange !== 0 ? `${revChange > 0 ? "+" : ""}${revChange}٪` : null, badgeUp: revChange >= 0, sub: dashboardExtra ? `امروز: ${Math.round((dashboardExtra.revenue?.today ?? 0) / 1000)}K` : "امروز: —", display: `${Math.round(stats.totalRevenue / 1_000_000)}M`, spark: true },
              { icon: "ti-truck-delivery", label: "سفارشات ماه", iconBg: "rgba(22,163,74,0.10)", iconColor: "#16a34a", badge: ordChange !== 0 ? `${ordChange > 0 ? "+" : ""}${ordChange}٪` : null, badgeUp: ordChange >= 0, sub: `${stats.pendingOrders} در انتظار`, display: stats.monthOrders.toLocaleString("fa-IR"), spark: false },
              { icon: "ti-users", label: "کاربران ثبت‌نام", iconBg: "rgba(232,146,10,0.10)", iconColor: "var(--accent)", badge: `+${stats.todayUsers}`, badgeUp: true, sub: "امروز جدید", display: stats.totalUsers.toLocaleString("fa-IR"), spark: false },
              { icon: "ti-eye", label: "بازدید امروز", iconBg: "rgba(192,57,43,0.09)", iconColor: "#c0392b", badge: null, badgeUp: true, sub: "لحظه‌ای", display: stats.todayVisits.toLocaleString("fa-IR"), spark: false },
            ];
            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
                {cards.map((c, i) => (
                  <div key={i} className="admin-stat fin-kpi-card" style={{ animationDelay: `${i * 0.07}s` }}>
                    {c.spark && (analyticsData?.chart?.length ?? 0) > 0 && (
                      <div style={{ position: "absolute", top: 14, left: 14, zIndex: 1, opacity: 0.9 }}>
                        <KpiSparkline data={analyticsData!.chart} color={c.iconColor} />
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, position: "relative", zIndex: 1 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className={`ti ${c.icon}`} style={{ fontSize: 17, color: c.iconColor }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700 }}>{c.label}</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "var(--primary)", lineHeight: 1, marginBottom: 10, position: "relative", zIndex: 1 }}>{c.display}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)", position: "relative", zIndex: 1 }}>
                      {c.badge && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 900, color: c.badgeUp ? "#16a34a" : "#dc2626", background: c.badgeUp ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)", padding: "2px 8px", borderRadius: 20 }}>
                          <i className={`ti ${c.badgeUp ? "ti-trending-up" : "ti-trending-down"}`} style={{ fontSize: 11 }} />{c.badge}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: "var(--text3)", marginRight: c.badge ? 0 : "auto" }}>{c.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── Area Chart ── */}
          <div className="admin-card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(10,42,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-chart-area" style={{ fontSize: 16, color: "var(--primary)" }} />
                  </div>
                  نمای کلی مالی — ۷ روز اخیر
                </div>
                {analyticsData && (
                  <div style={{ display: "flex", gap: 20, marginTop: 8, marginRight: 40, fontSize: 11 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 20, height: 2.5, background: "linear-gradient(90deg,var(--accent),var(--primary))", borderRadius: 2, display: "inline-block" }} />
                      <span style={{ color: "var(--text3)", fontWeight: 700 }}>این هفته</span>
                      <strong style={{ color: "var(--primary)", marginRight: 4 }}>{((analyticsData.chart ?? []).reduce((s, d) => s + d.value, 0) / 1_000_000).toFixed(1)}M</strong>
                    </span>
                    {dashboardExtra?.revenue?.month != null && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 20, height: 2, borderBottom: "2px dashed rgba(74,85,120,0.4)", display: "inline-block" }} />
                        <span style={{ color: "var(--text3)", fontWeight: 700 }}>این ماه</span>
                        <strong style={{ color: "var(--text2)", marginRight: 4 }}>{(dashboardExtra.revenue.month / 1_000_000).toFixed(1)}M</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
              {analyticsData && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 20, background: (analyticsData.revenueChange ?? 0) >= 0 ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)", color: (analyticsData.revenueChange ?? 0) >= 0 ? "#16a34a" : "#dc2626", fontSize: 12, fontWeight: 900 }}>
                  <i className={`ti ${(analyticsData.revenueChange ?? 0) >= 0 ? "ti-trending-up" : "ti-trending-down"}`} style={{ fontSize: 13 }} />
                  {(analyticsData.revenueChange ?? 0) > 0 ? "+" : ""}{analyticsData.revenueChange ?? 0}٪
                </div>
              )}
            </div>

            {!analyticsData ? (
              <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", gap: 8, flexDirection: "column" }}>
                <i className="ti ti-loader-2" style={{ fontSize: 28, opacity: 0.4 }} />
                <span style={{ fontSize: 12 }}>در حال بارگذاری...</span>
              </div>
            ) : (
              <RevenueAreaChart data={analyticsData.chart ?? []} />
            )}
          </div>

          {/* ── Row 2: Revenue + Alerts + Order Status ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>

            {/* Revenue breakdown */}
            <div className="admin-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-cash" style={{ color: "var(--accent)", fontSize: 15 }} /> خلاصه درآمد
              </div>
              {(() => {
                const rows = [
                  { label: "امروز", val: dashboardExtra?.revenue?.today ?? null, color: "#16a34a", icon: "ti-sun" },
                  { label: "این هفته", val: dashboardExtra?.revenue?.week ?? null, color: "var(--primary)", icon: "ti-calendar-week" },
                  { label: "این ماه", val: dashboardExtra?.revenue?.month ?? null, color: "var(--accent)", icon: "ti-calendar-month" },
                ];
                const maxVal = Math.max(...rows.map(r => r.val ?? 0), 1);
                return rows.map((r, idx) => (
                  <div key={idx} style={{ marginBottom: idx < 2 ? 14 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text2)", fontWeight: 700 }}>
                        <i className={`ti ${r.icon}`} style={{ fontSize: 12, color: r.color }} /> {r.label}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 900, color: r.val != null ? r.color : "var(--text3)" }}>
                        {r.val != null ? `${(r.val / 1_000_000).toFixed(1)}M` : "—"}
                      </span>
                    </div>
                    <div style={{ height: 6, background: "rgba(10,42,94,0.07)", borderRadius: 6, overflow: "hidden" }}>
                      <div className="fin-progress-bar"
                        style={{ height: "100%", width: dashMounted && r.val != null ? `${Math.round((r.val / maxVal) * 100)}%` : "0%", background: r.color, borderRadius: 6, transitionDelay: `${0.3 + idx * 0.12}s` }} />
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Alerts */}
            <div className="admin-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-bell-ringing" style={{ color: "#c0392b", fontSize: 15 }} /> نیاز به اقدام
              </div>
              {[
                { icon: "ti-truck-delivery", label: "سفارشات جدید", count: counts.orders, color: "#16a34a", bg: "rgba(22,163,74,0.08)", href: "/admin/orders" },
                { icon: "ti-arrow-back-up", label: "مرجوعی", count: counts.returns, color: "var(--accent)", bg: "rgba(232,146,10,0.08)", href: "/admin/returns" },
                { icon: "ti-terminal-2", label: "لاگ خطا", count: counts.logs, color: "#c0392b", bg: "rgba(192,57,43,0.08)", href: "/admin/logs" },
              ].map((item, idx) => (
                <button key={idx} onClick={() => router.push(item.href)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: item.count > 0 ? item.bg : "rgba(10,42,94,0.025)", border: `1px solid ${item.count > 0 ? item.color + "30" : "var(--border)"}`, borderRadius: 10, marginBottom: idx < 2 ? 8 : 0, cursor: "pointer", fontFamily: "Vazirmatn", textAlign: "right", transition: "all 0.15s" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: item.count > 0 ? item.color : "rgba(10,42,94,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className={`ti ${item.icon}`} style={{ fontSize: 16, color: item.count > 0 ? "#fff" : "var(--text3)" }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 12, color: "var(--text2)", fontWeight: 700 }}>{item.label}</span>
                  {item.count > 0
                    ? <span style={{ background: item.color, color: "#fff", fontSize: 11, fontWeight: 900, padding: "3px 11px", borderRadius: 12 }}>{item.count}</span>
                    : <span style={{ fontSize: 14, color: "#16a34a" }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Order status */}
            <div className="admin-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-chart-donut" style={{ color: "var(--accent)", fontSize: 15 }} /> وضعیت سفارشات
              </div>
              {(() => {
                const delivered = Math.max(stats.totalOrders - stats.pendingOrders - stats.monthOrders, 0);
                return (
                  <OrderStatusDonut
                    total={stats.totalOrders}
                    slices={[
                      { name: "تحویل شده", value: delivered, color: "#16a34a" },
                      { name: "پردازش", value: stats.monthOrders, color: "var(--primary)" },
                      { name: "در انتظار", value: stats.pendingOrders, color: "var(--accent)" },
                    ]}
                  />
                );
              })()}
            </div>
          </div>

          {/* ── Row 3: Top Products + Recent Activity ── */}
          <div style={{ display: "grid", gridTemplateColumns: dashboardExtra?.topProducts?.length ? "1fr 2fr" : "1fr", gap: "1.25rem" }}>

            {dashboardExtra?.topProducts?.length ? (
              <div className="admin-card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="ti ti-star" style={{ color: "var(--accent)", fontSize: 15 }} /> پرفروش‌ترین
                </div>
                {dashboardExtra.topProducts.slice(0, 5).map((p, idx) => {
                  const maxRev = Math.max(...dashboardExtra.topProducts.slice(0, 5).map(x => x.totalRevenue), 1);
                  const pct = Math.round((p.totalRevenue / maxRev) * 100);
                  return (
                    <div key={p.id} className="fin-factor-row" style={{ marginBottom: idx < 4 ? 11 : 0, animationDelay: `${0.1 + idx * 0.07}s` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: "1px solid var(--border)" }}>
                          {p.images?.[0]?.url
                            ? <img src={p.images[0].url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <i className="ti ti-package" style={{ fontSize: 12, color: "var(--text3)" }} />}
                        </div>
                        <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 900, color: "var(--primary)", flexShrink: 0 }}>{Math.round(p.totalRevenue / 1000).toLocaleString("fa-IR")}K</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(10,42,94,0.07)", borderRadius: 4, overflow: "hidden" }}>
                        <div className="fin-progress-bar" style={{ height: "100%", width: dashMounted ? `${pct}%` : "0%", background: "linear-gradient(90deg,var(--accent),var(--primary))", borderRadius: 4, transitionDelay: `${0.4 + idx * 0.1}s` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Recent Activity */}
            <div className="admin-card" style={{ overflow: "hidden", padding: 0 }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(10,42,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-clock-hour-4" style={{ fontSize: 15, color: "var(--primary)" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)" }}>آخرین فعالیت‌ها</span>
                </div>
                <button onClick={() => router.push("/admin/finance")}
                  style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text3)", fontFamily: "Vazirmatn", fontWeight: 700 }}>
                  مشاهده همه <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
                </button>
              </div>
              {!analyticsData ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)" }}>در حال بارگذاری...</div>
              ) : (analyticsData.activity ?? []).length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)" }}>
                  <i className="ti ti-inbox" style={{ fontSize: 36, display: "block", marginBottom: 8, opacity: 0.35 }} />
                  هنوز فعالیتی ثبت نشده
                </div>
              ) : (
                <div style={{ overflowY: "auto", maxHeight: 320 }}>
                  {analyticsData.activity.map((row, i) => (
                    <div key={row.id + i} className="fin-factor-row"
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(10,42,94,0.05)", animationDelay: `${i * 0.04}s` }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, rgba(10,42,94,0.12), rgba(232,146,10,0.12))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 900, color: "var(--primary)" }}>
                        {(row.user || "ن").charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{row.user || "ناشناس"}</span>
                          <span className={row.typeClass} style={{ fontSize: 9, fontWeight: 900, padding: "1px 7px", borderRadius: 20 }}>{row.typeLabel}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text3)", direction: "ltr", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.detail}</div>
                      </div>
                      <div style={{ fontSize: 9, color: "var(--text3)", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {new Date(row.createdAt).toLocaleString("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
