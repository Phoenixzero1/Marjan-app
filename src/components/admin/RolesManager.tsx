"use client";

import { useState, useEffect, useCallback } from "react";

type UserRole = "CUSTOMER" | "CONTRACTOR" | "CONTENT_MANAGER" | "ADMIN" | "SUPER_ADMIN";
type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFY" | "DELETED";

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  avatarUrl: string | null;
}

type Toast = { msg: string; ok: boolean };

const ROLE_META: Record<UserRole, { label: string; color: string; bg: string; icon: string }> = {
  CUSTOMER:        { label: "مشتری",       color: "#64748b", bg: "#f1f5f9", icon: "ti-user" },
  CONTRACTOR:      { label: "پیمانکار",    color: "#7c3aed", bg: "#ede9fe", icon: "ti-tool" },
  CONTENT_MANAGER: { label: "مدیر محتوا",  color: "#0284c7", bg: "#e0f2fe", icon: "ti-edit" },
  ADMIN:           { label: "مدیر",        color: "#d97706", bg: "#fef3c7", icon: "ti-shield" },
  SUPER_ADMIN:     { label: "مدیر ارشد",   color: "#dc2626", bg: "#fee2e2", icon: "ti-crown" },
};

const STATUS_META: Record<UserStatus, { label: string; color: string; bg: string }> = {
  ACTIVE:         { label: "فعال",          color: "#16a34a", bg: "#dcfce7" },
  SUSPENDED:      { label: "معلق",          color: "#dc2626", bg: "#fee2e2" },
  PENDING_VERIFY: { label: "در انتظار",     color: "#d97706", bg: "#fef3c7" },
  DELETED:        { label: "حذف‌شده",       color: "#9ca3af", bg: "#f3f4f6" },
};

