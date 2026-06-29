"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { formatPrice } from "@/lib/utils";
import {
  AdminPageHeader, AdminToolbar, AdminSearch, AdminSelect, AdminBtn,
  AdminTable, AdminTh, AdminTd, AdminTr, AdminBadge, AdminEmptyState,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "RETURNED" | "CANCELLED";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sizeLabel: string | null;
  product: { name: string } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  trackingCode: string | null;
  shippingMethod: string | null;
  notes: string | null;
  createdAt: string;
  deliveredAt: string | null;
  user: { firstName: string; lastName: string; email: string | null; phone: string | null } | null;
  items: OrderItem[];
  payment: { status: string; refId: string | null } | null;
  address: { city: string; province: string } | null;
}

type BadgeVariant = "warning" | "info" | "success" | "neutral" | "danger";

const STATUS: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  PENDING:    { label: "در انتظار",       variant: "warning" },
  CONFIRMED:  { label: "تایید شده",       variant: "info" },
  PROCESSING: { label: "در حال پردازش",   variant: "info" },
  SHIPPED:    { label: "ارسال شده",       variant: "info" },
  DELIVERED:  { label: "تحویل شده",       variant: "success" },
  RETURNED:   { label: "مرجوع شده",       variant: "neutral" },
  CANCELLED:  { label: "لغو شده",         variant: "danger" },
};

const PAYMENT: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING:  { label: "در انتظار پرداخت", variant: "warning" },
  PAID:     { label: "پرداخت شده",       variant: "success" },
  FAILED:   { label: "ناموفق",           variant: "danger" },
  REFUNDED: { label: "مسترد شده",        variant: "neutral" },
};

const inp: React.CSSProperties = {
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13,
  color: "var(--text)", outline: "none", background: "#fff", boxSizing: "border-box",
};
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 };

