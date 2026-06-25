"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  AdminPageHeader, AdminToolbar, AdminSearch, AdminSelect, AdminBtn,
  AdminTable, AdminTh, AdminTd, AdminTr, AdminBadge, AdminAvatar,
  AdminEmptyState, AdminDrawer, AdminField, AdminInput, AdminInputSelect,
  AdminToast, AdminDivider, useAdminToast,
} from "@/components/admin/AdminUI";

type Role = "CUSTOMER" | "CONTRACTOR" | "CONTENT_MANAGER" | "ADMIN" | "SUPER_ADMIN";
type Status = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFY" | "DELETED";

interface User {
  id: string; firstName: string; lastName: string;
  email: string | null; phone: string | null;
  role: Role; status: Status; createdAt: string;
  lastLoginAt: string | null; _count: { orders: number };
}

const ROLE: Record<Role, string> = { CUSTOMER: "مشتری", CONTRACTOR: "پیمانکار", CONTENT_MANAGER: "مدیر محتوا", ADMIN: "مدیر", SUPER_ADMIN: "مدیر کل" };
const ROLE_BADGE: Record<Role, "neutral" | "info" | "purple" | "orange" | "danger"> = { CUSTOMER: "neutral", CONTRACTOR: "orange", CONTENT_MANAGER: "purple", ADMIN: "info", SUPER_ADMIN: "danger" };
const STATUS_BADGE: Record<Status, "success" | "danger" | "warning" | "neutral"> = { ACTIVE: "success", SUSPENDED: "danger", PENDING_VERIFY: "warning", DELETED: "neutral" };
const STATUS_LABEL: Record<Status, string> = { ACTIVE: "فعال", SUSPENDED: "معلق", PENDING_VERIFY: "انتظار تایید", DELETED: "حذف‌شده" };

interface FormState {
  id?: string; firstName: string; lastName: string;
  email: string; phone: string; role: Role; status: Status; password: string;
}
const emptyForm: FormState = { firstName: "", lastName: "", email: "", phone: "", role: "CUSTOMER", status: "ACTIVE", password: "" };

