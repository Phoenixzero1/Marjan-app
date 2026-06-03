"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatPrice, getStatusLabel } from "@/lib/utils";
import Link from "next/link";

type DashTab = "overview" | "profile" | "orders" | "addresses" | "wishlist" | "notifications" | "settings";

interface Order {
  id: string; orderNumber: string; status: string; totalAmount: number;
  createdAt: string; trackingCode?: string | null;
  items: { id: string; quantity: number; price: number; product?: { name: string } }[];
  payment?: { status: string } | null;
  shippingAddress?: { city: string; address: string } | null;
}

interface Notification {
  id: string; type: string; title: string; body: string; isRead: boolean; link: string | null; createdAt: string;
}

interface Stats { totalOrders: number; pendingOrders: number; totalSpent: number; wishlistCount: number; unreadNotifs: number; }

interface Profile {
  id: string; firstName: string; lastName: string; email: string | null;
  phone: string | null; nationalCode: string | null; companyName: string | null;
  city: string | null; postalCode: string | null; orderCount: number;
}

interface Address {
  id: string; label: string; fullName: string; phone: string;
  province: string; city: string; address: string; postalCode: string; isDefault: boolean;
}

interface WishlistItem {
  id: string;
  product: { id: string; name: string; slug: string; price: number; images: { url: string }[]; brand: { name: string } | null };
}

const inp: React.CSSProperties = {
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13,
  width: "100%", outline: "none", boxSizing: "border-box",
};

