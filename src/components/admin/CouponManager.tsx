"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import {
  AdminPageHeader, AdminToolbar, AdminSearch, AdminBtn, AdminTable, AdminTh, AdminTd, AdminTr,
  AdminBadge, AdminEmptyState, AdminDrawer, AdminField, AdminInput, AdminInputSelect,
  AdminToggle, AdminPagination, AdminDivider, AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

interface Coupon {
  id: string; code: string; description: string | null; discountType: string; discountValue: number;
  minOrderAmount: number | null; maxUsageCount: number | null; usedCount: number;
  maxUsagePerUser: number | null; isActive: boolean; startsAt: string | null; expiresAt: string | null; createdAt: string;
}

interface FormData {
  code: string; description: string; discountType: "percent" | "fixed"; discountValue: string;
  minOrderAmount: string; maxUsageCount: string; maxUsagePerUser: string;
  isActive: boolean; startsAt: string; expiresAt: string;
}

const EMPTY: FormData = { code: "", description: "", discountType: "percent", discountValue: "", minOrderAmount: "", maxUsageCount: "", maxUsagePerUser: "", isActive: true, startsAt: "", expiresAt: "" };
const PAGE_SIZE = 25;

function couponStatusVariant(c: Coupon): { label: string; variant: "success" | "danger" | "warning" | "neutral" } {
  if (!c.isActive) return { label: "غیرفعال", variant: "neutral" };
  const now = new Date();
  if (c.expiresAt && new Date(c.expiresAt) < now) return { label: "منقضی", variant: "danger" };
  if (c.startsAt && new Date(c.startsAt) > now) return { label: "هنوز شروع نشده", variant: "warning" };
  if (c.maxUsageCount && c.usedCount >= c.maxUsageCount) return { label: "تمام‌شده", variant: "warning" };
  return { label: "فعال", variant: "success" };
}

function toDateInput(s: string | null) { return s ? new Date(s).toISOString().slice(0, 10) : ""; }

