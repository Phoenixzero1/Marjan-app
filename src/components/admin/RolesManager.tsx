"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminToolbar, AdminSearch, AdminSelect, AdminBtn,
  AdminTable, AdminTh, AdminTd, AdminTr, AdminBadge, AdminEmptyState,
  AdminDrawer, AdminTabs, AdminPagination,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";
import type { Permission } from "@/lib/permissions";

type UserRole = "CUSTOMER" | "CONTRACTOR" | "CONTENT_MANAGER" | "ADMIN" | "SUPER_ADMIN";
type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFY" | "DELETED";

interface UserRow {
  id: string; firstName: string; lastName: string; email: string | null; phone: string | null;
  role: UserRole; status: UserStatus; createdAt: string; lastLoginAt: string | null; avatarUrl: string | null;
}

const ROLE_META: Record<UserRole, { label: string; color: string; bg: string; icon: string; variant: "success" | "info" | "warning" | "danger" | "neutral" | "purple" }> = {
  CUSTOMER:        { label: "مشتری",      color: "#64748b", bg: "#f1f5f9", icon: "ti-user",   variant: "neutral" },
  CONTRACTOR:      { label: "پیمانکار",   color: "#7c3aed", bg: "#ede9fe", icon: "ti-tool",   variant: "purple" },
  CONTENT_MANAGER: { label: "مدیر محتوا", color: "#0284c7", bg: "#e0f2fe", icon: "ti-edit",   variant: "info" },
  ADMIN:           { label: "مدیر",       color: "#d97706", bg: "#fef3c7", icon: "ti-shield",  variant: "warning" },
  SUPER_ADMIN:     { label: "مدیر ارشد",  color: "#dc2626", bg: "#fee2e2", icon: "ti-crown",   variant: "danger" },
};

const STATUS_META: Record<UserStatus, { label: string; variant: "success" | "danger" | "warning" | "neutral" }> = {
  ACTIVE:         { label: "فعال",      variant: "success" },
  SUSPENDED:      { label: "معلق",      variant: "danger" },
  PENDING_VERIFY: { label: "در انتظار", variant: "warning" },
  DELETED:        { label: "حذف‌شده",   variant: "neutral" },
};