export default function UserManager() {
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string })?.id;
  const { toast, showToast } = useAdminToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("q", search.trim());
    if (roleFilter) qs.set("role", roleFilter);
    if (statusFilter) qs.set("status", statusFilter);
    fetch(`/api/admin/users?${qs}`)
      .then(r => r.json()).then(d => setUsers(d.users ?? []))
      .catch(() => showToast("error", "خطا در بارگذاری کاربران"))
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter, showToast]);

  useEffect(() => { loadUsers(); }, [roleFilter, statusFilter]); // eslint-disable-line

  const openCreate = () => { setForm(emptyForm); setFormOpen(true); };
  const openEdit = (u: User) => { setForm({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email ?? "", phone: u.phone ?? "", role: u.role, status: u.status, password: "" }); setFormOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) { showToast("error", "نام و نام خانوادگی الزامی است"); return; }
    if (!form.email.trim() && !form.phone.trim()) { showToast("error", "ایمیل یا شماره موبایل الزامی است"); return; }
    if (!form.id && form.password.length < 6) { showToast("error", "رمز عبور حداقل ۶ کاراکتر"); return; }
    setSaving(true);
    try {
      const base = { firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), phone: form.phone.trim(), role: form.role, status: form.status };
      const res = await fetch("/api/admin/users", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form.id ? { id: form.id, ...base, ...(form.password ? { password: form.password } : {}) } : { ...base, password: form.password }) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در ذخیره"); return; }
      showToast("success", form.id ? "کاربر ویرایش شد" : "کاربر ایجاد شد");
      setFormOpen(false); loadUsers();
    } catch { showToast("error", "خطای سرور"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (u: User) => {
    if (u.id === myId) { showToast("error", "نمی‌توانید حساب خودتان را حذف کنید"); return; }
    const warn = u._count.orders > 0
      ? `«${u.firstName} ${u.lastName}» دارای ${u._count.orders} سفارش است و به حالت حذف‌شده منتقل می‌شود. ادامه می‌دهید؟`
      : `آیا از حذف «${u.firstName} ${u.lastName}» مطمئن هستید؟`;
    if (!window.confirm(warn)) return;
    setDeletingId(u.id);
    try {
      const res = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: u.id }) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در حذف"); return; }
      if (data.softDeleted) { showToast("success", "به حالت حذف‌شده منتقل شد"); setUsers(p => p.map(x => x.id === u.id ? { ...x, status: "DELETED" } : x)); }
      else { showToast("success", "حذف شد"); setUsers(p => p.filter(x => x.id !== u.id)); }
    } catch { showToast("error", "خطای سرور"); }
    finally { setDeletingId(null); }
  };

  const isSelf = form.id === myId;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fa-IR");

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="مدیریت کاربران" icon="ti-users" count={users.length}
        subtitle="لیست و مدیریت کاربران ثبت‌شده در سیستم"
        actions={<AdminBtn icon="ti-user-plus" variant="primary" onClick={openCreate}>کاربر جدید</AdminBtn>}
      />

      <AdminToolbar>
        <AdminSearch value={search} onChange={setSearch} placeholder="جستجو نام، ایمیل، موبایل..." />
        <AdminSelect value={roleFilter} onChange={v => setRoleFilter(v)}>
          <option value="">همه نقش‌ها</option>
          {(Object.keys(ROLE) as Role[]).map(r => <option key={r} value={r}>{ROLE[r]}</option>)}
        </AdminSelect>
        <AdminSelect value={statusFilter} onChange={v => setStatusFilter(v)}>
          <option value="">همه وضعیت‌ها</option>
          {(Object.keys(STATUS_LABEL) as Status[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </AdminSelect>
        <AdminBtn icon="ti-search" onClick={loadUsers}>جستجو</AdminBtn>
      </AdminToolbar>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>کاربر</AdminTh>
            <AdminTh>موبایل</AdminTh>
            <AdminTh>نقش</AdminTh>
            <AdminTh>تاریخ عضویت</AdminTh>
            <AdminTh>سفارشات</AdminTh>
            <AdminTh>وضعیت</AdminTh>
            <AdminTh style={{ width: 140 }}>عملیات</AdminTh>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={7}><AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /></td></tr>}
          {!loading && users.length === 0 && <tr><td colSpan={7}><AdminEmptyState icon="ti-users" title="کاربری یافت نشد" subtitle="فیلترها را تغییر دهید یا کاربر جدید اضافه کنید" /></td></tr>}
          {users.map(u => (
            <AdminTr key={u.id}>
              <AdminTd>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <AdminAvatar name={`${u.firstName} ${u.lastName}`} email={u.email ?? undefined} />
                  <div>
                    <div style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 6 }}>
                      {u.firstName} {u.lastName}
                      {u.id === myId && <AdminBadge variant="orange" size="xs">شما</AdminBadge>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", direction: "ltr", textAlign: "right" }}>{u.email ?? "—"}</div>
                  </div>
                </div>
              </AdminTd>
              <AdminTd><span style={{ direction: "ltr", display: "inline-block" }}>{u.phone ?? "—"}</span></AdminTd>
              <AdminTd><AdminBadge variant={ROLE_BADGE[u.role]}>{ROLE[u.role]}</AdminBadge></AdminTd>
              <AdminTd style={{ color: "var(--text3)", whiteSpace: "nowrap" }}>{fmtDate(u.createdAt)}</AdminTd>
              <AdminTd>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 28, height: 22, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 11, fontWeight: 900, color: "var(--text2)" }}>
                  {u._count?.orders ?? 0}
                </span>
              </AdminTd>
              <AdminTd><AdminBadge variant={STATUS_BADGE[u.status]} dot>{STATUS_LABEL[u.status]}</AdminBadge></AdminTd>
              <AdminTd>
                <div style={{ display: "flex", gap: 4 }}>
                  <AdminBtn icon="ti-edit" size="sm" onClick={() => openEdit(u)}>ویرایش</AdminBtn>
                  <AdminBtn icon="ti-trash" size="sm" variant="danger" loading={deletingId === u.id} disabled={u.id === myId} onClick={() => handleDelete(u)}>{deletingId === u.id ? "..." : "حذف"}</AdminBtn>
                </div>
              </AdminTd>
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>

      <AdminDrawer open={formOpen} onClose={() => setFormOpen(false)} title={form.id ? "ویرایش کاربر" : "کاربر جدید"}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <AdminField label="نام" required><AdminInput value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} placeholder="علی" /></AdminField>
            <AdminField label="نام خانوادگی" required><AdminInput value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} placeholder="رضایی" /></AdminField>
          </div>
          <AdminField label="ایمیل"><AdminInput value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="user@example.com" style={{ direction: "ltr" }} /></AdminField>
          <AdminField label="موبایل" hint="ایمیل یا موبایل، حداقل یکی الزامی است"><AdminInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="09123456789" style={{ direction: "ltr" }} /></AdminField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <AdminField label="نقش"><AdminInputSelect value={form.role} onChange={v => setForm(f => ({ ...f, role: v as Role }))}>{(Object.keys(ROLE) as Role[]).map(r => <option key={r} value={r}>{ROLE[r]}</option>)}</AdminInputSelect></AdminField>
            <AdminField label="وضعیت"><AdminInputSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v as Status }))}>{(Object.keys(STATUS_LABEL) as Status[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</AdminInputSelect></AdminField>
          </div>
          {isSelf && <p style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginTop: -8, marginBottom: 14 }}>نقش و وضعیت حساب خودتان قابل تغییر نیست</p>}
          <AdminField label={form.id ? "رمز جدید (اختیاری)" : "رمز عبور"} required={!form.id}>
            <AdminInput type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} placeholder={form.id ? "برای تغییر وارد کنید" : "حداقل ۶ کاراکتر"} style={{ direction: "ltr" }} />
          </AdminField>
          <AdminDivider />
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn variant="primary" icon="ti-device-floppy" loading={saving} style={{ flex: 1, justifyContent: "center" }}>{saving ? "در حال ذخیره..." : form.id ? "ذخیره تغییرات" : "ایجاد کاربر"}</AdminBtn>
            <AdminBtn variant="secondary" onClick={() => setFormOpen(false)}>انصراف</AdminBtn>
          </div>
        </form>
      </AdminDrawer>
    </div>
  );
}