export default function OrderManager() {
  const { toast, showToast } = useAdminToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>("PENDING");
  const [editTracking, setEditTracking] = useState("");
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (statusFilter) qs.set("status", statusFilter);
    if (search.trim()) qs.set("q", search.trim());
    fetch(`/api/admin/orders?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => showToast("error", "خطا در بارگذاری سفارشات"))
      .finally(() => setLoading(false));
  }, [statusFilter, search, showToast]);

  useEffect(() => { loadOrders(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = (o: Order) => {
    setSelected(o);
    setEditStatus(o.status);
    setEditTracking(o.trackingCode ?? "");
  };

  const closeDetail = () => setSelected(null);

  const saveStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selected.id,
          status: editStatus,
          ...(editTracking.trim() ? { trackingCode: editTracking.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در بروزرسانی سفارش"); return; }
      showToast("success", `سفارش ${selected.orderNumber} بروزرسانی شد`);
      setOrders((prev) => prev.map((o) =>
        o.id === selected.id
          ? { ...o, status: editStatus, trackingCode: editTracking.trim() || o.trackingCode }
          : o
      ));
      closeDetail();
    } catch {
      showToast("error", "خطای سرور");
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ position: "relative" }}>
      <AdminToast toast={toast} />

      <AdminPageHeader
        title="مدیریت سفارشات"
        icon="ti-truck-delivery"
        count={orders.length}
        subtitle="پیگیری و مدیریت سفارشات مشتریان"
      />

      <AdminToolbar>
        <AdminSearch value={search} onChange={setSearch} placeholder="شماره سفارش، ایمیل یا موبایل..." />
        <AdminSelect value={statusFilter} onChange={v => setStatusFilter(v)}>
          <option value="">همه وضعیت‌ها</option>
          {(Object.keys(STATUS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS[s].label}</option>
          ))}
        </AdminSelect>
        <AdminBtn icon="ti-search" onClick={loadOrders}>جستجو</AdminBtn>
      </AdminToolbar>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>شماره سفارش</AdminTh>
            <AdminTh>مشتری</AdminTh>
            <AdminTh>اقلام</AdminTh>
            <AdminTh>مبلغ کل</AdminTh>
            <AdminTh>پرداخت</AdminTh>
            <AdminTh>وضعیت</AdminTh>
            <AdminTh>تاریخ</AdminTh>
            <AdminTh style={{ width: 40 }} />
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={8}><AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /></td></tr>
          )}
          {!loading && orders.length === 0 && (
            <tr><td colSpan={8}><AdminEmptyState icon="ti-truck-off" title="سفارشی یافت نشد" /></td></tr>
          )}
          {orders.map((o) => (
            <AdminTr key={o.id} style={{ cursor: "pointer" }} onClick={() => openDetail(o)}>
              <AdminTd><span style={{ fontWeight: 900, direction: "ltr", display: "inline-block", fontSize: 12 }}>{o.orderNumber}</span></AdminTd>
              <AdminTd>
                <div style={{ fontWeight: 700 }}>{o.user ? `${o.user.firstName} ${o.user.lastName}` : "—"}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{o.user?.phone ?? o.user?.email ?? ""}</div>
              </AdminTd>
              <AdminTd>{o.items.length}</AdminTd>
              <AdminTd><span style={{ fontWeight: 900 }}>{formatPrice(o.totalAmount)}</span></AdminTd>
              <AdminTd>
                <AdminBadge variant={(PAYMENT[o.payment?.status ?? "PENDING"]?.variant) ?? "neutral"} size="xs">
                  {PAYMENT[o.payment?.status ?? "PENDING"]?.label ?? "—"}
                </AdminBadge>
              </AdminTd>
              <AdminTd>
                <AdminBadge variant={STATUS[o.status].variant} size="xs">{STATUS[o.status].label}</AdminBadge>
              </AdminTd>
              <AdminTd style={{ color: "var(--text3)", whiteSpace: "nowrap" }}>{fmtDate(o.createdAt)}</AdminTd>
              <AdminTd><i className="ti ti-chevron-left" style={{ color: "var(--text3)" }} /></AdminTd>
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>

      {/* ── Order Detail Modal (centered, no backdrop dim) ── */}
      {selected && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              pointerEvents: "all",
              width: 900, maxWidth: "96vw", maxHeight: "90vh",
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 24px 80px rgba(10,42,94,0.22), 0 4px 16px rgba(0,0,0,0.10)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              border: "1px solid rgba(10,42,94,0.10)",
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: "1rem 1.5rem", background: "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-truck-delivery" style={{ fontSize: 20, color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", direction: "ltr" }}>{selected.orderNumber}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", marginTop: 2 }}>{fmtDate(selected.createdAt)}</div>
                </div>
                <span style={{ marginRight: 4 }}>
                  <AdminBadge variant={STATUS[selected.status].variant} size="xs">{STATUS[selected.status].label}</AdminBadge>
                </span>
              </div>
              <button type="button" onClick={closeDetail}
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 18, flexShrink: 0 }}>
                <i className="ti ti-x" />
              </button>
            </div>

            {/* Modal Body: 2-column */}
            <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 0 }}>

              {/* Left column: customer + items + payment */}
              <div style={{ padding: "1.25rem 1.25rem 1.25rem 1rem", display: "flex", flexDirection: "column", gap: "1rem", borderLeft: "1px solid var(--border)" }}>

                {/* Customer info */}
                <div style={{ background: "var(--bg)", borderRadius: "var(--radius)", padding: "1rem" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "var(--primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="ti ti-user" style={{ color: "var(--accent)" }} /> اطلاعات مشتری
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 12 }}>
                    <div>
                      <div style={{ color: "var(--text3)", fontSize: 10, marginBottom: 2 }}>نام</div>
                      <div style={{ fontWeight: 900 }}>{selected.user ? `${selected.user.firstName} ${selected.user.lastName}` : "—"}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text3)", fontSize: 10, marginBottom: 2 }}>موبایل</div>
                      <div style={{ fontWeight: 700, direction: "ltr" }}>{selected.user?.phone ?? "—"}</div>
                    </div>
                    {selected.user?.email && (
                      <div style={{ gridColumn: "1/-1" }}>
                        <div style={{ color: "var(--text3)", fontSize: 10, marginBottom: 2 }}>ایمیل</div>
                        <div style={{ fontWeight: 700, direction: "ltr", fontSize: 11 }}>{selected.user.email}</div>
                      </div>
                    )}
                    {selected.address && (
                      <div style={{ gridColumn: "1/-1" }}>
                        <div style={{ color: "var(--text3)", fontSize: 10, marginBottom: 2 }}>آدرس</div>
                        <div style={{ fontWeight: 700 }}>{selected.address.province}، {selected.address.city}</div>
                      </div>
                    )}
                    {selected.shippingMethod && (
                      <div>
                        <div style={{ color: "var(--text3)", fontSize: 10, marginBottom: 2 }}>روش ارسال</div>
                        <div style={{ fontWeight: 700 }}>{selected.shippingMethod}</div>
                      </div>
                    )}
                    {selected.trackingCode && (
                      <div>
                        <div style={{ color: "var(--text3)", fontSize: 10, marginBottom: 2 }}>کد رهگیری</div>
                        <div style={{ fontWeight: 900, color: "var(--primary)", direction: "ltr" }}>{selected.trackingCode}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items table */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "var(--primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="ti ti-package" style={{ color: "var(--accent)" }} /> اقلام سفارش ({selected.items.length} قلم)
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        {["محصول", "تعداد", "قیمت واحد", "جمع"].map(h => (
                          <th key={h} style={{ background: "rgba(10,42,94,0.04)", padding: "7px 10px", textAlign: "right", fontSize: 11, fontWeight: 900, color: "var(--text2)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((it) => (
                        <tr key={it.id} style={{ borderBottom: "1px solid rgba(10,42,94,0.05)" }}>
                          <td style={{ padding: "9px 10px" }}>
                            <div style={{ fontWeight: 700 }}>{it.product?.name ?? "محصول حذف‌شده"}</div>
                            {it.sizeLabel && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{it.sizeLabel}</div>}
                          </td>
                          <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: 700 }}>{it.quantity}</td>
                          <td style={{ padding: "9px 10px", color: "var(--text2)" }}>{formatPrice(it.unitPrice)}</td>
                          <td style={{ padding: "9px 10px", fontWeight: 900, color: "var(--primary)" }}>{formatPrice(it.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Financial summary */}
                  <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--bg)", borderRadius: "var(--radius-sm)", fontSize: 13, display: "flex", flexDirection: "column", gap: 7 }}>
                    <Row label="جمع جزء" value={formatPrice(selected.subtotal)} />
                    {selected.discountAmount > 0 && <Row label="تخفیف" value={`- ${formatPrice(selected.discountAmount)}`} />}
                    <Row label="مالیات (۱۰٪)" value={formatPrice(selected.taxAmount)} />
                    <Row label="هزینه ارسال" value={selected.shippingCost > 0 ? formatPrice(selected.shippingCost) : "رایگان"} />
                    <div style={{ borderTop: "2px solid var(--border)", paddingTop: 8, marginTop: 2 }}>
                      <Row label="مبلغ قابل پرداخت" value={formatPrice(selected.totalAmount)} bold />
                    </div>
                  </div>

                  {/* Payment status */}
                  <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--bg)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 10 }}>
                    <i className="ti ti-credit-card" style={{ color: "var(--primary)", fontSize: 16 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>وضعیت پرداخت:</span>
                    <AdminBadge variant={(PAYMENT[selected.payment?.status ?? "PENDING"]?.variant) ?? "neutral"} size="xs">
                      {PAYMENT[selected.payment?.status ?? "PENDING"]?.label ?? "—"}
                    </AdminBadge>
                    {selected.payment?.refId && (
                      <span style={{ fontSize: 11, color: "var(--text3)", direction: "ltr" }}>{selected.payment.refId}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column: update + invoice */}
              <div style={{ padding: "1.25rem 1rem 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

                {/* Update status */}
                <div style={{ background: "var(--bg)", borderRadius: "var(--radius)", padding: "1.25rem" }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="ti ti-settings" style={{ color: "var(--accent)" }} /> مدیریت سفارش
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={lbl}>وضعیت سفارش</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                      style={{ ...inp, width: "100%", cursor: "pointer" }}>
                      {(Object.keys(STATUS) as OrderStatus[]).map((s) => (
                        <option key={s} value={s}>{STATUS[s].label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={lbl}>کد رهگیری پستی</label>
                    <input value={editTracking} onChange={(e) => setEditTracking(e.target.value)}
                      style={{ ...inp, width: "100%", direction: "ltr", textAlign: "left" }}
                      placeholder="کد رهگیری مرسوله..." />
                  </div>
                  <AdminBtn variant="primary" icon="ti-device-floppy" loading={saving} onClick={saveStatus} style={{ width: "100%", justifyContent: "center" }}>
                    ذخیره تغییرات
                  </AdminBtn>
                </div>

                {/* Quick status timeline */}
                <div style={{ background: "var(--bg)", borderRadius: "var(--radius)", padding: "1rem" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "var(--primary)", marginBottom: 12 }}>
                    <i className="ti ti-timeline" /> مراحل سفارش
                  </div>
                  {(["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED"] as OrderStatus[]).map((s, idx) => {
                    const steps = ["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED"] as const;
                    const currentIdx = steps.indexOf(selected.status as typeof steps[number]);
                    const done = idx <= currentIdx;
                    const active = idx === currentIdx;
                    return (
                      <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: idx < 4 ? 6 : 0 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? (active ? "var(--accent)" : "var(--primary)") : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                          {done && <i className="ti ti-check" style={{ fontSize: 11, color: "#fff" }} />}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: active ? 900 : 700, color: active ? "var(--accent)" : done ? "var(--primary)" : "var(--text3)" }}>
                          {STATUS[s].label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Invoice */}
                <div style={{ background: "var(--bg)", borderRadius: "var(--radius)", padding: "1rem" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "var(--primary)", marginBottom: 10 }}>
                    <i className="ti ti-file-invoice" /> فاکتور
                  </div>
                  <AdminBtn icon="ti-printer" onClick={() => {
                    const w = window.open("", "_blank");
                    if (!w) return;
                    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="UTF-8"><title>فاکتور ${selected.orderNumber}</title><style>body{font-family:Tahoma,sans-serif;font-size:13px;color:#1a1a2e;direction:rtl;padding:2rem;max-width:700px;margin:auto}h1{font-size:20px;color:#0a2a5e;margin:0 0 4px}.sub{font-size:12px;color:#8892aa;margin-bottom:1.5rem}.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #0a2a5e;padding-bottom:1rem;margin-bottom:1.5rem}.info-row{display:flex;gap:2rem;flex-wrap:wrap;margin-bottom:1.5rem}.info-block{flex:1;min-width:160px}label{font-size:11px;color:#8892aa;display:block}p{font-weight:700;margin:2px 0 10px}table{width:100%;border-collapse:collapse;margin-bottom:1.5rem}th,td{padding:9px 12px;text-align:right;font-size:12px}th{background:#f4f6fb;font-weight:900;color:#4a5578}tr:not(:last-child)td{border-bottom:1px solid #dde3f0}.total{text-align:left;font-size:13px}.total td{padding:5px 12px}.total .grand{font-weight:900;font-size:15px;color:#0a2a5e}@media print{button{display:none}}</style></head><body><div class="hdr"><div><h1>فاکتور رسمی</h1><div class="sub">${new Date(selected.createdAt).toLocaleDateString("fa-IR",{year:"numeric",month:"long",day:"numeric"})}</div></div><div style="text-align:left"><strong>شماره: ${selected.orderNumber}</strong></div></div><div class="info-row"><div class="info-block"><label>مشتری</label><p>${selected.user?`${selected.user.firstName} ${selected.user.lastName}`:"—"}</p><label>تماس</label><p>${selected.user?.phone??selected.user?.email??"—"}</p></div><div class="info-block"><label>آدرس تحویل</label><p>${selected.address?`${selected.address.province}، ${selected.address.city}`:"—"}</p><label>کد رهگیری</label><p>${selected.trackingCode??"—"}</p></div></div><table><thead><tr><th>محصول</th><th>سایز</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr></thead><tbody>${selected.items.map(it=>`<tr><td>${it.product?.name??"-"}</td><td>${it.sizeLabel??"-"}</td><td>${it.quantity}</td><td>${it.unitPrice.toLocaleString("fa-IR")} ریال</td><td>${it.totalPrice.toLocaleString("fa-IR")} ریال</td></tr>`).join("")}</tbody></table><table class="total"><tbody><tr><td>جمع جزء</td><td>${selected.subtotal.toLocaleString("fa-IR")} ریال</td></tr>${selected.discountAmount>0?`<tr><td>تخفیف</td><td>- ${selected.discountAmount.toLocaleString("fa-IR")} ریال</td></tr>`:""}<tr><td>مالیات</td><td>${selected.taxAmount.toLocaleString("fa-IR")} ریال</td></tr><tr><td>هزینه ارسال</td><td>${selected.shippingCost>0?selected.shippingCost.toLocaleString("fa-IR")+" ریال":"رایگان"}</td></tr><tr class="grand"><td>مبلغ کل</td><td>${selected.totalAmount.toLocaleString("fa-IR")} ریال</td></tr></tbody></table><script>window.print();</script></body></html>`);
                    w.document.close();
                  }} style={{ width: "100%", justifyContent: "center" }}>
                    چاپ فاکتور رسمی
                  </AdminBtn>
                </div>

                {/* Notes */}
                {selected.notes && (
                  <div style={{ background: "#fffbf0", border: "1px solid #fdeeba", borderRadius: "var(--radius)", padding: "1rem" }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "#b7791f", marginBottom: 6 }}>
                      <i className="ti ti-note" /> یادداشت مشتری
                    </div>
                    <p style={{ fontSize: 12, color: "#744210", margin: 0, lineHeight: 1.7 }}>{selected.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: bold ? "var(--primary)" : "var(--text3)", fontWeight: bold ? 900 : 700 }}>{label}</span>
      <span style={{ fontWeight: 900, color: bold ? "var(--primary)" : "var(--text)", fontSize: bold ? 15 : 13 }}>{value}</span>
    </div>
  );
}