const PERMISSIONS: { label: string; keys: UserRole[] }[] = [
  { label: "مشاهده پنل ادمین",        keys: ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"] },
  { label: "ویرایش محصولات",          keys: ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { label: "حذف محصولات",             keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت دسته‌بندی‌ها",     keys: ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت بلاگ",             keys: ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت رسانه‌ها",          keys: ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { label: "مشاهده سفارشات",          keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "ویرایش سفارشات",          keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت کاربران",          keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت نقش‌ها",           keys: ["SUPER_ADMIN"] },
  { label: "مدیریت کوپن‌ها",           keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "مشاهده مالی",             keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "تنظیمات سایت",            keys: ["SUPER_ADMIN"] },
  { label: "پشتیبان‌گیری",             keys: ["SUPER_ADMIN"] },
  { label: "مشاهده لاگ‌ها",           keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "ارسال اعلان",              keys: ["ADMIN", "SUPER_ADMIN"] },
  { label: "مدیریت مرجوعی‌ها",        keys: ["ADMIN", "SUPER_ADMIN"] },
];

type PermissionRow = { permission: Permission; granted: boolean; isDefault: boolean };
type PermUser = { id: string; firstName: string; lastName: string; role: UserRole };
const ALL_ROLES: UserRole[] = ["CUSTOMER", "CONTRACTOR", "CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"];
const ALL_STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "PENDING_VERIFY", "DELETED"];
const PAGE_SIZE = 25;

export default function RolesManager() {
  const { toast, showToast } = useAdminToast();
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
  const [activeTab, setActiveTab] = useState<"users" | "matrix" | "perms">("users");
  const [permUser, setPermUser] = useState<PermUser | null>(null);
  const [permRows, setPermRows] = useState<PermissionRow[]>([]);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [drawerRole, setDrawerRole] = useState<UserRole>("CUSTOMER");
  const [drawerStatus, setDrawerStatus] = useState<UserStatus>("ACTIVE");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (q.trim()) params.set("q", q.trim());
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/roles?${params}`);
      const data = await res.json();
      setUsers(data.users ?? []); setTotal(data.total ?? 0); setPages(data.pages ?? 1); setPage(pg);
      if (data.roleCounts) setRoleCounts(data.roleCounts);
      if (data.myUserId) setMyUserId(data.myUserId);
      if (data.myRole) setMyRole(data.myRole);
    } finally { setLoading(false); }
  }, [q, roleFilter, statusFilter]);

  useEffect(() => { load(1); }, [load]);

  function openEdit(user: UserRow) { setEditing(user); setDrawerRole(user.role); setDrawerStatus(user.status); }

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
      const res = await fetch("/api/admin/roles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در ذخیره"); return; }
      showToast("success", "تغییرات اعمال شد"); setEditing(null); load(page);
    } finally { setSaving(false); }
  }

  async function openPerms(user: UserRow) {
    setPermUser({ id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role });
    setPermRows([]); setPermLoading(true); setActiveTab("perms");
    try {
      const res = await fetch(`/api/admin/permissions?userId=${user.id}`);
      const data = await res.json();
      setPermRows(data.permissions ?? []);
    } finally { setPermLoading(false); }
  }

  async function togglePerm(permission: Permission, currentGranted: boolean, isDefault: boolean) {
    if (!permUser) return;
    setPermSaving(permission);
    try {
      const newGranted = !currentGranted;
      await fetch("/api/admin/permissions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: permUser.id, permission, granted: newGranted }) });
      setPermRows(prev => prev.map(r => r.permission === permission ? { ...r, granted: newGranted, isDefault: false } : r));
      showToast("success", "دسترسی به‌روز شد");
    } catch { showToast("error", "خطا در ذخیره"); }
    finally { setPermSaving(null); }
  }

  async function resetPerms() {
    if (!permUser) return;
    if (!window.confirm(`آیا می‌خواهید تمام تنظیمات دسترسی ${permUser.firstName} ${permUser.lastName} را به حالت پیش‌فرض بازگردانید؟`)) return;
    setPermSaving("__all__");
    try {
      await fetch(`/api/admin/permissions?userId=${permUser.id}`, { method: "DELETE" });
      const res = await fetch(`/api/admin/permissions?userId=${permUser.id}`);
      const data = await res.json();
      setPermRows(data.permissions ?? []); showToast("success", "تنظیمات دسترسی به پیش‌فرض بازگشت");
    } catch { showToast("error", "خطا"); }
    finally { setPermSaving(null); }
  }

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const totalUsers = Object.values(roleCounts).reduce((a, b) => a + b, 0);

  const TABS = [
    { id: "users", label: "مدیریت کاربران", icon: "ti-users" },
    { id: "matrix", label: "ماتریس دسترسی", icon: "ti-layout-grid" },
    { id: "perms", label: permUser ? `دسترسی: ${permUser.firstName}` : "دسترسی اختصاصی", icon: "ti-key" },
  ];

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="نقش‌ها و دسترسی" icon="ti-shield-half-filled" count={totalUsers} subtitle={`${totalUsers.toLocaleString("fa-IR")} کاربر ثبت‌شده`} />

      {/* Role summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
        {ALL_ROLES.map(r => {
          const meta = ROLE_META[r];
          const count = roleCounts[r] ?? 0;
          const active = roleFilter === r;
          return (
            <div key={r} onClick={() => setRoleFilter(active ? "" : r)} style={{ background: "#fff", borderRadius: 10, border: active ? `2px solid ${meta.color}` : "1.5px solid var(--border)", padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, boxShadow: active ? `0 0 0 1px ${meta.color}20` : "0 1px 4px rgba(0,0,0,.06)", transition: "all .15s" }}>
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

      <AdminTabs tabs={TABS} active={activeTab} onChange={v => setActiveTab(v as typeof activeTab)} />

      {/* Tab: Users */}
      {activeTab === "users" && (
        <>
          <AdminToolbar>
            <AdminSearch value={q} onChange={setQ} placeholder="جستجو نام، ایمیل یا موبایل..." />
            <AdminSelect value={roleFilter} onChange={setRoleFilter}>
              <option value="">همه نقش‌ها</option>
              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
            </AdminSelect>
            <AdminSelect value={statusFilter} onChange={setStatusFilter}>
              <option value="">همه وضعیت‌ها</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </AdminSelect>
            <AdminBtn icon="ti-search" onClick={() => load(1)}>اعمال</AdminBtn>
            {(roleFilter || statusFilter || q) && <AdminBtn icon="ti-x" variant="secondary" onClick={() => { setRoleFilter(""); setStatusFilter(""); setQ(""); }}>پاک‌سازی</AdminBtn>}
            <span style={{ fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>{total.toLocaleString("fa-IR")} نتیجه</span>
          </AdminToolbar>

          <AdminTable>
            <thead>
              <tr>
                <AdminTh>کاربر</AdminTh>
                <AdminTh>نقش</AdminTh>
                <AdminTh>وضعیت</AdminTh>
                <AdminTh>تاریخ ثبت‌نام</AdminTh>
                <AdminTh>آخرین ورود</AdminTh>
                <AdminTh>عملیات</AdminTh>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6}><AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /></td></tr>}
              {!loading && users.length === 0 && <tr><td colSpan={6}><AdminEmptyState icon="ti-users" title="کاربری یافت نشد" /></td></tr>}
              {users.map(user => {
                const roleMeta = ROLE_META[user.role];
                const isMe = user.id === myUserId;
                return (
                  <AdminTr key={user.id}>
                    <AdminTd>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: roleMeta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {user.avatarUrl
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={user.avatarUrl} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
                            : <i className={`ti ${roleMeta.icon}`} style={{ color: roleMeta.color, fontSize: 16 }} />
                          }
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 6 }}>
                            {user.firstName} {user.lastName}
                            {isMe && <AdminBadge variant="info" size="xs">شما</AdminBadge>}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text3)" }}>{user.email ?? user.phone ?? "—"}</div>
                        </div>
                      </div>
                    </AdminTd>
                    <AdminTd><AdminBadge variant={roleMeta.variant}><i className={`ti ${roleMeta.icon}`} style={{ fontSize: 11, marginLeft: 4 }} />{roleMeta.label}</AdminBadge></AdminTd>
                    <AdminTd><AdminBadge variant={STATUS_META[user.status].variant}>{STATUS_META[user.status].label}</AdminBadge></AdminTd>
                    <AdminTd style={{ color: "var(--text3)", fontSize: 12 }}>{fmtDate(user.createdAt)}</AdminTd>
                    <AdminTd style={{ color: "var(--text3)", fontSize: 12 }}>{fmtDate(user.lastLoginAt)}</AdminTd>
                    <AdminTd>
                      <div style={{ display: "flex", gap: 6 }}>
                        <AdminBtn size="sm" icon="ti-shield-half-filled" disabled={isMe} title={isMe ? "نمی‌توانید نقش خودتان را تغییر دهید" : undefined} onClick={() => openEdit(user)}>نقش</AdminBtn>
                        {!isMe && <AdminBtn size="sm" icon="ti-key" variant="secondary" onClick={() => openPerms(user)}>دسترسی</AdminBtn>}
                      </div>
                    </AdminTd>
                  </AdminTr>
                );
              })}
            </tbody>
          </AdminTable>

          {pages > 1 && <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={pg => load(pg)} />}
        </>
      )}

      {/* Tab: Matrix */}
      {activeTab === "matrix" && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid var(--border)", overflow: "auto" }}>
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
                          <i className={`ti ${meta.icon}`} style={{ fontSize: 16, color: meta.color }} />
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
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>{perm.label}</td>
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

      {/* Tab: Per-user Permissions */}
      {activeTab === "perms" && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid var(--border)", padding: "1.5rem" }}>
          {!permUser ? (
            <AdminEmptyState icon="ti-key" title="برای تنظیم دسترسی اختصاصی" subtitle="از تب «مدیریت کاربران» روی دکمه «دسترسی» کلیک کنید" />
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)" }}>دسترسی‌های اختصاصی: {permUser.firstName} {permUser.lastName}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>نقش: {ROLE_META[permUser.role].label}</div>
                </div>
                <AdminBtn icon="ti-refresh" variant="secondary" loading={permSaving === "__all__"} onClick={resetPerms}>بازگشت به پیش‌فرض</AdminBtn>
              </div>
              {permLoading ? <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /> : (
                <AdminTable>
                  <thead>
                    <tr>
                      <AdminTh>دسترسی</AdminTh>
                      <AdminTh>پیش‌فرض نقش</AdminTh>
                      <AdminTh>وضعیت فعلی</AdminTh>
                      <AdminTh>تغییر</AdminTh>
                    </tr>
                  </thead>
                  <tbody>
                    {permRows.map((row, i) => (
                      <AdminTr key={row.permission} style={{ background: row.isDefault ? "#fff" : "#fffbeb" }}>
                        <AdminTd style={{ fontWeight: 700 }}>{PERMISSIONS[i]?.label ?? row.permission}</AdminTd>
                        <AdminTd>
                          {row.isDefault && row.granted ? <span style={{ color: "#16a34a", fontSize: 11, fontWeight: 900 }}><i className="ti ti-check" /> مجاز</span>
                           : row.isDefault ? <span style={{ color: "#9ca3af", fontSize: 11 }}><i className="ti ti-x" /> غیرمجاز</span>
                           : <span style={{ color: "#d97706", fontSize: 11 }}>تنظیم‌شده</span>}
                        </AdminTd>
                        <AdminTd><AdminBadge variant={row.granted ? "success" : "danger"} size="xs">{row.granted ? "مجاز" : "مسدود"}</AdminBadge></AdminTd>
                        <AdminTd>
                          <AdminBtn size="sm" variant={row.granted ? "danger" : "secondary"}
                            loading={permSaving === row.permission} disabled={permUser.role === "SUPER_ADMIN"}
                            onClick={() => togglePerm(row.permission, row.granted, row.isDefault)}
                          >
                            {row.granted ? "مسدود کردن" : "اعطا کردن"}
                          </AdminBtn>
                        </AdminTd>
                      </AdminTr>
                    ))}
                  </tbody>
                </AdminTable>
              )}
            </>
          )}
        </div>
      )}

      {/* Edit Drawer */}
      <AdminDrawer open={!!editing} onClose={() => setEditing(null)} title={`ویرایش نقش: ${editing?.firstName ?? ""} ${editing?.lastName ?? ""}`}>
        {editing && (
          <div>
            <div style={{ background: "var(--bg)", borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: ROLE_META[editing.role].bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className={`ti ${ROLE_META[editing.role].icon}`} style={{ fontSize: 22, color: ROLE_META[editing.role].color }} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>{editing.firstName} {editing.lastName}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{editing.email ?? editing.phone ?? "—"}</div>
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>نقش کاربر <span style={{ color: "#dc2626" }}>*</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {ALL_ROLES.map(r => {
                const meta = ROLE_META[r];
                const isAdminRole = ["ADMIN", "SUPER_ADMIN"].includes(r);
                const canAssign = !isAdminRole || myRole === "SUPER_ADMIN";
                return (
                  <button key={r} onClick={() => canAssign && setDrawerRole(r)} disabled={!canAssign}
                    style={{ background: drawerRole === r ? meta.bg : "var(--bg)", border: drawerRole === r ? `2px solid ${meta.color}` : "2px solid var(--border)", borderRadius: 8, padding: "10px 14px", cursor: canAssign ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 10, textAlign: "right", opacity: canAssign ? 1 : .4, transition: "all .15s" }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className={`ti ${meta.icon}`} style={{ fontSize: 16, color: meta.color }} />
                    </div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 900, color: drawerRole === r ? meta.color : "var(--text)" }}>{meta.label}</div>
                    {drawerRole === r && <i className="ti ti-check" style={{ fontSize: 16, color: meta.color }} />}
                    {!canAssign && <i className="ti ti-lock" style={{ fontSize: 14, color: "var(--text3)" }} />}
                  </button>
                );
              })}
              {myRole !== "SUPER_ADMIN" && <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>برای اعطای نقش ادمین یا ارشد، دسترسی مدیر ارشد لازم است.</p>}
            </div>

            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>وضعیت حساب</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {ALL_STATUSES.map(s => {
                const smeta = STATUS_META[s];
                const colors = { success: "#16a34a", danger: "#dc2626", warning: "#d97706", neutral: "#9ca3af" } as const;
                const c = colors[smeta.variant];
                return (
                  <button key={s} onClick={() => setDrawerStatus(s)}
                    style={{ background: drawerStatus === s ? c + "18" : "var(--bg)", border: drawerStatus === s ? `2px solid ${c}` : "2px solid var(--border)", borderRadius: 8, padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all .15s" }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 900, color: drawerStatus === s ? c : "var(--text2)" }}>{smeta.label}</span>
                    {drawerStatus === s && <i className="ti ti-check" style={{ fontSize: 13, color: c, marginRight: "auto" }} />}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <AdminBtn variant="primary" icon="ti-device-floppy" loading={saving} onClick={handleSave} style={{ flex: 1, justifyContent: "center" }}>
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </AdminBtn>
              <AdminBtn variant="secondary" onClick={() => setEditing(null)}>انصراف</AdminBtn>
            </div>
          </div>
        )}
      </AdminDrawer>
    </div>
  );
}
