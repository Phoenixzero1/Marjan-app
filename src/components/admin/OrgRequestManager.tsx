"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminToolbar, AdminSelect, AdminBtn, AdminTable, AdminTh, AdminTd, AdminTr,
  AdminBadge, AdminEmptyState, AdminDrawer, AdminField, AdminTextarea, AdminInputSelect,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

interface OrgRequest {
  id: string; companyName: string; contactName: string; phone: string; email: string | null;
  nationalCode: string | null; category: string | null; estimatedAmount: string | null;
  description: string; status: string; adminNote: string | null; createdAt: string;
}

const STATUS_V: Record<string, "warning" | "info" | "success" | "danger"> = { PENDING: "warning", IN_REVIEW: "info", APPROVED: "success", REJECTED: "danger" };
const STATUS_L: Record<string, string> = { PENDING: "در انتظار بررسی", IN_REVIEW: "در حال بررسی", APPROVED: "تأیید شده", REJECTED: "رد شده" };
const STATUS_OPTIONS = ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"];

export default function OrgRequestManager() {
  const { toast, showToast } = useAdminToast();
  const [requests, setRequests] = useState<OrgRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<OrgRequest | null>(null);
  const [note, setNote] = useState("");
  const [noteStatus, setNoteStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const url = `/api/admin/org-requests${filter ? `?status=${filter}` : ""}`;
    const d = await fetch(url).then(r => r.text()).then(t => { try { return JSON.parse(t); } catch { return null; } });
    setRequests(d?.requests ?? []); setTotal(d?.total ?? 0); setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = (req: OrgRequest) => { setSelected(req); setNote(req.adminNote ?? ""); setNoteStatus(req.status); };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const r = await fetch("/api/admin/org-requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, status: noteStatus, adminNote: note }) });
    const d = await r.text().then(t => { try { return JSON.parse(t); } catch { return null; } });
    setSaving(false);
    if (d?.ok) { setRequests(prev => prev.map(x => x.id === selected.id ? { ...x, status: noteStatus, adminNote: note } : x)); setSelected(null); showToast("success", "تغییرات ذخیره شد"); }
    else showToast("error", "خطا در ذخیره");
  };

  const pending = requests.filter(r => r.status === "PENDING").length;

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="درخواست‌های سازمانی" icon="ti-building" count={total}
        subtitle={pending > 0 ? `${pending} درخواست در انتظار بررسی` : "همه درخواست‌ها بررسی شده‌اند"}
        actions={<AdminBtn icon="ti-refresh" onClick={load}>بروزرسانی</AdminBtn>}
      />

      <AdminToolbar>
        <AdminSelect value={filter} onChange={setFilter}>
          <option value="">همه ({total})</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_L[s]}</option>)}
        </AdminSelect>
        {pending > 0 && <AdminBadge variant="warning" dot>{pending} در انتظار</AdminBadge>}
      </AdminToolbar>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>شرکت</AdminTh>
            <AdminTh>مسئول خرید</AdminTh>
            <AdminTh>تلفن</AdminTh>
            <AdminTh>دسته محصول</AdminTh>
            <AdminTh>تاریخ</AdminTh>
            <AdminTh>وضعیت</AdminTh>
            <AdminTh style={{ width: 100 }}>عملیات</AdminTh>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={7}><AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /></td></tr>}
          {!loading && requests.length === 0 && <tr><td colSpan={7}><AdminEmptyState icon="ti-building-off" title="درخواستی یافت نشد" /></td></tr>}
          {requests.map(req => (
            <AdminTr key={req.id}>
              <AdminTd style={{ fontWeight: 900 }}>{req.companyName}</AdminTd>
              <AdminTd style={{ color: "var(--text2)" }}>{req.contactName}</AdminTd>
              <AdminTd style={{ direction: "ltr", color: "var(--text2)" }}>{req.phone}</AdminTd>
              <AdminTd style={{ fontSize: 12, color: "var(--text3)" }}>{req.category ?? "—"}</AdminTd>
              <AdminTd style={{ fontSize: 12, color: "var(--text3)" }}>{new Date(req.createdAt).toLocaleDateString("fa-IR")}</AdminTd>
              <AdminTd><AdminBadge variant={STATUS_V[req.status] ?? "neutral"} dot>{STATUS_L[req.status] ?? req.status}</AdminBadge></AdminTd>
              <AdminTd><AdminBtn icon="ti-eye" size="sm" onClick={() => openDetail(req)}>مشاهده</AdminBtn></AdminTd>
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>

      <AdminDrawer open={!!selected} onClose={() => setSelected(null)} title="جزئیات درخواست سازمانی" width={460}>
        {selected && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[
                { label: "شرکت", val: selected.companyName },
                { label: "مسئول خرید", val: selected.contactName },
                { label: "تلفن", val: selected.phone },
                { label: "ایمیل", val: selected.email ?? "—" },
                { label: "کد ملی/ثبتی", val: selected.nationalCode ?? "—" },
                { label: "دسته محصول", val: selected.category ?? "—" },
                { label: "مبلغ تخمینی", val: selected.estimatedAmount ?? "—" },
                { label: "تاریخ ثبت", val: new Date(selected.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }) },
              ].map(f => (
                <div key={f.label} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 900, color: "var(--text2)", minWidth: 90, flexShrink: 0 }}>{f.label}:</span>
                  <span style={{ color: "var(--text1)" }}>{f.val}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", marginBottom: 6 }}>توضیحات درخواست</div>
              <div style={{ background: "var(--bg)", padding: "10px 12px", borderRadius: 8, fontSize: 13, lineHeight: 1.7 }}>{selected.description}</div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <AdminField label="وضعیت">
                <AdminInputSelect value={noteStatus} onChange={setNoteStatus}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_L[s]}</option>)}
                </AdminInputSelect>
              </AdminField>
              <AdminField label="یادداشت داخلی">
                <AdminTextarea value={note} onChange={setNote} rows={3} placeholder="یادداشت برای تیم داخلی..." />
              </AdminField>
              <AdminBtn variant="primary" icon="ti-device-floppy" loading={saving} onClick={save} style={{ width: "100%", justifyContent: "center" }}>
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </AdminBtn>
            </div>
          </div>
        )}
      </AdminDrawer>
    </div>
  );
}
