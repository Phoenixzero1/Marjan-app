"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";

interface ReturnItem {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  adminNote: string | null;
  refundAmount: number | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string | null; phone: string | null };
  order: { orderNumber: string; totalAmount: number; status: string };
}

type Toast = { msg: string; ok: boolean };

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:  { label: "در انتظار بررسی", bg: "#fef9c3", color: "#854d0e" },
  APPROVED: { label: "تأیید شده", bg: "#dcfce7", color: "#16a34a" },
  REJECTED: { label: "رد شده", bg: "#fee2e2", color: "#dc2626" },
};

export default function ReturnsManager() {
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [modal, setModal] = useState<{ id: string; action: "APPROVED" | "REJECTED" } | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  const load = () => {
    setLoading(true);
    fetch("/api/admin/returns").then((r) => r.json()).then((d) => setItems(d.returns ?? [])).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = filterStatus ? items.filter((i) => i.status === filterStatus) : items;

  async function processReturn() {
    if (!modal) return;
    setActing(modal.id);
    const res = await fetch(`/api/admin/returns/${modal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: modal.action, adminNote: adminNote || undefined, refundAmount: refundAmount ? parseInt(refundAmount) : undefined }),
    });
    const d = await res.json();
    setActing(null);
    setModal(null);
    setAdminNote("");
    setRefundAmount("");
    if (res.ok) { showToast(modal.action === "APPROVED" ? "مرجوعی تأیید شد — مبلغ به کیف پول واریز شد" : "مرجوعی رد شد"); load(); }
    else showToast(d.error ?? "خطا", false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>{toast.msg}</div>
      )}

      {/* Confirm modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "var(--radius)", padding: "2rem", width: 440, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)", marginBottom: "1.25rem" }}>
              {modal.action === "APPROVED" ? "تأیید مرجوعی" : "رد مرجوعی"}
            </h3>
            {modal.action === "APPROVED" && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 4 }}>مبلغ بازپرداخت (تومان — خالی بگذارید برای مبلغ کامل)</label>
                <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="مبلغ به تومان" style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, width: "100%", outline: "none" }} />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 4 }}>
                {modal.action === "REJECTED" ? "دلیل رد (برای اطلاع‌رسانی به کاربر)" : "یادداشت ادمین (اختیاری)"}
              </label>
              <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, width: "100%", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setModal(null); setAdminNote(""); setRefundAmount(""); }} style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 20px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>انصراف</button>
              <button onClick={processReturn} disabled={!!acting}
                style={{ background: modal.action === "APPROVED" ? "#16a34a" : "#dc2626", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "9px 24px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: acting ? "not-allowed" : "pointer" }}>
                {acting ? "در حال پردازش..." : modal.action === "APPROVED" ? "تأیید و واریز به کیف پول" : "رد درخواست"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>درخواست‌های مرجوعی</h2>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>{items.filter((i) => i.status === "PENDING").length} در انتظار بررسی</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontFamily: "Vazirmatn", fontSize: 13, background: "#fff" }}>
            <option value="">همه وضعیت‌ها</option>
            <option value="PENDING">در انتظار</option>
            <option value="APPROVED">تأیید شده</option>
            <option value="REJECTED">رد شده</option>
          </select>
          <button onClick={load} style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 14px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <i className="ti ti-refresh" /> بروزرسانی
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
            <i className="ti ti-package-off" style={{ fontSize: 40, display: "block", marginBottom: 10 }} />
            درخواست مرجوعی وجود ندارد
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg)", borderBottom: "2px solid var(--border)" }}>
                {["کاربر", "سفارش", "دلیل", "مبلغ بازپرداخت", "تاریخ درخواست", "وضعیت", "عملیات"].map((h) => (
                  <th key={h} style={{ textAlign: "right", padding: "10px 14px", fontWeight: 900, color: "var(--text3)", fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const st = STATUS_LABELS[item.status] ?? STATUS_LABELS.PENDING;
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--bg)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{item.user.firstName} {item.user.lastName}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{item.user.email ?? item.user.phone}</div>
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--primary)" }}>{item.order.orderNumber}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{item.reason}</div>
                      {item.description && <div style={{ fontSize: 11, color: "var(--text3)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>}
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 900, color: "var(--primary)" }}>{item.refundAmount ? formatPrice(item.refundAmount) : formatPrice(item.order.totalAmount)}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text3)" }}>{new Date(item.createdAt).toLocaleDateString("fa-IR")}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{st.label}</span>
                      {item.adminNote && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{item.adminNote}</div>}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {item.status === "PENDING" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setModal({ id: item.id, action: "APPROVED" }); setRefundAmount(String(item.refundAmount ?? item.order.totalAmount)); }}
                            style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn", color: "#16a34a", display: "flex", alignItems: "center", gap: 3 }}>
                            <i className="ti ti-check" /> تأیید
                          </button>
                          <button onClick={() => setModal({ id: item.id, action: "REJECTED" })}
                            style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn", color: "#dc2626", display: "flex", alignItems: "center", gap: 3 }}>
                            <i className="ti ti-x" /> رد
                          </button>
                        </div>
                      ) : <span style={{ fontSize: 11, color: "var(--text3)" }}>پردازش شده</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
