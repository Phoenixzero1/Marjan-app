"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

type Role = "CUSTOMER" | "CONTRACTOR" | "CONTENT_MANAGER" | "ADMIN" | "SUPER_ADMIN";
type Status = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFY" | "DELETED";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: Role;
  status: Status;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { orders: number };
}

const ROLE: Record<Role, string> = {
  CUSTOMER: "مشتری",
  CONTRACTOR: "پیمانکار",
  CONTENT_MANAGER: "مدیر محتوا",
  ADMIN: "مدیر",
  SUPER_ADMIN: "مدیر کل",
};

const STATUS: Record<Status, { label: string; pill: string }> = {
  ACTIVE: { label: "فعال", pill: "pill-green" },
  SUSPENDED: { label: "معلق", pill: "pill-red" },
  PENDING_VERIFY: { label: "در انتظار تایید", pill: "pill-orange" },
  DELETED: { label: "حذف‌شده", pill: "pill-gray" },
};

const inp: React.CSSProperties = {
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13,
  color: "var(--text)", outline: "none", background: "#fff", width: "100%", boxSizing: "border-box",
};
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 };

interface FormState {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  status: Status;
  password: string;
}

const emptyForm: FormState = {
  firstName: "", lastName: "", email: "", phone: "",
  role: "CUSTOMER", status: "ACTIVE", password: "",
};

