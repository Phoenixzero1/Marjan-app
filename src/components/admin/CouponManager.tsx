"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxUsageCount: number | null;
  usedCount: number;
  maxUsagePerUser: number | null;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

type Toast = { msg: string; ok: boolean };

interface FormData {
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: string;
  minOrderAmount: string;
  maxUsageCount: string;
  maxUsagePerUser: string;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
}

const EMPTY: FormData = {
  code: "", description: "", discountType: "percent", discountValue: "",
  minOrderAmount: "", maxUsageCount: "", maxUsagePerUser: "",
  isActive: true, startsAt: "", expiresAt: "",
};

const inp: React.CSSProperties = {
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13,
  color: "var(--text)", outline: "none", background: "#fff", boxSizing: "border-box", width: "100%",
};
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 };

function couponStatus(c: Coupon): { label: string; bg: string; color: string } {
  if (!c.isActive) return { label: "غیرفعال", bg: "#f1f5f9", color: "#64748b" };
  const now = new Date();
  if (c.expiresAt && new Date(c.expiresAt) < now) return { label: "منقضی", bg: "#fee2e2", color: "#dc2626" };
  if (c.startsAt && new Date(c.startsAt) > now) return { label: "هنوز شروع نشده", bg: "#fff7ed", color: "#ea580c" };
  if (c.maxUsageCount && c.usedCount >= c.maxUsageCount) return { label: "تمام‌شده", bg: "#fef9c3", color: "#ca8a04" };
  return { label: "فعال", bg: "#dcfce7", color: "#16a34a" };
}

function toDateInput(s: string | null) {
  if (!s) return "";
  return new Date(s).toISOString().slice(0, 10);
}

