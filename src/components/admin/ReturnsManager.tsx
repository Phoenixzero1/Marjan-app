"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import {
  AdminPageHeader, AdminToolbar, AdminSelect, AdminBtn, AdminTable, AdminTh, AdminTd, AdminTr,
  AdminBadge, AdminAvatar, AdminEmptyState, AdminModal, AdminField, AdminInput, AdminTextarea,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

interface ReturnItem {
  id: string; reason: string; description: string | null; status: string;
  adminNote: string | null; refundAmount: number | null; createdAt: string;
  user: { firstName: string; lastName: string; email: string | null; phone: string | null };
  order: { orderNumber: string; totalAmount: number; status: string };
}

const STATUS_V: Record<string, "warning" | "success" | "danger"> = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };
const STATUS_L: Record<string, string> = { PENDING: "در انتظار", APPROVED: "تأیید شده", REJECTED: "رد شده" };

export default function ReturnsManager() {
  const { toast, showToast } = useAdminToast();
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [modal, setModal] = useState<{ id: string; action: "APPROVED" | "REJECTED"; totalAmount: number } | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/returns").then(r => r.json()).then(d => setItems(d.returns ?? [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = filterStatus ? items.filter(i => i.status === filterStatus) : items;
  const pending = items.filter(i => i.status === "PENDING").length;

  async function processReturn() {
    if (!modal) return;
    setActing(modal.id);
    try {
      const res = await fetch(`/api/admin/returns/${modal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: modal.action, adminNote: adminNote || undefined, refundAmount: refundAmount ? parseInt(refundAmount) : undefined }) });
      const text = await res.text();
      const d = text ? JSON.parse(text) : {};
      if (res.ok) { showToast("success", modal.action === "APPROVED" ? "مرجوعی تأیید شد — مبلغ به کیف پول واریز شد" : "مرجوعی رد شد"); setModal(null); setAdminNote(""); setRefundAmount(""); load(); }
      else showToast("error", d.error ?? "خطا");
    } finally { setActing(null); }
  }

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="درخواست‌های مرجوعی" icon="ti-arrow-back-up" count={items.length}
        subtitle={pending > 0 ? `${pending} درخواست در انتظار بررسی` : "همه درخواست‌ها بررسی شده‌اند"}
        actions={<AdminBtn icon="ti-refresh" onClick={load}>بروزرسانی</AdminBtn>}
      />

      <AdminToolbar>
        <AdminSelect value={filterStatus} onChange={setFilterStatus}>
          <option value="">همه وضعیت‌ها</option>
          <option value="PENDING">در انتظار</option>
          <option value="APPROVED">تأیید شده</option>
          <option value="REJECTED">رد شده</option>
        </AdminSelect>
        {pending > 0 && <AdminBadge variant="warning" dot>{pending} در انتظار</AdminBadge>}
      </AdminToolbar>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>کاربر</AdminTh>
            <AdminTh>سفارش</AdminTh>
            <AdminTh>دلیل مرجوعی</AdminTh>
            <AdminTh>مبلغ بازپرداخت</AdminTh>
            <AdminTh>تاریخ</AdminTh>
            <AdminTh>وضعیت</AdminTh>
            <AdminTh style={{ width: 140 }}>عملیات</AdminTh>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={7}><AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /></td></tr>}
          {!loading && filtered.length === 0 && <tr><td colSpan={7}><AdminEmptyState icon="ti-package-off" title="درخواست مرجوعی وجود ندارد" /></td></tr>}
          {filtered.map(item => (
            <AdminTr key={item.id}>
              <AdminTd>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AdminAvatar name={`${item.user.firstName} ${item.user.lastName}`} />
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 13 }}>{item.user.firstName} {item.user.lastName}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{item.user.email ?? item.user.phone}</div>
                  </div>
                </div>
              </AdminTd>
              <AdminTd><span style={{ fontWeight: 900, color: "var(--primary)", direction: "ltr", display: "inline-block" }}>{item.order.orderNumber}</span></AdminTd>
              <AdminTd>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{item.reason}</div>
                {item.description && <div style={{ fontSize: 11, color: "var(--text3)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>}
              </AdminTd>
              <AdminTd style={{ fontWeight: 900, color: "var(--primary)" }}>{formatPrice(item.refundAmount ?? item.order.totalAmount)}</AdminTd>
              <AdminTd style={{ color: "var(--text3)", fontSize: 12, whiteSpace: "nowrap" }}>{new Date(item.createdAt).toLocaleDateString("fa-IR")}</AdminTd>
              <AdminTd>
                <AdminBadge variant={STATUS_V[item.status] ?? "neutral"} dot>{STATUS_L[item.status] ?? item.status}</AdminBadge>
                {item.adminNote && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{item.adminNote}</div>}
              </AdminTd>
              <AdminTd>
                {item.status === "PENDING" ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <AdminBtn icon="ti-check" size="sm" variant="primary" style={{ background: "#16a34a", border: "none" }} onClick={() => { setModal({ id: item.id, action: "APPROVED", totalAmount: item.order.totalAmount }); setRefundAmount(String(item.refundAmount ?? item.order.totalAmount)); }}>تأیید</AdminBtn>
                    <AdminBtn icon="ti-x" size="sm" variant="danger" onClick={() => setModal({ id: item.id, action: "REJECTED", totalAmount: item.order.totalAmount })}>رد</AdminBtn>
                  </div>
                ) : <span style={{ fontSize: 11, color: "var(--text3)" }}>پردازش شده</span>}
              </AdminTd>
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>

      <AdminModal open={!!modal} onClose={() => { setModal(null); setAdminNote(""); setRefundAmount(""); }} title={modal?.action === "APPROVED" ? "تأیید مرجوعی" : "رد مرجوعی"} width={480}>
        {modal?.action === "APPROVED" && (
          <AdminField label="مبلغ بازپرداخت (تومان)" hint="خالی بگذارید برای مبلغ کامل سفارش">
            <AdminInput type="number" value={refundAmount} onChange={setRefundAmount} placeholder="مبلغ به تومان" />
          </AdminField>
        )}
        <AdminField label={modal?.action === "REJECTED" ? "دلیل رد (برای اطلاع‌رسانی کاربر)" : "یادداشت ادمین (اختیاری)"}>
          <AdminTextarea value={adminNote} onChange={setAdminNote} rows={3} />
        </AdminField>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <AdminBtn loading={!!acting} onClick={processReturn}
            variant={modal?.action === "APPROVED" ? "primary" : "danger"}
            icon={modal?.action === "APPROVED" ? "ti-check" : "ti-x"}
            style={{ flex: 1, justifyContent: "center", background: modal?.action === "APPROVED" ? "#16a34a" : undefined }}>
            {acting ? "در حال پردازش..." : modal?.action === "APPROVED" ? "تأیید و واریز به کیف پول" : "رد درخواست"}
          </AdminBtn>
          <AdminBtn variant="secondary" onClick={() => { setModal(null); setAdminNote(""); setRefundAmount(""); }}>انصراف</AdminBtn>
        </div>
      </AdminModal>
    </div>
  );
}