export default function UserManager() {
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string })?.id;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadUsers = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("q", search.trim());
    if (roleFilter) qs.set("role", roleFilter);
    if (statusFilter) qs.set("status", statusFilter);
    fetch(`/api/admin/users?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => showToast("error", "خطا در بارگذاری کاربران"))
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter, showToast]);

  useEffect(() => { loadUsers(); }, [roleFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setForm(emptyForm); setFormOpen(true); };
  const openEdit = (u: User) => {
    setForm({
      id: u.id, firstName: u.firstName, lastName: u.lastName,
      email: u.email ?? "", phone: u.phone ?? "",
      role: u.role, status: u.status, password: "",
    });
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setForm(emptyForm); };

  const isSelf = form.id && form.id === myId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2) {
      showToast("error", "نام و نام خانوادگی الزامی است"); return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      showToast("error", "ایمیل یا شماره موبایل الزامی است"); return;
    }
    if (!form.id && form.password.length < 6) {
      showToast("error", "رمز عبور حداقل ۶ کاراکتر باشد"); return;
    }

    setSaving(true);
    try {
      const base = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        status: form.status,
      };
      const res = await fetch("/api/admin/users", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          form.id
            ? { id: form.id, ...base, ...(form.password ? { password: form.password } : {}) }
            : { ...base, password: form.password }
        ),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در ذخیره کاربر"); return; }

      showToast("success", form.id ? "کاربر ویرایش شد" : "کاربر ایجاد شد");
      closeForm();
      loadUsers();
    } catch {
      showToast("error", "خطای سرور");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (u.id === myId) { showToast("error", "نمی‌توانید حساب خودتان را حذف کنید"); return; }
    const warn = u._count.orders > 0
      ? `«${u.firstName} ${u.lastName}» دارای ${u._count.orders} سفارش است و به‌جای حذف، به حالت «حذف‌شده» منتقل می‌شود.\nادامه می‌دهید؟`
      : `آیا از حذف «${u.firstName} ${u.lastName}» مطمئن هستید؟\nاین عملیات برگشت‌پذیر نیست.`;
    if (!window.confirm(warn)) return;

    setDeletingId(u.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در حذف"); return; }
      if (data.softDeleted) {
        showToast("success", `«${u.firstName} ${u.lastName}» به حالت حذف‌شده منتقل شد`);
        setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, status: "DELETED" } : x));
      } else {
        showToast("success", `«${u.firstName} ${u.lastName}» حذف شد`);
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
      }
    } catch {
      showToast("error", "خطای سرور");
    } finally {
      setDeletingId(null);
    }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fa-IR");

  return (
    <div style={{ position: "relative" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? "#1a7a4a" : "#c0392b",
          color: "#fff", padding: "12px 28px", borderRadius: 10,
          fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700,
          zIndex: 10000, boxShadow: "0 6px 24px rgba(0,0,0,.25)",
          display: "flex", alignItems: "center", gap: 10, maxWidth: "90vw",
        }}>
          <i className={`ti ${toast.type === "success" ? "ti-circle-check" : "ti-circle-x"}`} style={{ fontSize: 18, flexShrink: 0 }} />
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadUsers()}
          placeholder="جستجو نام، ایمیل، موبایل..."
          style={{ ...inp, maxWidth: 260, flex: "1 1 180px" }}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ ...inp, width: "auto", cursor: "pointer" }}>
          <option value="">همه نقش‌ها</option>
          {(Object.keys(ROLE) as Role[]).map((r) => <option key={r} value={r}>{ROLE[r]}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inp, width: "auto", cursor: "pointer" }}>
          <option value="">همه وضعیت‌ها</option>
          {(Object.keys(STATUS) as Status[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
        <button onClick={loadUsers} style={{ background: "var(--bg)", color: "var(--text2)", border: "1px solid var(--border)", padding: "9px 14px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer" }}>
          <i className="ti ti-search" /> جستجو
        </button>
        <button onClick={openCreate} style={{ marginRight: "auto", background: "var(--primary)", color: "#fff", border: "none", padding: "9px 16px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <i className="ti ti-user-plus" /> افزودن کاربر
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 }}>
          <thead>
            <tr>
              {["کاربر", "موبایل", "نقش", "عضویت", "سفارشات", "وضعیت", "عملیات"].map((h) => (
                <th key={h} style={{ background: "var(--bg)", padding: "10px 12px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 6 }}>
                    {u.firstName} {u.lastName}
                    {u.id === myId && <span style={{ fontSize: 10, fontWeight: 900, color: "var(--accent)" }}>(شما)</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", direction: "ltr", textAlign: "right" }}>{u.email ?? "—"}</div>
                </td>
                <td style={{ padding: "10px 12px", direction: "ltr", textAlign: "right" }}>{u.phone ?? "—"}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>{ROLE[u.role]}</td>
                <td style={{ padding: "10px 12px", color: "var(--text3)", whiteSpace: "nowrap" }}>{fmtDate(u.createdAt)}</td>
                <td style={{ padding: "10px 12px" }}>{u._count?.orders ?? 0}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span className={STATUS[u.status].pill} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block", whiteSpace: "nowrap" }}>
                    {STATUS[u.status].label}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: 4 }}>
                  <button onClick={() => openEdit(u)} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "Vazirmatn", color: "var(--text2)", whiteSpace: "nowrap" }}>
                    <i className="ti ti-edit" /> ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={deletingId === u.id || u.id === myId}
                    title={u.id === myId ? "نمی‌توانید حساب خودتان را حذف کنید" : ""}
                    style={{ background: "#fdecea", border: "1px solid #f5c6cb", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: (deletingId === u.id || u.id === myId) ? "not-allowed" : "pointer", fontFamily: "Vazirmatn", color: "#c0392b", opacity: (deletingId === u.id || u.id === myId) ? .45 : 1, whiteSpace: "nowrap" }}
                  >
                    <i className="ti ti-trash" /> {deletingId === u.id ? "حذف..." : "حذف"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>کاربری یافت نشد</td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
                <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} /> در حال بارگذاری...
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit drawer */}
      {formOpen && (
        <div onClick={closeForm} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9998, display: "flex", justifyContent: "flex-start" }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={{ width: 440, maxWidth: "100%", height: "100%", background: "var(--bg)", overflowY: "auto", boxShadow: "0 0 40px rgba(0,0,0,.3)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "1rem 1.5rem", background: "#fff", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", margin: 0 }}>
                {form.id ? "ویرایش کاربر" : "افزودن کاربر"}
              </h3>
              <button type="button" onClick={closeForm} style={{ background: "transparent", border: "none", fontSize: 22, color: "var(--text3)", cursor: "pointer", lineHeight: 1, minWidth: 32, minHeight: 32 }}>
                <i className="ti ti-x" />
              </button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>نام <span style={{ color: "#c0392b" }}>*</span></label>
                  <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} style={inp} placeholder="علی" />
                </div>
                <div>
                  <label style={lbl}>نام خانوادگی <span style={{ color: "#c0392b" }}>*</span></label>
                  <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} style={inp} placeholder="رضایی" />
                </div>
              </div>

              <div>
                <label style={lbl}>ایمیل</label>
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={{ ...inp, direction: "ltr", textAlign: "left" }} placeholder="user@example.com" />
              </div>
              <div>
                <label style={lbl}>موبایل</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={{ ...inp, direction: "ltr", textAlign: "left" }} placeholder="09123456789" />
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, marginTop: -6 }}>ایمیل یا موبایل، حداقل یکی الزامی است</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>نقش</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))} disabled={!!isSelf} style={{ ...inp, cursor: isSelf ? "not-allowed" : "pointer", opacity: isSelf ? .6 : 1 }}>
                    {(Object.keys(ROLE) as Role[]).map((r) => <option key={r} value={r}>{ROLE[r]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>وضعیت</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))} disabled={!!isSelf} style={{ ...inp, cursor: isSelf ? "not-allowed" : "pointer", opacity: isSelf ? .6 : 1 }}>
                    {(Object.keys(STATUS) as Status[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
                  </select>
                </div>
              </div>
              {isSelf && <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginTop: -6 }}>نقش و وضعیت حساب خودتان قابل تغییر نیست</div>}

              <div>
                <label style={lbl}>
                  رمز عبور {form.id ? <span style={{ color: "var(--text3)", fontWeight: 700 }}>(برای تغییر وارد کنید)</span> : <span style={{ color: "#c0392b" }}>*</span>}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} style={{ ...inp, direction: "ltr", textAlign: "left" }} placeholder={form.id ? "بدون تغییر" : "حداقل ۶ کاراکتر"} autoComplete="new-password" />
              </div>
            </div>

            <div style={{ padding: "1rem 1.5rem", background: "#fff", borderTop: "1px solid var(--border)", display: "flex", gap: 10, position: "sticky", bottom: 0 }}>
              <button type="submit" disabled={saving} style={{ flex: 1, background: saving ? "#aaa" : "var(--primary)", color: "#fff", border: "none", padding: "12px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 900, fontFamily: "Vazirmatn", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {saving ? <><i className="ti ti-loader-2" /> در حال ذخیره...</> : <><i className="ti ti-device-floppy" /> {form.id ? "ذخیره تغییرات" : "ایجاد کاربر"}</>}
              </button>
              <button type="button" onClick={closeForm} style={{ background: "var(--bg)", color: "var(--text2)", border: "1px solid var(--border)", padding: "12px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer" }}>
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