export default function CouponManager() {
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
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/coupons?${params}`);
      const data = await res.json();
      setCoupons(data.coupons ?? []);
      setTotal(data.pagination?.total ?? 0);
      setPages(data.pagination?.pages ?? 1);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setDrawerOpen(true);
  }

  function openEdit(c: Coupon) {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discountType: c.discountType as "percent" | "fixed",
      discountValue: String(c.discountValue),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "",
      maxUsageCount: c.maxUsageCount ? String(c.maxUsageCount) : "",
      maxUsagePerUser: c.maxUsagePerUser ? String(c.maxUsagePerUser) : "",
      isActive: c.isActive,
      startsAt: toDateInput(c.startsAt),
      expiresAt: toDateInput(c.expiresAt),
    });
    setDrawerOpen(true);
  }

  const set = (k: keyof FormData, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.code.trim()) { showToast("کد تخفیف الزامی است", false); return; }
    if (!form.discountValue) { showToast("مقدار تخفیف الزامی است", false); return; }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minOrderAmount: form.minOrderAmount ? parseInt(form.minOrderAmount) : null,
        maxUsageCount: form.maxUsageCount ? parseInt(form.maxUsageCount) : null,
        maxUsagePerUser: form.maxUsagePerUser ? parseInt(form.maxUsagePerUser) : null,
        isActive: form.isActive,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
      };
      const method = editing ? "PATCH" : "POST";
      const body = editing ? { id: editing.id, ...payload } : payload;
      const res = await fetch("/api/admin/coupons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "خطا در ذخیره کوپن", false); return; }
      showToast(editing ? "کوپن بروزرسانی شد" : "کوپن ساخته شد");
      setDrawerOpen(false);
      load(page);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Coupon) {
    if (!confirm(`آیا از حذف کوپن "${c.code}" مطمئن هستید؟`)) return;
    setDeleting(c.id);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "خطا در حذف", false); return; }
      showToast("کوپن حذف شد");
      load(page);
    } finally {
      setDeleting(null);
    }
  }

  async function toggleActive(c: Coupon) {
    const res = await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, isActive: !c.isActive }),
    });
    if (res.ok) {
      showToast(c.isActive ? "کوپن غیرفعال شد" : "کوپن فعال شد");
      setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, isActive: !c.isActive } : x));
    }
  }

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString("fa-IR") : "—";

  return (
    <div style={{ position: "relative" }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>مدیریت کوپن‌ها</h2>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>{total.toLocaleString("fa-IR")} کوپن تخفیف</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "9px 18px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <i className="ti ti-plus" /> کوپن جدید
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(1)}
          placeholder="جستجو کد کوپن..."
          style={{ ...inp, maxWidth: 260, width: "auto" }}
        />
        <button onClick={() => load(1)} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "9px 16px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>جستجو</button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 780 }}>
          <thead>
            <tr style={{ background: "var(--surface)", borderBottom: "2px solid var(--border)" }}>
              {["کد", "توضیح", "تخفیف", "حداقل سفارش", "استفاده", "شروع", "انقضا", "وضعیت", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 900, color: "var(--text2)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
                <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />در حال بارگذاری...
              </td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>کوپنی یافت نشد</td></tr>
            ) : coupons.map((c, i) => {
              const st = couponStatus(c);
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "#fff" : "var(--surface)" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <code style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 8px", fontSize: 12, fontFamily: "monospace", fontWeight: 900, letterSpacing: 1 }}>{c.code}</code>
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--text3)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description ?? "—"}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 900 }}>
                    {c.discountType === "percent"
                      ? `${c.discountValue}٪`
                      : formatPrice(c.discountValue)}
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--text3)" }}>
                    {c.minOrderAmount ? formatPrice(c.minOrderAmount) : "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontWeight: 700 }}>{c.usedCount.toLocaleString("fa-IR")}</span>
                    {c.maxUsageCount && <span style={{ color: "var(--text3)" }}> / {c.maxUsageCount.toLocaleString("fa-IR")}</span>}
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--text3)", whiteSpace: "nowrap" }}>{fmtDate(c.startsAt)}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text3)", whiteSpace: "nowrap" }}>{fmtDate(c.expiresAt)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{st.label}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => toggleActive(c)} title={c.isActive ? "غیرفعال کن" : "فعال کن"} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: c.isActive ? "#ea580c" : "#16a34a" }}>
                        <i className={`ti ${c.isActive ? "ti-toggle-right" : "ti-toggle-left"}`} style={{ fontSize: 14 }} />
                      </button>
                      <button onClick={() => openEdit(c)} title="ویرایش" style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: "var(--text2)" }}>
                        <i className="ti ti-edit" style={{ fontSize: 14 }} />
                      </button>
                      <button onClick={() => handleDelete(c)} disabled={deleting === c.id} title="حذف" style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: "#ef4444" }}>
                        <i className="ti ti-trash" style={{ fontSize: 14 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
          <button onClick={() => load(page - 1)} disabled={page <= 1} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer", opacity: page <= 1 ? .5 : 1 }}>قبلی</button>
          <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "var(--text2)", padding: "0 8px" }}>
            {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}
          </span>
          <button onClick={() => load(page + 1)} disabled={page >= pages} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer", opacity: page >= pages ? .5 : 1 }}>بعدی</button>
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9998, display: "flex", justifyContent: "flex-start" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: "100%", height: "100%", background: "var(--bg)", overflowY: "auto", boxShadow: "0 0 40px rgba(0,0,0,.3)", display: "flex", flexDirection: "column" }}>
            {/* Drawer header */}
            <div style={{ padding: "1rem 1.5rem", background: "#fff", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "var(--primary)" }}>
                {editing ? "ویرایش کوپن" : "کوپن جدید"}
              </h3>
              <button onClick={() => setDrawerOpen(false)} style={{ background: "transparent", border: "none", fontSize: 22, color: "var(--text3)", cursor: "pointer" }}>
                <i className="ti ti-x" />
              </button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
              {/* Code */}
              <div>
                <label style={lbl}>کد تخفیف *</label>
                <input
                  value={form.code}
                  onChange={e => set("code", e.target.value.toUpperCase())}
                  placeholder="مثال: SUMMER20"
                  style={{ ...inp, fontFamily: "monospace", letterSpacing: 2, fontWeight: 900 }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={lbl}>توضیح</label>
                <input value={form.description} onChange={e => set("description", e.target.value)} placeholder="توضیح اختیاری..." style={inp} />
              </div>

              {/* Discount type + value */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>نوع تخفیف *</label>
                  <select value={form.discountType} onChange={e => set("discountType", e.target.value)} style={{ ...inp }}>
                    <option value="percent">درصدی (%)</option>
                    <option value="fixed">مبلغ ثابت (ریال)</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>مقدار تخفیف *</label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={e => set("discountValue", e.target.value)}
                    placeholder={form.discountType === "percent" ? "مثال: ۲۰" : "مثال: ۵۰۰۰۰۰"}
                    style={{ ...inp, direction: "ltr", textAlign: "left" }}
                  />
                </div>
              </div>

              {/* Limits */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>حداقل مبلغ سفارش</label>
                  <input type="number" value={form.minOrderAmount} onChange={e => set("minOrderAmount", e.target.value)} placeholder="ریال" style={{ ...inp, direction: "ltr", textAlign: "left" }} />
                </div>
                <div>
                  <label style={lbl}>حداکثر تعداد استفاده</label>
                  <input type="number" value={form.maxUsageCount} onChange={e => set("maxUsageCount", e.target.value)} placeholder="بدون محدودیت" style={{ ...inp, direction: "ltr", textAlign: "left" }} />
                </div>
              </div>

              <div>
                <label style={lbl}>حداکثر استفاده هر کاربر</label>
                <input type="number" value={form.maxUsagePerUser} onChange={e => set("maxUsagePerUser", e.target.value)} placeholder="بدون محدودیت" style={{ ...inp, direction: "ltr", textAlign: "left" }} />
              </div>

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>تاریخ شروع</label>
                  <DatePicker value={form.startsAt} onChange={val => set("startsAt", val)} />
                </div>
                <div>
                  <label style={lbl}>تاریخ انقضا</label>
                  <DatePicker value={form.expiresAt} onChange={val => set("expiresAt", val)} />
                </div>
              </div>

              {/* Active toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)" }}>
                <input type="checkbox" id="coupon-active" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                <label htmlFor="coupon-active" style={{ fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--text)" }}>کوپن فعال است</label>
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ marginTop: "auto", width: "100%", background: saving ? "#aaa" : "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "13px", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 900, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {saving ? <><i className="ti ti-loader-2" /> در حال ذخیره...</> : <><i className="ti ti-device-floppy" /> ذخیره کوپن</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