const PERMISSIONS: { label: string; keys: UserRole[] }[] = [
  { label: "مشاهده پنل ادمین",        keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت کاربران",          keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت سفارشات",         keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت محصولات",         keys: ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت دسته‌بندی‌ها",    keys: ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت بلاگ",            keys: ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت رسانه‌ها",         keys: ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت مالی",             keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت کوپن‌ها",          keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "تنظیمات سیستم",          keys: ["SUPER_ADMIN"] },
  { label: "پشتیبان‌گیری",            keys: ["SUPER_ADMIN"] },
  { label: "مدیریت نقش‌ها",           keys: ["SUPER_ADMIN"] },
  { label: "ثبت سفارش (مشتری)",      keys: ["CUSTOMER", "CONTRACTOR", "CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { label: "داشبورد کاربری",          keys: ["CUSTOMER", "CONTRACTOR", "CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"] },
];

const ALL_ROLES: UserRole[] = ["CUSTOMER", "CONTRACTOR", "CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"];
const ALL_STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "PENDING_VERIFY", "DELETED"];

export default function RolesManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [myUserId, setMyUserId] = useState("");
  const [myRole, setMyRole] = useState<UserRole>("ADMIN");
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "matrix">("users");
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [drawerRole, setDrawerRole] = useState<UserRole>("CUSTOMER");
  const [drawerStatus, setDrawerStatus] = useState<UserStatus>("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (q.trim()) params.set("q", q.trim());
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/roles?${params}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(pg);
      if (data.roleCounts) setRoleCounts(data.roleCounts);
      if (data.myUserId) setMyUserId(data.myUserId);
      if (data.myRole) setMyRole(data.myRole);
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter, statusFilter]);

  useEffect(() => { load(1); }, [load]);

  function openEdit(user: UserRow) {
    setEditing(user);
    setDrawerRole(user.role);
    setDrawerStatus(user.status);
  }

  async function handleSave() {
    if (!editing) return;
    const roleChanged = drawerRole !== editing.role;
    const statusChanged = drawerStatus !== editing.status;
    if (!roleChanged && !statusChanged) { setEditing(null); return; }

    setSaving(true);
    try {
      const body: Record<string, string> = { userId: editing.id };
      if (roleChanged) body.role = drawerRole;
      if (statusChanged) body.status = drawerStatus;

      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "خطا در ذخیره", false); return; }
      showToast("تغییرات اعمال شد");
      setEditing(null);
      load(page);
    } finally {
      setSaving(false);
    }
  }

  const fmtDate = (s: string | null) => s
    ? new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" })
    : "—";

  const totalUsers = Object.values(roleCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>نقش‌ها و دسترسی</h2>
        <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>{totalUsers.toLocaleString("fa-IR")} کاربر ثبت‌شده</p>
      </div>

      {/* Role summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {ALL_ROLES.map((r) => {
          const meta = ROLE_META[r];
          const count = roleCounts[r] ?? 0;
          const active = roleFilter === r;
          return (
            <div
              key={r}
              onClick={() => setRoleFilter(active ? "" : r)}
              style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: active ? `0 0 0 2px ${meta.color}` : "var(--shadow)", padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "box-shadow .15s" }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className={`ti ${meta.icon}`} style={{ fontSize: 20, color: meta.color }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)" }}>{count.toLocaleString("fa-IR")}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{meta.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border)", gap: 0 }}>
        {([["users", "مدیریت کاربران"], ["matrix", "ماتریس دسترسی"]] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent", marginBottom: -2, padding: "10px 20px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, color: activeTab === tab ? "var(--primary)" : "var(--text3)", cursor: "pointer" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Users */}
      {activeTab === "users" && (
        <>
          {/* Filters */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && load(1)}
              placeholder="جستجو نام، ایمیل یا موبایل..."
              style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", minWidth: 240 }}
            />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontFamily: "Vazirmatn", fontSize: 13, background: "#fff" }}>
              <option value="">همه نقش‌ها</option>
              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontFamily: "Vazirmatn", fontSize: 13, background: "#fff" }}>
              <option value="">همه وضعیت‌ها</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
            <button onClick={() => load(1)} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>اعمال</button>
            {(roleFilter || statusFilter || q) && (
              <button onClick={() => { setRoleFilter(""); setStatusFilter(""); setQ(""); }} style={{ background: "var(--surface)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 12px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer" }}>پاک‌سازی</button>
            )}
            <div style={{ marginRight: "auto", fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>{total.toLocaleString("fa-IR")} نتیجه</div>
          </div>

          {/* Table */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
                <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />در حال بارگذاری...
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
                <i className="ti ti-users" style={{ fontSize: 40, display: "block", marginBottom: 8 }} />کاربری یافت نشد
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["کاربر", "نقش", "وضعیت", "تاریخ ثبت‌نام", "آخرین ورود", "عملیات"].map(h => (
                      <th key={h} style={{ background: "var(--bg)", padding: "10px 14px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => {
                    const roleMeta = ROLE_META[user.role];
                    const statusMeta = STATUS_META[user.status];
                    const isMe = user.id === myUserId;
                    return (
                      <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none" }}>
                        {/* User */}
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: roleMeta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                              {user.avatarUrl
                                ? <img src={user.avatarUrl} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
                                : <i className={`ti ${roleMeta.icon}`} style={{ color: roleMeta.color }} />
                              }
                            </div>
                            <div>
                              <div style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 6 }}>
                                {user.firstName} {user.lastName}
                                {isMe && <span style={{ background: "#dbeafe", color: "#2563eb", fontSize: 9, fontWeight: 900, padding: "1px 6px", borderRadius: 6 }}>شما</span>}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text3)", direction: "ltr", textAlign: "right" }}>
                                {user.email ?? user.phone ?? "—"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: roleMeta.bg, color: roleMeta.color, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <i className={`ti ${roleMeta.icon}`} style={{ fontSize: 11 }} />
                            {roleMeta.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: statusMeta.bg, color: statusMeta.color, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 900 }}>
                            {statusMeta.label}
                          </span>
                        </td>

                        {/* Joined */}
                        <td style={{ padding: "12px 14px", color: "var(--text3)", fontSize: 12 }}>{fmtDate(user.createdAt)}</td>

                        {/* Last Login */}
                        <td style={{ padding: "12px 14px", color: "var(--text3)", fontSize: 12 }}>{fmtDate(user.lastLoginAt)}</td>

                        {/* Actions */}
                        <td style={{ padding: "12px 14px" }}>
                          <button
                            onClick={() => openEdit(user)}
                            disabled={isMe}
                            title={isMe ? "نمی‌توانید نقش خودتان را تغییر دهید" : "ویرایش نقش و وضعیت"}
                            style={{ background: isMe ? "var(--bg)" : "var(--primary)", color: isMe ? "var(--text3)" : "#fff", border: isMe ? "1.5px solid var(--border)" : "none", borderRadius: "var(--radius-sm)", padding: "6px 14px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: isMe ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, opacity: isMe ? .5 : 1 }}
                          >
                            <i className="ti ti-shield-half-filled" style={{ fontSize: 13 }} /> ویرایش نقش
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
              <button onClick={() => load(page - 1)} disabled={page <= 1} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer", opacity: page <= 1 ? .5 : 1 }}>قبلی</button>
              <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "var(--text2)", padding: "0 8px" }}>
                {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}
              </span>
              <button onClick={() => load(page + 1)} disabled={page >= pages} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer", opacity: page >= pages ? .5 : 1 }}>بعدی</button>
            </div>
          )}
        </>
      )}

      {/* Tab: Permissions Matrix */}
      {activeTab === "matrix" && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ background: "var(--bg)", padding: "12px 16px", fontSize: 12, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)", minWidth: 200 }}>دسترسی</th>
                {ALL_ROLES.map(r => {
                  const meta = ROLE_META[r];
                  return (
                    <th key={r} style={{ background: "var(--bg)", padding: "12px 16px", fontSize: 11, fontWeight: 900, color: meta.color, textAlign: "center", borderBottom: "2px solid var(--border)", minWidth: 100, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <i className={`ti ${meta.icon}`} style={{ fontSize: 16 }} />
                        </div>
                        {meta.label}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((perm, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--text)" }}>{perm.label}</td>
                  {ALL_ROLES.map(r => {
                    const has = perm.keys.includes(r);
                    return (
                      <td key={r} style={{ padding: "12px 16px", textAlign: "center" }}>
                        {has
                          ? <i className="ti ti-circle-check-filled" style={{ fontSize: 20, color: "#16a34a" }} />
                          : <i className="ti ti-circle-x" style={{ fontSize: 20, color: "#e2e8f0" }} />
                        }
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Drawer */}
      {editing && (
        <>
          <div onClick={() => setEditing(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200 }} />
          <div style={{ position: "fixed", top: 0, left: 0, width: 380, height: "100vh", background: "#fff", zIndex: 201, boxShadow: "-4px 0 32px rgba(0,0,0,.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Drawer header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--primary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
                <i className="ti ti-shield-half-filled" style={{ fontSize: 20 }} />
                <div>
                  <div style={{ fontWeight: 900, fontSize: 15 }}>ویرایش نقش و وضعیت</div>
                  <div style={{ fontSize: 12, opacity: .8 }}>{editing.firstName} {editing.lastName}</div>
                </div>
              </div>
              <button onClick={() => setEditing(null)} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-x" style={{ fontSize: 16 }} />
              </button>
            </div>

            {/* Drawer body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {/* User info */}
              <div style={{ background: "var(--bg)", borderRadius: "var(--radius)", padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: ROLE_META[editing.role].bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`ti ${ROLE_META[editing.role].icon}`} style={{ fontSize: 22, color: ROLE_META[editing.role].color }} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 14 }}>{editing.firstName} {editing.lastName}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>{editing.email ?? editing.phone ?? "—"}</div>
                </div>
              </div>

              {/* Role selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", display: "block", marginBottom: 10 }}>
                  نقش کاربر <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ALL_ROLES.map(r => {
                    const meta = ROLE_META[r];
                    const isAdminRole = ["ADMIN", "SUPER_ADMIN"].includes(r);
                    const canAssign = !isAdminRole || myRole === "SUPER_ADMIN";
                    return (
                      <button
                        key={r}
                        onClick={() => canAssign && setDrawerRole(r)}
                        disabled={!canAssign}
                        style={{ background: drawerRole === r ? meta.bg : "var(--bg)", border: drawerRole === r ? `2px solid ${meta.color}` : "2px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", cursor: canAssign ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 10, textAlign: "right", opacity: canAssign ? 1 : .4, transition: "all .15s" }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <i className={`ti ${meta.icon}`} style={{ fontSize: 16, color: meta.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: drawerRole === r ? meta.color : "var(--text)" }}>{meta.label}</div>
                        </div>
                        {drawerRole === r && <i className="ti ti-check" style={{ fontSize: 16, color: meta.color }} />}
                        {!canAssign && <i className="ti ti-lock" style={{ fontSize: 14, color: "var(--text3)" }} />}
                      </button>
                    );
                  })}
                </div>
                {myRole !== "SUPER_ADMIN" && (
                  <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>برای اعطای نقش ادمین یا ارشد، دسترسی مدیر ارشد لازم است.</p>
                )}
              </div>

              {/* Status selector */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", display: "block", marginBottom: 10 }}>وضعیت حساب</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {ALL_STATUSES.map(s => {
                    const meta = STATUS_META[s];
                    return (
                      <button
                        key={s}
                        onClick={() => setDrawerStatus(s)}
                        style={{ background: drawerStatus === s ? meta.bg : "var(--bg)", border: drawerStatus === s ? `2px solid ${meta.color}` : "2px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all .15s" }}
                      >
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 900, color: drawerStatus === s ? meta.color : "var(--text2)" }}>{meta.label}</span>
                        {drawerStatus === s && <i className="ti ti-check" style={{ fontSize: 13, color: meta.color, marginRight: "auto" }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 1, background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "11px 0", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 900, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .7 : 1 }}
              >
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
              <button
                onClick={() => setEditing(null)}
                style={{ background: "var(--surface)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "11px 18px", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                انصراف
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
