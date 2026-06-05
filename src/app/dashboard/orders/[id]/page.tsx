"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice, getStatusLabel } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sizeLabel: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    images: { url: string; altText: string | null }[];
  };
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  couponCode: string | null;
  notes: string | null;
  trackingCode: string | null;
  shippingMethod: string | null;
  createdAt: string;
  deliveredAt: string | null;
  items: OrderItem[];
  payment: {
    status: string;
    refId: string | null;
    amount: number;
    paidAt: string | null;
  } | null;
  address: {
    label: string | null;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    fullName: string;
    phone: string;
  } | null;
}

interface ReturnRequest {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
}

const STATUS_STEPS = [
  { key: "PENDING", label: "ثبت سفارش", icon: "ti-shopping-cart" },
  { key: "CONFIRMED", label: "تأیید شده", icon: "ti-circle-check" },
  { key: "PROCESSING", label: "در حال آماده‌سازی", icon: "ti-package" },
  { key: "SHIPPED", label: "ارسال شد", icon: "ti-truck-delivery" },
  { key: "DELIVERED", label: "تحویل داده شد", icon: "ti-home-check" },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

function getStepIndex(status: string) {
  if (status === "CANCELLED") return -1;
  if (status === "RETURNED") return 4;
  return STATUS_ORDER.indexOf(status);
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [returnReq, setReturnReq] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(false);
  const [returnForm, setReturnForm] = useState({ reason: "", description: "" });
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`/api/orders/${orderId}`).then((r) => r.json()),
      fetch(`/api/orders/${orderId}/return`).then((r) => r.json()),
    ])
      .then(([orderData, returnData]) => {
        if (orderData.order) setOrder(orderData.order);
        if (returnData.returnRequest) setReturnReq(returnData.returnRequest);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  async function handleReturnSubmit() {
    if (!returnForm.reason.trim()) { setReturnError("دلیل مرجوعی را وارد کنید"); return; }
    setReturning(true);
    setReturnError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(returnForm),
      });
      const data = await res.json();
      if (!res.ok) { setReturnError(data.error ?? "خطا در ثبت درخواست"); return; }
      setReturnReq(data.returnRequest);
      setShowReturnForm(false);
      showToast("درخواست مرجوعی با موفقیت ثبت شد");
    } catch {
      setReturnError("خطای سرور");
    } finally {
      setReturning(false);
    }
  }

  function handleDownloadInvoice() {
    // Opens the invoice in a new tab — user can then print / Save as PDF
    window.open(`/api/orders/${orderId}/invoice`, "_blank");
  }

  const canReturn = order?.status === "DELIVERED" && !returnReq && (() => {
    if (!order.deliveredAt) return true;
    return (Date.now() - new Date(order.deliveredAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
  })();

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "5rem" }}>
      <i className="ti ti-loader-2" style={{ fontSize: 32, color: "var(--primary)", animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!order) return (
    <div style={{ textAlign: "center", padding: "5rem" }}>
      <i className="ti ti-file-x" style={{ fontSize: 48, color: "var(--text3)", display: "block", marginBottom: 12 }} />
      <p style={{ color: "var(--text3)" }}>سفارش یافت نشد</p>
      <Link href="/dashboard/orders" style={{ color: "var(--primary)", fontWeight: 700 }}>بازگشت به سفارش‌ها</Link>
    </div>
  );

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === "CANCELLED";
  const statusInfo = getStatusLabel(order.status);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "Vazirmatn, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text2)", fontFamily: "Vazirmatn" }}>
            <i className="ti ti-arrow-right" /> بازگشت
          </button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: "var(--primary)", margin: 0 }}>جزئیات سفارش</h1>
            <p style={{ fontSize: 12, color: "var(--text3)", margin: "2px 0 0" }}>سفارش #{order.orderNumber}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleDownloadInvoice}
            style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <i className="ti ti-file-invoice" style={{ fontSize: 14 }} />
            مشاهده / چاپ فاکتور
          </button>
        </div>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", margin: "0 0 1.25rem" }}>وضعیت سفارش</h2>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
            {/* Progress line */}
            <div style={{ position: "absolute", top: 16, right: "10%", left: "10%", height: 3, background: "var(--border)", borderRadius: 2, zIndex: 0 }} />
            <div style={{ position: "absolute", top: 16, right: "10%", height: 3, background: "var(--primary)", borderRadius: 2, zIndex: 1, width: `${Math.max(0, currentStep) / (STATUS_STEPS.length - 1) * 80}%`, transition: "width .4s ease" }} />

            {STATUS_STEPS.map((step, i) => {
              const done = currentStep >= i;
              const active = currentStep === i;
              return (
                <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, position: "relative", zIndex: 2 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: done ? "var(--primary)" : "var(--bg)",
                    border: `3px solid ${done ? "var(--primary)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: active ? "0 0 0 4px rgba(var(--primary-rgb),.15)" : "none",
                    transition: "all .3s",
                  }}>
                    <i className={`ti ${step.icon}`} style={{ fontSize: 16, color: done ? "#fff" : "var(--text3)" }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: done ? "var(--primary)" : "var(--text3)", textAlign: "center", lineHeight: 1.3 }}>{step.label}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
            <span className={statusInfo.class} style={{ fontSize: 12, fontWeight: 900, padding: "4px 14px", borderRadius: 20 }}>{statusInfo.label}</span>
            <span style={{ fontSize: 12, color: "var(--text3)" }}>تاریخ سفارش: {fmtDate(order.createdAt)}</span>
            {order.deliveredAt && <span style={{ fontSize: 12, color: "#16a34a" }}>تحویل: {fmtDate(order.deliveredAt)}</span>}
          </div>
        </div>
      )}

      {isCancelled && (
        <div style={{ background: "#fee2e2", border: "1.5px solid #fca5a5", borderRadius: "var(--radius)", padding: "1rem 1.5rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-circle-x" style={{ fontSize: 22, color: "#dc2626", flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#991b1b" }}>این سفارش لغو شده است</span>
        </div>
      )}

      {/* Tracking Code */}
      {order.trackingCode && (
        <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "var(--radius)", padding: "1rem 1.5rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-truck-delivery" style={{ fontSize: 22, color: "#2563eb", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, color: "#1e40af", fontWeight: 700 }}>کد رهگیری مرسوله</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#1e3a8a", letterSpacing: 2, direction: "ltr" }}>{order.trackingCode}</div>
            </div>
          </div>
          <a
            href={`https://tracking.post.ir/?id=${order.trackingCode}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: "#2563eb", color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 12, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
          >
            <i className="ti ti-map-pin" style={{ fontSize: 14 }} /> رهگیری مرسوله
          </a>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
        {/* Payment Info */}
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem" }}>
          <h3 style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-credit-card" /> اطلاعات پرداخت
          </h3>
          {order.payment ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text3)" }}>وضعیت:</span>
                <span className={getStatusLabel(order.payment.status).class} style={{ fontSize: 11, fontWeight: 900, padding: "2px 10px", borderRadius: 20 }}>
                  {getStatusLabel(order.payment.status).label}
                </span>
              </div>
              {order.payment.refId && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text3)" }}>کد پیگیری:</span>
                  <span style={{ fontWeight: 700, direction: "ltr" }}>{order.payment.refId}</span>
                </div>
              )}
              {order.payment.paidAt && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text3)" }}>تاریخ پرداخت:</span>
                  <span style={{ fontWeight: 700 }}>{fmtDate(order.payment.paidAt)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text3)" }}>مبلغ پرداختی:</span>
                <span style={{ fontWeight: 900, color: "var(--primary)" }}>{formatPrice(order.payment.amount)}</span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text3)" }}>پرداخت ثبت نشده</p>
          )}
        </div>

        {/* Delivery Address */}
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem" }}>
          <h3 style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-map-pin" /> آدرس تحویل
          </h3>
          {order.address ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{order.address.fullName}</div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>{order.address.phone}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
                {order.address.province}، {order.address.city}، {order.address.address}
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>کد پستی: {order.address.postalCode}</div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text3)" }}>آدرس ثبت نشده</p>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", margin: "0 0 1.25rem" }}>اقلام سفارش</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {order.items.map((item, i) => (
            <div key={item.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: i < order.items.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, background: "var(--bg)", overflow: "hidden", flexShrink: 0 }}>
                {item.product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.product.images[0].url} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-package" style={{ fontSize: 22, color: "var(--text3)" }} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/product/${item.product.slug}`} style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.product.name}
                </Link>
                {item.product.sku && <div style={{ fontSize: 11, color: "var(--text3)" }}>SKU: {item.product.sku}</div>}
                {item.sizeLabel && <div style={{ fontSize: 11, color: "var(--text3)" }}>سایز: {item.sizeLabel}</div>}
              </div>
              <div style={{ textAlign: "left", flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>× {item.quantity}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{formatPrice(item.unitPrice)}</div>
                <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 900 }}>{formatPrice(item.totalPrice)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Totals */}
        <div style={{ borderTop: "2px solid var(--border)", paddingTop: "1rem", marginTop: ".5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320, marginRight: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--text3)" }}>جمع اقلام:</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text3)" }}>تخفیف{order.couponCode ? ` (${order.couponCode})` : ""}:</span>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            {order.shippingCost > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text3)" }}>هزینه ارسال:</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text3)" }}>مالیات:</span>
                <span>{formatPrice(order.taxAmount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
              <span>مبلغ کل:</span>
              <span style={{ color: "var(--primary)" }}>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Return Section */}
      {(canReturn || returnReq) && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem" }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-arrow-back-up" /> مرجوعی کالا
          </h2>

          {returnReq ? (
            <div style={{ background: returnReq.status === "APPROVED" ? "#dcfce7" : returnReq.status === "REJECTED" ? "#fee2e2" : "#fef3c7", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: returnReq.status === "APPROVED" ? "#166534" : returnReq.status === "REJECTED" ? "#991b1b" : "#92400e" }}>
                {returnReq.status === "PENDING" && "درخواست مرجوعی ثبت شده — در انتظار بررسی"}
                {returnReq.status === "APPROVED" && "✅ درخواست مرجوعی تأیید شد — مبلغ به کیف پول اضافه شد"}
                {returnReq.status === "REJECTED" && "❌ درخواست مرجوعی رد شد"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>دلیل: {returnReq.reason}</div>
            </div>
          ) : canReturn && !showReturnForm ? (
            <div>
              <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 12 }}>می‌توانید تا ۷ روز پس از تحویل، درخواست مرجوعی ثبت کنید.</p>
              <button
                onClick={() => setShowReturnForm(true)}
                style={{ background: "#fef3c7", color: "#92400e", border: "1.5px solid #fcd34d", borderRadius: 8, padding: "9px 20px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                <i className="ti ti-arrow-back-up" style={{ fontSize: 15 }} /> درخواست مرجوعی
              </button>
            </div>
          ) : canReturn && showReturnForm ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 5 }}>دلیل مرجوعی <span style={{ color: "#dc2626" }}>*</span></label>
                <select
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm((p) => ({ ...p, reason: e.target.value }))}
                  style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, background: "#fff" }}
                >
                  <option value="">انتخاب کنید...</option>
                  <option value="کالا معیوب است">کالا معیوب است</option>
                  <option value="کالا با توضیحات مطابقت ندارد">کالا با توضیحات مطابقت ندارد</option>
                  <option value="کالای اشتباه ارسال شده">کالای اشتباه ارسال شده</option>
                  <option value="پشیمانی از خرید">پشیمانی از خرید</option>
                  <option value="سایر">سایر</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 5 }}>توضیحات (اختیاری)</label>
                <textarea
                  value={returnForm.description}
                  onChange={(e) => setReturnForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="توضیحات بیشتر..."
                  style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
              {returnError && <p style={{ color: "#dc2626", fontSize: 12, margin: 0 }}>{returnError}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleReturnSubmit}
                  disabled={returning}
                  style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: returning ? "not-allowed" : "pointer", opacity: returning ? .7 : 1 }}
                >
                  {returning ? "در حال ثبت..." : "ثبت درخواست"}
                </button>
                <button onClick={() => { setShowReturnForm(false); setReturnError(""); }} style={{ background: "var(--bg)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 16px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer" }}>
                  انصراف
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