export default function CouponManager() {
  const { toast, showToast } = useAdminToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/coupons?${params}`);
      const data = await res.json();
      setCoupons(data.coupons ?? []); setTotal(data.pagination?.total ?? 0); setPages(data.pagination?.pages ?? 1); setPage(pg);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() { setEditing(null); setForm(EMPTY); setDrawerOpen(true); }
  function openEdit(c: Coupon) {
    setEditing(c);
    setForm({ code: c.code, description: c.description ?? "", discountType: c.discountType as "percent" | "fixed", discountValue: String(c.discountValue), minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "", maxUsageCount: c.maxUsageCount ? String(c.maxUsageCount) : "", maxUsagePerUser: c.maxUsagePerUser ? String(c.maxUsagePerUser) : "", isActive: c.isActive, startsAt: toDateInput(c.startsAt), expiresAt: toDateInput(c.expiresAt) });
    setDrawerOpen(true);
  }

  const set = (k: keyof FormData, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.code.trim()) { showToast("error", "کد تخفیف الزامی است"); return; }
    if (!form.discountValue) { showToast("error", "مقدار تخفیف الزامی است"); return; }
    setSaving(true);
    try {
      const payload = { code: form.code.trim().toUpperCase(), description: form.description || undefined, discountType: form.discountType, discountValue: parseFloat(form.discountValue), minOrderAmount: form.minOrderAmount ? parseInt(form.minOrderAmount) : null, maxUsageCount: form.maxUsageCount ? parseInt(form.maxUsageCount) : null, maxUsagePerUser: form.maxUsagePerUser ? parseInt(form.maxUsagePerUser) : null, isActive: form.isActive, startsAt: form.startsAt || null, expiresAt: form.expiresAt || null };
      const res = await fetch("/api/admin/coupons", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا"); return; }
      showToast("success", editing ? "کوپن بروزرسانی شد" : "کوپن ساخته شد"); setDrawerOpen(false); load(page);
    } finally { setSaving(false); }
  }

  async function handleDelete(c: Coupon) {
    if (!confirm(`آیا از حذف کوپن "${c.code}" مطمئن هستید؟`)) return;
    setDeleting(c.id);
    try {
      const res = await fetch("/api/admin/coupons", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id }) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در حذف"); return; }
      showToast("success", "کوپن حذف شد"); load(page);
    } finally { setDeleting(null); }
  }

  async function toggleActive(c: Coupon) {
    const res = await fetch("/api/admin/coupons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, isActive: !c.isActive }) });
    if (res.ok) { showToast("success", c.isActive ? "کوپن غیرفعال شد" : "کوپن فعال شد"); setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, isActive: !c.isActive } : x)); }
  }

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString("fa-IR") : "—";

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="مدیریت کوپن‌ها" icon="ti-ticket" count={total}
        subtitle="کدهای تخفیف ایجاد و مدیریت کنید"
        actions={<AdminBtn icon="ti-plus" variant="primary" onClick={openCreate}>کوپن جدید</AdminBtn>}
      />

      <AdminToolbar>
        <AdminSearch value={search} onChange={setSearch} placeholder="جستجو کد کوپن..." />
        <AdminBtn icon="ti-search" onClick={() => load(1)}>جستجو</AdminBtn>
      </AdminToolbar>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>کد</AdminTh>
            <AdminTh>تخفیف</AdminTh>
            <AdminTh>حداقل سفارش</AdminTh>
            <AdminTh>استفاده</AdminTh>
            <AdminTh>شروع</AdminTh>
            <AdminTh>انقضا</AdminTh>
            <AdminTh>وضعیت</AdminTh>
            <AdminTh style={{ width: 130 }}>عملیات</AdminTh>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={8}><AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /></td></tr>}
          {!loading && coupons.length === 0 && <tr><td colSpan={8}><AdminEmptyState icon="ti-ticket-off" title="کوپنی یافت نشد" /></td></tr>}
          {coupons.map(c => {
            const st = couponStatusVariant(c);
            return (
              <AdminTr key={c.id}>
                <AdminTd>
                  <div>
                    <code style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 8px", fontSize: 12, fontFamily: "monospace", fontWeight: 900, letterSpacing: 1, direction: "ltr", display: "inline-block" }}>{c.code}</code>
                    {c.description && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>{c.description}</div>}
                  </div>
                </AdminTd>
                <AdminTd style={{ fontWeight: 900, color: "var(--primary)" }}>
                  {c.discountType === "percent" ? `${c.discountValue}٪` : formatPrice(c.discountValue)}
                </AdminTd>
                <AdminTd style={{ color: "var(--text3)" }}>{c.minOrderAmount ? formatPrice(c.minOrderAmount) : "—"}</AdminTd>
                <AdminTd>
                  <span style={{ fontWeight: 700 }}>{c.usedCount.toLocaleString("fa-IR")}</span>
                  {c.maxUsageCount && <span style={{ color: "var(--text3)" }}> / {c.maxUsageCount.toLocaleString("fa-IR")}</span>}
                </AdminTd>
                <AdminTd style={{ color: "var(--text3)", fontSize: 12 }}>{fmtDate(c.startsAt)}</AdminTd>
                <AdminTd style={{ color: "var(--text3)", fontSize: 12 }}>{fmtDate(c.expiresAt)}</AdminTd>
                <AdminTd><AdminBadge variant={st.variant} dot>{st.label}</AdminBadge></AdminTd>
                <AdminTd>
                  <div style={{ display: "flex", gap: 4 }}>
                    <AdminBtn size="sm" icon={c.isActive ? "ti-toggle-right" : "ti-toggle-left"} onClick={() => toggleActive(c)} style={{ color: c.isActive ? "#ea580c" : "#16a34a" }} title={c.isActive ? "غیرفعال کن" : "فعال کن"} />
                    <AdminBtn size="sm" icon="ti-edit" onClick={() => openEdit(c)}>ویرایش</AdminBtn>
                    <AdminBtn size="sm" icon="ti-trash" variant="danger" loading={deleting === c.id} onClick={() => handleDelete(c)} />
                  </div>
                </AdminTd>
              </AdminTr>
            );
          })}
        </tbody>
      </AdminTable>

      {pages > 1 && <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={p => load(p)} />}

      <AdminDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "ویرایش کوپن" : "کوپن جدید"} width={460}>
        <AdminField label="کد تخفیف" required>
          <AdminInput value={form.code} onChange={v => set("code", v.toUpperCase())} placeholder="SUMMER20" style={{ fontFamily: "monospace", letterSpacing: 2, fontWeight: 900, direction: "ltr" }} />
        </AdminField>
        <AdminField label="توضیح (اختیاری)">
          <AdminInput value={form.description} onChange={v => set("description", v)} placeholder="توضیح کوپن..." />
        </AdminField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <AdminField label="نوع تخفیف" required>
            <AdminInputSelect value={form.discountType} onChange={v => set("discountType", v)}>
              <option value="percent">درصدی (%)</option>
              <option value="fixed">مبلغ ثابت</option>
            </AdminInputSelect>
          </AdminField>
          <AdminField label="مقدار تخفیف" required>
            <AdminInput type="number" value={form.discountValue} onChange={v => set("discountValue", v)} placeholder={form.discountType === "percent" ? "20" : "500000"} style={{ direction: "ltr" }} />
          </AdminField>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <AdminField label="حداقل مبلغ سفارش">
            <AdminInput type="number" value={form.minOrderAmount} onChange={v => set("minOrderAmount", v)} placeholder="ریال" style={{ direction: "ltr" }} />
          </AdminField>
          <AdminField label="حداکثر تعداد استفاده">
            <AdminInput type="number" value={form.maxUsageCount} onChange={v => set("maxUsageCount", v)} placeholder="بدون محدودیت" style={{ direction: "ltr" }} />
          </AdminField>
        </div>
        <AdminField label="حداکثر استفاده هر کاربر">
          <AdminInput type="number" value={form.maxUsagePerUser} onChange={v => set("maxUsagePerUser", v)} placeholder="بدون محدودیت" style={{ direction: "ltr" }} />
        </AdminField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <AdminField label="تاریخ شروع">
            <AdminInput type="date" value={form.startsAt} onChange={v => set("startsAt", v)} style={{ direction: "ltr" }} />
          </AdminField>
          <AdminField label="تاریخ انقضا">
            <AdminInput type="date" value={form.expiresAt} onChange={v => set("expiresAt", v)} style={{ direction: "ltr" }} />
          </AdminField>
        </div>
        <AdminField label="وضعیت">
          <AdminToggle checked={form.isActive} onChange={v => set("isActive", v)} label="کوپن فعال است" />
        </AdminField>
        <AdminDivider />
        <AdminBtn variant="primary" icon="ti-device-floppy" loading={saving} onClick={handleSave} style={{ width: "100%", justifyContent: "center" }}>
          {saving ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "ایجاد کوپن"}
        </AdminBtn>
      </AdminDrawer>
    </div>
  );
}