const emptyAddr = { label: "خانه", fullName: "", phone: "", province: "", city: "", address: "", postalCode: "", isDefault: false };

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<DashTab>("overview");

  // Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, totalSpent: 0, wishlistCount: 0, unreadNotifs: 0 });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoaded, setNotifLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<Profile>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // UI state
  const [profLoading, setProfLoading] = useState(false);
  const [profMsg, setProfMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [addrLoaded, setAddrLoaded] = useState(false);
  const [wishLoaded, setWishLoaded] = useState(false);
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrForm, setAddrForm] = useState(emptyAddr);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrMsg, setAddrMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, Order>>({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // Initial loads
  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/orders?limit=50")
      .then((r) => r.json())
      .then((d) => {
        const o: Order[] = d.orders ?? [];
        const total: number = d.pagination?.total ?? o.length;
        setOrders(o);
        setStats((prev) => ({
          ...prev,
          totalOrders: total,
          pendingOrders: o.filter((x) => ["PENDING", "PROCESSING", "SHIPPED"].includes(x.status)).length,
          totalSpent: o.filter((x) => x.payment?.status === "PAID").reduce((s, x) => s + x.totalAmount, 0),
        }));
      });

    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.id) { setProfile(d); setProfileForm(d); }
      });

    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => {
        setStats((prev) => ({ ...prev, wishlistCount: (d.items ?? []).length }));
      });

    fetch("/api/user/notifications")
      .then((r) => r.json())
      .then((d) => {
        setStats((prev) => ({ ...prev, unreadNotifs: d.unreadCount ?? 0 }));
      });
  }, [session]);

  const loadNotifications = useCallback(() => {
    if (notifLoaded) return;
    fetch("/api/user/notifications").then((r) => r.json()).then((d) => {
      setNotifications(d.notifications ?? []);
      setNotifLoaded(true);
      setStats((prev) => ({ ...prev, unreadNotifs: d.unreadCount ?? 0 }));
    });
  }, [notifLoaded]);

  const loadAddresses = useCallback(() => {
    if (addrLoaded) return;
    fetch("/api/addresses").then((r) => r.json()).then((d) => {
      setAddresses(d.addresses ?? []);
      setAddrLoaded(true);
    });
  }, [addrLoaded]);

  const loadWishlist = useCallback(() => {
    if (wishLoaded) return;
    fetch("/api/wishlist").then((r) => r.json()).then((d) => {
      setWishlist(d.items ?? []);
      setWishLoaded(true);
    });
  }, [wishLoaded]);

  useEffect(() => {
    if (tab === "addresses") loadAddresses();
    if (tab === "wishlist") loadWishlist();
    if (tab === "notifications") loadNotifications();
  }, [tab, loadAddresses, loadWishlist, loadNotifications]);

  async function markAllRead() {
    await fetch("/api/user/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setStats((prev) => ({ ...prev, unreadNotifs: 0 }));
  }

  async function markRead(id: string) {
    await fetch("/api/user/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setStats((prev) => ({ ...prev, unreadNotifs: Math.max(0, prev.unreadNotifs - 1) }));
  }

  // Profile save
  async function saveProfile() {
    setProfLoading(true); setProfMsg(null);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        nationalCode: profileForm.nationalCode,
        companyName: profileForm.companyName,
        city: profileForm.city,
        postalCode: profileForm.postalCode,
      }),
    });
    const d = await res.json();
    setProfLoading(false);
    if (res.ok) { setProfMsg({ type: "ok", text: "اطلاعات با موفقیت ذخیره شد" }); setProfile((p) => p ? { ...p, ...d } : p); }
    else setProfMsg({ type: "err", text: d.error ?? "خطا در ذخیره‌سازی" });
  }

  // Password change
  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ type: "err", text: "رمزهای جدید مطابقت ندارند" }); return; }
    if (pwForm.next.length < 6) { setPwMsg({ type: "err", text: "رمز جدید حداقل ۶ کاراکتر باشد" }); return; }
    setPwLoading(true); setPwMsg(null);
    const res = await fetch("/api/user/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
    });
    const d = await res.json();
    setPwLoading(false);
    if (res.ok) { setPwMsg({ type: "ok", text: "رمز عبور با موفقیت تغییر یافت" }); setPwForm({ current: "", next: "", confirm: "" }); }
    else setPwMsg({ type: "err", text: d.error ?? "خطا در تغییر رمز" });
  }

  // Address add
  async function saveAddress() {
    setAddrLoading(true); setAddrMsg(null);
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addrForm),
    });
    const d = await res.json();
    setAddrLoading(false);
    if (res.ok) {
      fetch("/api/addresses").then((r) => r.json()).then((x) => setAddresses(x.addresses ?? []));
      setShowAddAddr(false);
      setAddrForm(emptyAddr);
    } else setAddrMsg({ type: "err", text: d.error ?? "خطا در ذخیره آدرس" });
  }

  // Address delete
  async function deleteAddress(id: string) {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  // Remove from wishlist
  async function removeFromWishlist(productId: string) {
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setWishlist((prev) => prev.filter((w) => w.product.id !== productId));
    setStats((prev) => ({ ...prev, wishlistCount: Math.max(0, prev.wishlistCount - 1) }));
  }

  // Order detail expand
  async function toggleOrder(id: string) {
    if (expandedOrder === id) { setExpandedOrder(null); return; }
    setExpandedOrder(id);
    if (!orderDetails[id]) {
      const r = await fetch(`/api/orders/${id}`);
      const d = await r.json();
      if (d.order) setOrderDetails((prev) => ({ ...prev, [id]: d.order }));
    }
  }

  if (status === "loading") return <div style={{ textAlign: "center", padding: "5rem", color: "var(--text3)", fontFamily: "Vazirmatn" }}>در حال بارگذاری...</div>;
  if (!session?.user) return null;

  const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 14, padding: "1.5rem", boxShadow: "0 4px 24px rgba(10,42,94,.10)" };

  const TABS: { id: DashTab; icon: string; label: string; badge?: number }[] = [
    { id: "overview", icon: "ti-layout-dashboard", label: "داشبورد" },
    { id: "profile", icon: "ti-user-edit", label: "پروفایل" },
    { id: "orders", icon: "ti-package", label: "سفارش‌ها" },
    { id: "addresses", icon: "ti-map-pin", label: "آدرس‌ها" },
    { id: "wishlist", icon: "ti-heart", label: "علاقه‌مندی‌ها" },
    { id: "notifications", icon: "ti-bell", label: "اعلان‌ها", badge: stats.unreadNotifs || undefined },
    { id: "settings", icon: "ti-settings", label: "تنظیمات" },
  ];

  return (
    <>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#071d42,#1a3d7c)", padding: "2rem 2rem 0" }}>
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 54, height: 54, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,.3)", overflow: "hidden" }}>
                {session.user.image
                  ? <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <i className="ti ti-user" style={{ fontSize: 26, color: "#fff" }} />}
              </div>
              <div>
                <strong style={{ display: "block", fontSize: 16, fontWeight: 900, color: "#fff" }}>{session.user.name}</strong>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{session.user.email ?? (session.user as { phone?: string }).phone ?? ""}</span>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.25)", color: "rgba(255,255,255,.8)", padding: "8px 16px", borderRadius: 8, fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <i className="ti ti-logout" /> خروج
            </button>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: "1.25rem", overflowX: "auto" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: "transparent", border: "none",
                  color: tab === t.id ? "#fff" : "rgba(255,255,255,.6)",
                  padding: "10px 16px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  borderBottom: tab === t.id ? "3px solid var(--accent)" : "3px solid transparent",
                  display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", position: "relative",
                }}
              >
                <i className={`ti ${t.icon}`} /> {t.label}
                {t.badge ? (
                  <span style={{ background: "var(--accent)", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 900, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "2rem auto", padding: "0 2rem" }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem", marginBottom: "2rem" }}>
              {[
                { label: "سفارش‌های کل", val: stats.totalOrders, icon: "ti-package", color: "#0a2a5e", sub: "سفارش ثبت شده" },
                { label: "در حال پردازش", val: stats.pendingOrders, icon: "ti-loader", color: "#e8920a", sub: "در حال پیگیری" },
                { label: "مجموع خرید", val: formatPrice(stats.totalSpent), icon: "ti-coin", color: "#1a7a4a", sub: "مبلغ پرداخت‌شده" },
                { label: "اعلان‌های خوانده‌نشده", val: stats.unreadNotifs, icon: "ti-bell", color: "#7c3aed", sub: "پیام جدید" },
              ].map((s) => (
                <div key={s.label} style={{ ...cardStyle, borderRight: `4px solid ${s.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem" }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text3)" }}>{s.label}</span>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 20, color: s.color }} />
                  </div>
                  <strong style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.val}</strong>
                  <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{s.sub}</p>
                </div>
              ))}
            </div>
            <div style={{ ...cardStyle }}>
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
                    {orders.slice(0, 5).map((o) => {
                      const s = getStatusLabel(o.status);
                      return (
                        <tr key={o.id} style={{ borderBottom: "1px solid var(--bg)" }}>
                          <td style={{ padding: 10, fontWeight: 700 }}>{o.orderNumber}</td>
                          <td style={{ padding: 10, color: "var(--text3)" }}>{new Date(o.createdAt).toLocaleDateString("fa-IR")}</td>
                          <td style={{ padding: 10, fontWeight: 900, color: "var(--primary)" }}>{formatPrice(o.totalAmount)}</td>
                          <td style={{ padding: 10 }}><span className={s.class} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{s.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.5rem" }}>
            <div style={{ ...cardStyle, textAlign: "center" }}>
              <div style={{ width: 90, height: 90, background: "var(--bg2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", border: "3px solid var(--primary)", overflow: "hidden" }}>
                {session.user.image
                  ? <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <i className="ti ti-user" style={{ fontSize: 44, color: "var(--primary)" }} />}
              </div>
              <strong style={{ display: "block", fontSize: 15, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>{session.user.name}</strong>
              <span style={{ fontSize: 12, color: "var(--text3)" }}>{session.user.email}</span>
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--bg2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0" }}>
                  <span style={{ color: "var(--text3)" }}>سفارش‌ها:</span>
                  <span style={{ fontWeight: 700 }}>{profile?.orderCount ?? 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0" }}>
                  <span style={{ color: "var(--text3)" }}>شهر:</span>
                  <span style={{ fontWeight: 700 }}>{profile?.city ?? "—"}</span>
                </div>
              </div>
            </div>
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1.5rem" }}>ویرایش اطلاعات</h3>
              {profMsg && (
                <div style={{ background: profMsg.type === "ok" ? "#f0fdf4" : "#fdf0f0", border: `1px solid ${profMsg.type === "ok" ? "#bbf7d0" : "#f5c6c6"}`, color: profMsg.type === "ok" ? "#15803d" : "#c0392b", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, marginBottom: "1rem" }}>
                  {profMsg.text}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                {([
                  { key: "firstName", label: "نام" },
                  { key: "lastName", label: "نام خانوادگی" },
                  { key: "email", label: "ایمیل", type: "email" },
                  { key: "phone", label: "شماره موبایل", readOnly: true },
                  { key: "nationalCode", label: "کد ملی" },
                  { key: "companyName", label: "نام شرکت" },
                  { key: "city", label: "شهر" },
                  { key: "postalCode", label: "کد پستی" },
                ] as { key: keyof Profile; label: string; type?: string; readOnly?: boolean }[]).map(({ key, label, type, readOnly }) => (
                  <div key={key}>
                    <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>{label}</label>
                    <input
                      type={type ?? "text"}
                      value={(profileForm[key] as string) ?? ""}
                      readOnly={readOnly}
                      onChange={(e) => setProfileForm((f) => ({ ...f, [key]: e.target.value || null }))}
                      style={{ ...inp, background: readOnly ? "var(--bg2)" : "#fff", color: readOnly ? "var(--text3)" : "inherit" }}
                      dir={key === "email" ? "ltr" : undefined}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={saveProfile}
                disabled={profLoading}
                style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "11px 28px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", cursor: profLoading ? "not-allowed" : "pointer", opacity: profLoading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}
              >
                <i className="ti ti-device-floppy" /> {profLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
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
                    const isOpen = expandedOrder === o.id;
                    const detail = orderDetails[o.id];
                    return (
                      <>
                        <tr key={o.id} style={{ borderBottom: isOpen ? "none" : "1px solid var(--bg)" }}>
                          <td style={{ padding: 10, fontWeight: 700 }}>{o.orderNumber}</td>
                          <td style={{ padding: 10, color: "var(--text3)" }}>{new Date(o.createdAt).toLocaleDateString("fa-IR")}</td>
                          <td style={{ padding: 10 }}>{o.items.length} قلم</td>
                          <td style={{ padding: 10, fontWeight: 900, color: "var(--primary)" }}>{formatPrice(o.totalAmount)}</td>
                          <td style={{ padding: 10 }}><span className={s.class} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{s.label}</span></td>
                          <td style={{ padding: 10 }}>
                            <button
                              onClick={() => toggleOrder(o.id)}
                              style={{ background: isOpen ? "var(--primary)" : "var(--bg2)", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn", color: isOpen ? "#fff" : "var(--primary)", display: "flex", alignItems: "center", gap: 4 }}
                            >
                              <i className={`ti ${isOpen ? "ti-chevron-up" : "ti-chevron-down"}`} />
                              {isOpen ? "بستن" : "جزئیات"}
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr key={`${o.id}-detail`}>
                            <td colSpan={6} style={{ padding: 0, borderBottom: "1px solid var(--bg)" }}>
                              <div style={{ background: "var(--bg)", padding: "1rem 1.25rem", borderTop: "1px solid var(--border)" }}>
                                {!detail ? (
                                  <div style={{ color: "var(--text3)", fontSize: 13 }}>در حال بارگذاری...</div>
                                ) : (
                                  <>
                                    {/* Status timeline */}
                                    {(() => {
                                      const steps = [
                                        { key: "PENDING", label: "ثبت سفارش", icon: "ti-shopping-cart" },
                                        { key: "CONFIRMED", label: "تأیید شده", icon: "ti-check" },
                                        { key: "PROCESSING", label: "در حال پردازش", icon: "ti-tool" },
                                        { key: "SHIPPED", label: "ارسال شده", icon: "ti-truck" },
                                        { key: "DELIVERED", label: "تحویل داده شده", icon: "ti-package" },
                                      ];
                                      const currentIdx = steps.findIndex((s) => s.key === o.status);
                                      return (
                                        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 14, overflowX: "auto" }}>
                                          {steps.map((step, idx) => {
                                            const done = currentIdx >= idx;
                                            const active = currentIdx === idx;
                                            return (
                                              <div key={step.key} style={{ display: "flex", alignItems: "center", flex: idx < steps.length - 1 ? "1" : "none" }}>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: done ? "var(--primary)" : "var(--bg2)", border: `2px solid ${done ? "var(--primary)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: active ? "0 0 0 3px rgba(26,61,124,.2)" : "none" }}>
                                                    <i className={`ti ${step.icon}`} style={{ fontSize: 14, color: done ? "#fff" : "var(--text3)" }} />
                                                  </div>
                                                  <span style={{ fontSize: 9, fontWeight: 700, color: done ? "var(--primary)" : "var(--text3)", whiteSpace: "nowrap", textAlign: "center" }}>{step.label}</span>
                                                </div>
                                                {idx < steps.length - 1 && (
                                                  <div style={{ flex: 1, height: 2, background: currentIdx > idx ? "var(--primary)" : "var(--border)", margin: "0 4px", marginBottom: 20 }} />
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}

                                    {/* Tracking code */}
                                    {(detail.trackingCode || o.trackingCode) && (
                                      <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: "var(--radius-sm)", padding: "8px 12px", marginBottom: 10, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                        <i className="ti ti-truck" style={{ color: "var(--accent)" }} />
                                        <span style={{ fontWeight: 700, color: "var(--text2)" }}>کد رهگیری:</span>
                                        <span style={{ fontFamily: "monospace", fontWeight: 900, color: "var(--accent)", letterSpacing: 1 }}>{detail.trackingCode ?? o.trackingCode}</span>
                                      </div>
                                    )}

                                    {detail.shippingAddress && (
                                      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
                                        <i className="ti ti-map-pin" style={{ marginLeft: 4, color: "var(--primary)" }} />
                                        {detail.shippingAddress.city} — {detail.shippingAddress.address}
                                      </div>
                                    )}
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                      <thead>
                                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                          {["محصول", "تعداد", "قیمت واحد", "جمع"].map((h) => (
                                            <th key={h} style={{ textAlign: "right", padding: "6px 8px", fontWeight: 900, color: "var(--text3)" }}>{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {detail.items.map((item) => (
                                          <tr key={item.id} style={{ borderBottom: "1px solid var(--bg2)" }}>
                                            <td style={{ padding: "6px 8px", fontWeight: 700 }}>{item.product?.name ?? "محصول"}</td>
                                            <td style={{ padding: "6px 8px" }}>{item.quantity}</td>
                                            <td style={{ padding: "6px 8px" }}>{formatPrice(item.price)}</td>
                                            <td style={{ padding: "6px 8px", fontWeight: 900, color: "var(--primary)" }}>{formatPrice(item.price * item.quantity)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── ADDRESSES ── */}
        {tab === "addresses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)" }}>آدرس‌های من</h3>
              <button
                onClick={() => { setShowAddAddr(true); setAddrMsg(null); }}
                style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "9px 18px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                <i className="ti ti-plus" /> افزودن آدرس
              </button>
            </div>

            {showAddAddr && (
              <div style={{ ...cardStyle, marginBottom: "1.5rem", border: "1.5px solid var(--primary)" }}>
                <h4 style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: "1rem" }}>آدرس جدید</h4>
                {addrMsg && (
                  <div style={{ background: "#fdf0f0", border: "1px solid #f5c6c6", color: "#c0392b", padding: "9px 13px", borderRadius: "var(--radius-sm)", fontSize: 13, marginBottom: "1rem" }}>
                    {addrMsg.text}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  {([
                    { key: "label", label: "برچسب (مثلاً: خانه، محل کار)" },
                    { key: "fullName", label: "نام و نام خانوادگی گیرنده" },
                    { key: "phone", label: "شماره موبایل گیرنده" },
                    { key: "province", label: "استان" },
                    { key: "city", label: "شهر" },
                    { key: "postalCode", label: "کد پستی (۱۰ رقم)" },
                  ] as { key: keyof typeof emptyAddr; label: string }[]).map(({ key, label }) => (
                    <div key={key}>
                      <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 4 }}>{label}</label>
                      <input
                        value={addrForm[key] as string}
                        onChange={(e) => setAddrForm((f) => ({ ...f, [key]: e.target.value }))}
                        style={inp}
                      />
                    </div>
                  ))}
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 4 }}>آدرس کامل</label>
                    <input
                      value={addrForm.address}
                      onChange={(e) => setAddrForm((f) => ({ ...f, address: e.target.value }))}
                      style={inp}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" id="isDefault" checked={addrForm.isDefault} onChange={(e) => setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))} />
                    <label htmlFor="isDefault" style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", cursor: "pointer" }}>آدرس پیش‌فرض</label>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={saveAddress}
                    disabled={addrLoading}
                    style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "10px 22px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", cursor: addrLoading ? "not-allowed" : "pointer" }}
                  >
                    {addrLoading ? "در حال ذخیره..." : "ذخیره"}
                  </button>
                  <button
                    onClick={() => { setShowAddAddr(false); setAddrForm(emptyAddr); setAddrMsg(null); }}
                    style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text2)", padding: "10px 18px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer" }}
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}

            {addresses.length === 0 && !showAddAddr ? (
              <div style={{ ...cardStyle, textAlign: "center", color: "var(--text3)", padding: "3rem" }}>
                <i className="ti ti-map-pin-off" style={{ fontSize: 40, display: "block", marginBottom: 10 }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>آدرسی ثبت نشده</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {addresses.map((addr) => (
                  <div key={addr.id} style={{ ...cardStyle, position: "relative", border: addr.isDefault ? "2px solid var(--primary)" : "1.5px solid var(--border)" }}>
                    {addr.isDefault && (
                      <span style={{ position: "absolute", top: 12, left: 12, background: "var(--primary)", color: "#fff", fontSize: 10, fontWeight: 900, padding: "2px 10px", borderRadius: 20 }}>پیش‌فرض</span>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <i className="ti ti-map-pin" style={{ fontSize: 18, color: "var(--primary)" }} />
                      <strong style={{ fontSize: 14, fontWeight: 900, color: "var(--text)" }}>{addr.label}</strong>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
                      <div>{addr.fullName} — {addr.phone}</div>
                      <div>{addr.province}، {addr.city}</div>
                      <div>{addr.address}</div>
                      <div style={{ color: "var(--text3)", fontSize: 12 }}>کد پستی: {addr.postalCode}</div>
                    </div>
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      style={{ marginTop: 12, background: "transparent", border: "1px solid #f5c6c6", color: "#c0392b", padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <i className="ti ti-trash" /> حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WISHLIST ── */}
        {tab === "wishlist" && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1.25rem" }}>
              علاقه‌مندی‌ها ({wishlist.length})
            </h3>
            {wishlist.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: "center", color: "var(--text3)", padding: "3rem" }}>
                <i className="ti ti-heart-off" style={{ fontSize: 40, display: "block", marginBottom: 10 }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>محصولی در علاقه‌مندی‌ها نیست</div>
                <Link href="/products" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700, display: "block", marginTop: 8 }}>
                  مشاهده محصولات →
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem" }}>
                {wishlist.map((item) => (
                  <div key={item.id} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                    <Link href={`/products/${item.product.slug}`} style={{ textDecoration: "none", display: "block" }}>
                      <div style={{ aspectRatio: "1/1", background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {item.product.images[0] ? (
                          <img src={item.product.images[0].url} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <i className="ti ti-package" style={{ fontSize: 40, color: "var(--border)" }} />
                        )}
                      </div>
                    </Link>
                    <div style={{ padding: "1rem" }}>
                      {item.product.brand && (
                        <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, marginBottom: 4 }}>{item.product.brand.name}</div>
                      )}
                      <Link href={`/products/${item.product.slug}`} style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", textDecoration: "none", lineHeight: 1.4, display: "block", marginBottom: 8 }}>
                        {item.product.name}
                      </Link>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: 10 }}>{formatPrice(item.product.price)}</div>
                      <button
                        onClick={() => removeFromWishlist(item.product.id)}
                        style={{ width: "100%", background: "transparent", border: "1px solid #f5c6c6", color: "#c0392b", padding: "7px", borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                      >
                        <i className="ti ti-heart-broken" /> حذف از علاقه‌مندی‌ها
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === "notifications" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)" }}>
                اعلان‌ها {stats.unreadNotifs > 0 && <span style={{ background: "var(--accent)", color: "#fff", borderRadius: 10, fontSize: 11, padding: "1px 8px", marginRight: 6 }}>{stats.unreadNotifs} جدید</span>}
              </h3>
              {stats.unreadNotifs > 0 && (
                <button onClick={markAllRead} style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <i className="ti ti-checks" /> علامت‌گذاری همه به‌عنوان خوانده‌شده
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: "center", color: "var(--text3)", padding: "3rem" }}>
                <i className="ti ti-bell-off" style={{ fontSize: 40, display: "block", marginBottom: 10 }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>اعلانی ندارید</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      ...cardStyle,
                      padding: "1rem 1.25rem",
                      display: "flex", alignItems: "flex-start", gap: 12,
                      background: n.isRead ? "#fff" : "#eff6ff",
                      border: n.isRead ? "1.5px solid transparent" : "1.5px solid #bfdbfe",
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: n.isRead ? "var(--bg2)" : "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className={`ti ${n.type === "ORDER_UPDATE" ? "ti-package" : n.type === "PAYMENT" ? "ti-coin" : "ti-bell"}`} style={{ fontSize: 16, color: n.isRead ? "var(--text3)" : "#fff" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 3 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{n.body}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
                        {new Date(n.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {!n.isRead && (
                      <button onClick={() => markRead(n.id)} style={{ background: "transparent", border: "none", color: "var(--primary)", fontSize: 11, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", flexShrink: 0, padding: "4px 8px" }}>
                        خواندم
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-lock" /> تغییر رمز عبور
              </h3>
              {pwMsg && (
                <div style={{ background: pwMsg.type === "ok" ? "#f0fdf4" : "#fdf0f0", border: `1px solid ${pwMsg.type === "ok" ? "#bbf7d0" : "#f5c6c6"}`, color: pwMsg.type === "ok" ? "#15803d" : "#c0392b", padding: "9px 13px", borderRadius: "var(--radius-sm)", fontSize: 13, marginBottom: "1rem" }}>
                  {pwMsg.text}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {([
                  { key: "current", label: "رمز فعلی" },
                  { key: "next", label: "رمز جدید" },
                  { key: "confirm", label: "تکرار رمز جدید" },
                ] as { key: keyof typeof pwForm; label: string }[]).map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>{label}</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={pwForm[key]}
                      onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                      style={inp}
                    />
                  </div>
                ))}
                <button
                  onClick={changePassword}
                  disabled={pwLoading}
                  style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "11px 24px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", cursor: pwLoading ? "not-allowed" : "pointer", width: "auto", alignSelf: "flex-start", opacity: pwLoading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <i className="ti ti-lock-check" /> {pwLoading ? "در حال تغییر..." : "تغییر رمز"}
                </button>
              </div>
            </div>
            <div style={{ ...cardStyle, border: "1.5px solid #fdecea" }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "#c0392b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-alert-triangle" /> ناحیه خطرناک
              </h3>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: "1.25rem", lineHeight: 1.7 }}>این عملیات‌ها برگشت‌پذیر نیستند. با احتیاط ادامه دهید.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  style={{ background: "transparent", border: "1.5px solid var(--accent)", color: "var(--accent)", padding: 10, borderRadius: 8, fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <i className="ti ti-logout" /> خروج از همه دستگاه‌ها
                </button>
                <button
                  style={{ background: "#fdecea", border: "1.5px solid #c0392b", color: "#c0392b", padding: 10, borderRadius: 8, fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
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
