"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";

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

const STATUS: Record<OrderStatus, { label: string; pill: string }> = {
  PENDING: { label: "در انتظار", pill: "pill-orange" },
  CONFIRMED: { label: "تایید شده", pill: "pill-blue" },
  PROCESSING: { label: "در حال پردازش", pill: "pill-blue" },
  SHIPPED: { label: "ارسال شده", pill: "pill-blue" },
  DELIVERED: { label: "تحویل شده", pill: "pill-green" },
  RETURNED: { label: "مرجوع شده", pill: "pill-gray" },
  CANCELLED: { label: "لغو شده", pill: "pill-red" },
};

const PAYMENT: Record<string, { label: string; pill: string }> = {
  PENDING: { label: "در انتظار پرداخت", pill: "pill-orange" },
  PAID: { label: "پرداخت شده", pill: "pill-green" },
  FAILED: { label: "ناموفق", pill: "pill-red" },
  REFUNDED: { label: "مسترد شده", pill: "pill-gray" },
};

const inp: React.CSSProperties = {
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13,
  color: "var(--text)", outline: "none", background: "#fff", boxSizing: "border-box",
};
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 };

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>("PENDING");
  const [editTracking, setEditTracking] = useState("");
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

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

  // Reload when the status filter changes; search is applied via the button / Enter
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
          onKeyDown={(e) => e.key === "Enter" && loadOrders()}
          placeholder="شماره سفارش، ایمیل یا موبایل..."
          style={{ ...inp, maxWidth: 280, flex: "1 1 200px" }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
          <option value="">همه وضعیت‌ها</option>
          {(Object.keys(STATUS) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
        <button onClick={loadOrders} style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "9px 16px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <i className="ti ti-search" /> جستجو
        </button>
        <div style={{ marginRight: "auto", fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          {loading ? "..." : `${orders.length} سفارش`}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 }}>
          <thead>
            <tr>
              {["شماره سفارش", "مشتری", "اقلام", "مبلغ کل", "پرداخت", "وضعیت", "تاریخ", ""].map((h) => (
                <th key={h} style={{ background: "var(--bg)", padding: "10px 12px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }} onClick={() => openDetail(o)}>
                <td style={{ padding: "10px 12px", fontWeight: 900, direction: "ltr", textAlign: "right", fontSize: 12 }}>{o.orderNumber}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontWeight: 700 }}>{o.user ? `${o.user.firstName} ${o.user.lastName}` : "—"}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{o.user?.phone ?? o.user?.email ?? ""}</div>
                </td>
                <td style={{ padding: "10px 12px" }}>{o.items.length}</td>
                <td style={{ padding: "10px 12px", fontWeight: 900 }}>{formatPrice(o.totalAmount)}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span className={PAYMENT[o.payment?.status ?? "PENDING"]?.pill ?? "pill-gray"} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block", whiteSpace: "nowrap" }}>
                    {PAYMENT[o.payment?.status ?? "PENDING"]?.label ?? "—"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span className={STATUS[o.status].pill} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block", whiteSpace: "nowrap" }}>
                    {STATUS[o.status].label}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: "var(--text3)", whiteSpace: "nowrap" }}>{fmtDate(o.createdAt)}</td>
                <td style={{ padding: "10px 12px" }}>
                  <i className="ti ti-chevron-left" style={{ color: "var(--text3)" }} />
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>سفارشی یافت نشد</td></tr>
            )}
            {loading && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
                <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} /> در حال بارگذاری...
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div onClick={closeDetail} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9998, display: "flex", justifyContent: "flex-start" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 480, maxWidth: "100%", height: "100%", background: "var(--bg)", overflowY: "auto", boxShadow: "0 0 40px rgba(0,0,0,.3)", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "1rem 1.5rem", background: "#fff", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 1 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", margin: 0, direction: "ltr", textAlign: "right" }}>{selected.orderNumber}</h3>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{fmtDate(selected.createdAt)}</div>
              </div>
              <button type="button" onClick={closeDetail} style={{ background: "transparent", border: "none", fontSize: 22, color: "var(--text3)", cursor: "pointer", lineHeight: 1, minWidth: 32, minHeight: 32 }}>
                <i className="ti ti-x" />
              </button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", flex: 1 }}>
              {/* Customer */}
              <section style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-user" /> مشتری
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{selected.user ? `${selected.user.firstName} ${selected.user.lastName}` : "—"}</div>
                {selected.user?.phone && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3, direction: "ltr", textAlign: "right" }}>{selected.user.phone}</div>}
                {selected.user?.email && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3, direction: "ltr", textAlign: "right" }}>{selected.user.email}</div>}
                {selected.address && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}><i className="ti ti-map-pin" /> {selected.address.province}، {selected.address.city}</div>}
              </section>

              {/* Items */}
              <section style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-package" /> اقلام ({selected.items.length})
                </div>
                {selected.items.map((it) => (
                  <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{it.product?.name ?? "محصول حذف‌شده"}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>
                        {it.quantity} × {formatPrice(it.unitPrice)}{it.sizeLabel ? ` — ${it.sizeLabel}` : ""}
                      </div>
                    </div>
                    <div style={{ fontWeight: 900 }}>{formatPrice(it.totalPrice)}</div>
                  </div>
                ))}
                {/* Totals */}
                <div style={{ marginTop: 12, fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Row label="جمع جزء" value={formatPrice(selected.subtotal)} />
                  {selected.discountAmount > 0 && <Row label="تخفیف" value={`- ${formatPrice(selected.discountAmount)}`} />}
                  <Row label="مالیات" value={formatPrice(selected.taxAmount)} />
                  <Row label="هزینه ارسال" value={selected.shippingCost > 0 ? formatPrice(selected.shippingCost) : "رایگان"} />
                  <div style={{ borderTop: "1.5px solid var(--border)", paddingTop: 8, marginTop: 2 }}>
                    <Row label="مبلغ کل" value={formatPrice(selected.totalAmount)} bold />
                  </div>
                </div>
              </section>

              {/* Payment */}
              <section style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-credit-card" /> پرداخت
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className={PAYMENT[selected.payment?.status ?? "PENDING"]?.pill ?? "pill-gray"} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20 }}>
                    {PAYMENT[selected.payment?.status ?? "PENDING"]?.label ?? "—"}
                  </span>
                  {selected.payment?.refId && <span style={{ fontSize: 12, color: "var(--text3)", direction: "ltr" }}>کد رهگیری: {selected.payment.refId}</span>}
                </div>
              </section>

              {/* Update status */}
              <section style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-edit" /> بروزرسانی وضعیت
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={lbl}>وضعیت سفارش</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as OrderStatus)} style={{ ...inp, width: "100%", cursor: "pointer" }}>
                    {(Object.keys(STATUS) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>کد رهگیری پستی</label>
                  <input value={editTracking} onChange={(e) => setEditTracking(e.target.value)} style={{ ...inp, width: "100%", direction: "ltr", textAlign: "left" }} placeholder="کد رهگیری مرسوله..." />
                </div>
                <button onClick={saveStatus} disabled={saving} style={{ width: "100%", background: saving ? "#aaa" : "var(--primary)", color: "#fff", border: "none", padding: "12px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 900, fontFamily: "Vazirmatn", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {saving ? <><i className="ti ti-loader-2" /> در حال ذخیره...</> : <><i className="ti ti-device-floppy" /> ذخیره تغییرات</>}
                </button>
              </section>

              {/* Invoice download */}
              <section style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-file-invoice" /> فاکتور و ارسال
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      const w = window.open("", "_blank");
                      if (!w) return;
                      w.document.write(`<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="UTF-8"><title>فاکتور ${selected.orderNumber}</title><style>body{font-family:Tahoma,sans-serif;font-size:13px;color:#1a1a2e;direction:rtl;padding:2rem;max-width:700px;margin:auto}h1{font-size:20px;color:#0a2a5e;margin:0 0 4px}.sub{font-size:12px;color:#8892aa;margin-bottom:1.5rem}.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #0a2a5e;padding-bottom:1rem;margin-bottom:1.5rem}.info-row{display:flex;gap:2rem;flex-wrap:wrap;margin-bottom:1.5rem}.info-block{flex:1;min-width:160px}label{font-size:11px;color:#8892aa;display:block}p{font-weight:700;margin:2px 0 10px}table{width:100%;border-collapse:collapse;margin-bottom:1.5rem}th,td{padding:9px 12px;text-align:right;font-size:12px}th{background:#f4f6fb;font-weight:900;color:#4a5578}tr:not(:last-child)td{border-bottom:1px solid #dde3f0}.total{text-align:left;font-size:13px}.total td{padding:5px 12px}.total .grand{font-weight:900;font-size:15px;color:#0a2a5e}@media print{button{display:none}}</style></head><body>
                      <div class="hdr"><div><h1>فاکتور رسمی</h1><div class="sub">${new Date(selected.createdAt).toLocaleDateString("fa-IR",{year:"numeric",month:"long",day:"numeric"})}</div></div><div style="text-align:left"><strong>شماره: ${selected.orderNumber}</strong></div></div>
                      <div class="info-row"><div class="info-block"><label>مشتری</label><p>${selected.user ? `${selected.user.firstName} ${selected.user.lastName}` : "—"}</p><label>تماس</label><p>${selected.user?.phone ?? selected.user?.email ?? "—"}</p></div><div class="info-block"><label>آدرس تحویل</label><p>${selected.address ? `${selected.address.province}، ${selected.address.city}` : "—"}</p><label>کد رهگیری</label><p>${selected.trackingCode ?? "—"}</p></div></div>
                      <table><thead><tr><th>محصول</th><th>سایز</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr></thead><tbody>${selected.items.map(it=>`<tr><td>${it.product?.name??"-"}</td><td>${it.sizeLabel??"-"}</td><td>${it.quantity}</td><td>${it.unitPrice.toLocaleString("fa-IR")} ریال</td><td>${it.totalPrice.toLocaleString("fa-IR")} ریال</td></tr>`).join("")}</tbody></table>
                      <table class="total"><tbody><tr><td>جمع جزء</td><td>${selected.subtotal.toLocaleString("fa-IR")} ریال</td></tr>${selected.discountAmount>0?`<tr><td>تخفیف</td><td>- ${selected.discountAmount.toLocaleString("fa-IR")} ریال</td></tr>`:""}<tr><td>مالیات</td><td>${selected.taxAmount.toLocaleString("fa-IR")} ریال</td></tr><tr><td>هزینه ارسال</td><td>${selected.shippingCost>0?selected.shippingCost.toLocaleString("fa-IR")+" ریال":"رایگان"}</td></tr><tr class="grand"><td>مبلغ کل</td><td>${selected.totalAmount.toLocaleString("fa-IR")} ریال</td></tr></tbody></table>
                      <script>window.print();</script></body></html>`);
                      w.document.close();
                    }}
                    style={{ background: "var(--bg)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 16px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <i className="ti ti-file-invoice" /> چاپ فاکتور
                  </button>
                  {selected.trackingCode && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text3)", background: "var(--bg)", padding: "9px 14px", borderRadius: "var(--radius-sm)" }}>
                      <i className="ti ti-truck-delivery" />
                      کد رهگیری: <strong style={{ color: "var(--primary)", direction: "ltr" }}>{selected.trackingCode}</strong>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
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
