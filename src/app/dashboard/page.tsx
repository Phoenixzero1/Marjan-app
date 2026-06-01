"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatPrice, getStatusLabel } from "@/lib/utils";

type DashTab = "overview" | "profile" | "orders" | "settings";

interface Order {
  id: string; orderNumber: string; status: string; totalAmount: number;
  createdAt: string; items: { id: string }[];
  payment?: { status: string } | null;
}

interface Stats { totalOrders: number; pendingOrders: number; totalSpent: number; wishlistCount: number; }

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<DashTab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, totalSpent: 0, wishlistCount: 0 });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/orders?limit=5").then((r) => r.json()).then((d) => {
        const o = d.orders ?? [];
        setOrders(o);
        setStats({
          totalOrders: d.pagination?.total ?? 0,
          pendingOrders: o.filter((x: Order) => ["PENDING", "PROCESSING", "SHIPPED"].includes(x.status)).length,
          totalSpent: o.reduce((s: number, x: Order) => s + x.totalAmount, 0),
          wishlistCount: 0,
        });
      });
    }
  }, [session]);

  if (status === "loading") {
    return <div style={{ textAlign: "center", padding: "5rem", color: "var(--text3)" }}>در حال بارگذاری...</div>;
  }
  if (!session?.user) return null;

  const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 14, padding: "1.5rem", boxShadow: "0 4px 24px rgba(10,42,94,.10)" };

  return (
    <>
      {/* Dashboard Header */}
      <div style={{ background: "linear-gradient(135deg,#071d42,#1a3d7c)", padding: "2rem 2rem 0" }}>
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 54, height: 54, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,.3)" }}>
                <i className="ti ti-user" style={{ fontSize: 26, color: "#fff" }} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: 16, fontWeight: 900, color: "#fff" }}>{session.user.name}</strong>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{session.user.email ?? (session.user as {phone?:string}).phone ?? ""}</span>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.25)", color: "rgba(255,255,255,.8)", padding: "8px 16px", borderRadius: 8, fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <i className="ti ti-logout" /> خروج
            </button>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginTop: "1.25rem", overflowX: "auto" }}>
            {([
              { id: "overview", icon: "ti-layout-dashboard", label: "داشبورد" },
              { id: "profile", icon: "ti-user-edit", label: "پروفایل" },
              { id: "orders", icon: "ti-package", label: "سفارش‌ها" },
              { id: "settings", icon: "ti-settings", label: "تنظیمات" },
            ] as { id: DashTab; icon: string; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: "transparent", border: "none",
                  color: tab === t.id ? "#fff" : "rgba(255,255,255,.6)",
                  padding: "10px 18px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  borderBottom: tab === t.id ? "3px solid var(--accent)" : "3px solid transparent",
                  marginBottom: 0, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                }}
              >
                <i className={`ti ${t.icon}`} /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "2rem auto", padding: "0 2rem" }}>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem", marginBottom: "2rem" }}>
              {[
                { label: "سفارش‌های کل", val: stats.totalOrders, icon: "ti-package", color: "#0a2a5e", sub: "+۲ این ماه" },
                { label: "در حال پردازش", val: stats.pendingOrders, icon: "ti-loader", color: "#e8920a", sub: "در حال ارسال" },
                { label: "مجموع خرید", val: formatPrice(stats.totalSpent), icon: "ti-coin", color: "#1a7a4a", sub: "تومان" },
                { label: "علاقه‌مندی‌ها", val: stats.wishlistCount, icon: "ti-heart", color: "#c0392b", sub: "محصول ذخیره شده" },
              ].map((s) => (
                <div key={s.label} style={{ ...cardStyle, borderRight: `4px solid ${s.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem" }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text3)" }}>{s.label}</span>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 20, color: s.color }} />
                  </div>
                  <strong style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</strong>
                  <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{s.sub}</p>
                </div>
              ))}
            </div>
            <div style={{ ...cardStyle, marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="ti ti-clock-history" /> آخرین سفارش‌ها
                </h3>
                <button onClick={() => setTab("orders")} style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>مشاهده همه ←</button>
              </div>
              {orders.length === 0 ? (
                <p style={{ color: "var(--text3)", textAlign: "center", padding: "2rem" }}>سفارشی ندارید</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--bg2)" }}>
                      {["شماره سفارش", "تاریخ", "مبلغ", "وضعیت"].map((h) => (
                        <th key={h} style={{ textAlign: "right", padding: "8px 10px", fontWeight: 900, color: "var(--text3)", fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 3).map((o) => {
                      const s = getStatusLabel(o.status);
                      return (
                        <tr key={o.id} style={{ borderBottom: "1px solid var(--bg)" }}>
                          <td style={{ padding: 10 }}>{o.orderNumber}</td>
                          <td style={{ padding: 10, color: "var(--text3)" }}>{new Date(o.createdAt).toLocaleDateString("fa-IR")}</td>
                          <td style={{ padding: 10, fontWeight: 900, color: "var(--primary)" }}>{formatPrice(o.totalAmount)}</td>
                          <td style={{ padding: 10 }}><span className={`${s.class}`} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{s.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* PROFILE */}
        {tab === "profile" && (
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.5rem" }}>
            <div style={{ ...cardStyle, textAlign: "center" }}>
              <div style={{ width: 90, height: 90, background: "var(--bg2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", border: "3px solid var(--primary)" }}>
                <i className="ti ti-user" style={{ fontSize: 44, color: "var(--primary)" }} />
              </div>
              <strong style={{ display: "block", fontSize: 15, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>{session.user.name}</strong>
              <span style={{ fontSize: 12, color: "var(--text3)" }}>{session.user.email}</span>
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--bg2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0" }}>
                  <span style={{ color: "var(--text3)" }}>سطح کاربری:</span>
                  <span style={{ fontWeight: 700, color: "var(--accent)" }}>طلایی</span>
                </div>
              </div>
            </div>
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1.5rem" }}>ویرایش اطلاعات</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>نام</label><input defaultValue={session.user.name?.split(" ")[0]} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, width: "100%", outline: "none" }} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>نام خانوادگی</label><input defaultValue={session.user.name?.split(" ").slice(1).join(" ")} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, width: "100%", outline: "none" }} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>ایمیل</label><input type="email" defaultValue={session.user.email ?? ""} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, width: "100%", outline: "none" }} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>شماره موبایل</label><input defaultValue={(session.user as {phone?:string}).phone ?? ""} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, width: "100%", outline: "none" }} /></div>
              </div>
              <button style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "11px 28px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer" }}>
                <i className="ti ti-device-floppy" /> ذخیره تغییرات
              </button>
            </div>
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1.25rem" }}>تاریخچه سفارش‌ها</h3>
            {orders.length === 0 ? (
              <p style={{ color: "var(--text3)", textAlign: "center", padding: "3rem" }}>سفارشی ندارید</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--bg2)" }}>
                    {["شماره سفارش", "تاریخ", "اقلام", "مبلغ", "وضعیت", "عملیات"].map((h) => (
                      <th key={h} style={{ textAlign: "right", padding: "10px", fontWeight: 900, color: "var(--text3)", fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const s = getStatusLabel(o.status);
                    return (
                      <tr key={o.id} style={{ borderBottom: "1px solid var(--bg)" }}>
                        <td style={{ padding: 10, fontWeight: 700 }}>{o.orderNumber}</td>
                        <td style={{ padding: 10, color: "var(--text3)" }}>{new Date(o.createdAt).toLocaleDateString("fa-IR")}</td>
                        <td style={{ padding: 10 }}>{o.items.length} قلم</td>
                        <td style={{ padding: 10, fontWeight: 900, color: "var(--primary)" }}>{formatPrice(o.totalAmount)}</td>
                        <td style={{ padding: 10 }}><span className={s.class} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{s.label}</span></td>
                        <td style={{ padding: 10 }}><button style={{ background: "var(--bg2)", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn", color: "var(--primary)" }}>جزئیات</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-lock" /> تغییر رمز عبور
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["رمز فعلی", "رمز جدید", "تکرار رمز جدید"].map((l) => (
                  <div key={l}><label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>{l}</label><input type="password" placeholder="••••••••" style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, width: "100%", outline: "none" }} /></div>
                ))}
                <button style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "11px 24px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", width: "auto", alignSelf: "flex-start" }}>
                  <i className="ti ti-lock-check" /> تغییر رمز
                </button>
              </div>
            </div>
            <div style={{ ...cardStyle, border: "1.5px solid #fdecea" }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "#c0392b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-alert-triangle" /> ناحیه خطرناک
              </h3>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: "1.25rem", lineHeight: 1.7 }}>این عملیات‌ها برگشت‌پذیر نیستند. با احتیاط ادامه دهید.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => signOut({ callbackUrl: "/" })} style={{ background: "transparent", border: "1.5px solid var(--accent)", color: "var(--accent)", padding: 10, borderRadius: 8, fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <i className="ti ti-logout" /> خروج از همه دستگاه‌ها
                </button>
                <button style={{ background: "#fdecea", border: "1.5px solid #c0392b", color: "#c0392b", padding: 10, borderRadius: 8, fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <i className="ti ti-trash" /> حذف حساب کاربری
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
