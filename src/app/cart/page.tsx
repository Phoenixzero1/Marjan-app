"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 640, margin: "4rem auto", padding: "0 2rem", textAlign: "center" }}>
        <i className="ti ti-shopping-cart-off" style={{ fontSize: 72, color: "var(--border)", display: "block", marginBottom: 16 }} />
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)", marginBottom: 8 }}>سبد خرید خالی است</h2>
        <p style={{ fontSize: 14, color: "var(--text3)", marginBottom: 24 }}>هنوز کالایی به سبد خرید اضافه نکرده‌اید.</p>
        <Link
          href="/products"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--primary)",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            fontWeight: 900,
            textDecoration: "none",
          }}
        >
          <i className="ti ti-arrow-right" />
          مشاهده محصولات
        </Link>
      </div>
    );
  }

  const shipping = totalPrice() >= 5_000_000 ? 0 : 150_000;
  const total = totalPrice() + shipping;

  return (
    <div style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 2rem" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 6 }}>
        <Link href="/" style={{ color: "var(--primary)", fontWeight: 700 }}>خانه</Link>
        <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
        <span>سبد خرید</span>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 10 }}>
        <i className="ti ti-shopping-cart" />
        سبد خرید
        <span style={{ background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 900, padding: "2px 10px", borderRadius: 20 }}>
          {items.length} کالا
        </span>
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        {/* Items list */}
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
          {/* Header row */}
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)" }}>کالا</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", minWidth: 100, textAlign: "center" }}>تعداد</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", minWidth: 110, textAlign: "left" }}>قیمت</span>
          </div>

          {items.map((item) => (
            <div
              key={`${item.id}-${item.sizeLabel}`}
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border)",
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 12,
                alignItems: "center",
              }}
            >
              {/* Product info */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 70,
                    height: 70,
                    background: "var(--bg)",
                    borderRadius: "var(--radius-sm)",
                    flexShrink: 0,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <i className="ti ti-package" style={{ fontSize: 28, color: "var(--border)" }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", marginBottom: 4, lineHeight: 1.4 }}>{item.name}</div>
                  {item.sizeLabel && (
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>سایز: {item.sizeLabel}</div>
                  )}
                  <button
                    onClick={() => removeItem(item.id, item.sizeLabel)}
                    style={{ background: "none", border: "none", color: "#c0392b", fontSize: 12, fontWeight: 700, padding: "4px 0", cursor: "pointer", fontFamily: "Vazirmatn", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}
                  >
                    <i className="ti ti-trash" style={{ fontSize: 13 }} />
                    حذف
                  </button>
                </div>
              </div>

              {/* Quantity controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100, justifyContent: "center" }}>
                <button
                  onClick={() => updateQty(item.id, item.sizeLabel, item.quantity - 1)}
                  style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text)", width: 32, height: 32, borderRadius: 8, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontFamily: "Vazirmatn" }}
                >−</button>
                <span style={{ fontSize: 15, fontWeight: 900, minWidth: 24, textAlign: "center" }}>{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.id, item.sizeLabel, item.quantity + 1)}
                  style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text)", width: 32, height: 32, borderRadius: 8, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontFamily: "Vazirmatn" }}
                >+</button>
              </div>

              {/* Price */}
              <div style={{ minWidth: 110, textAlign: "left" }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)" }}>
                  {formatPrice(item.price * item.quantity)}
                </div>
                {item.quantity > 1 && (
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                    {formatPrice(item.price)} / واحد
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Continue shopping */}
          <div style={{ padding: "1rem 1.5rem" }}>
            <Link
              href="/products"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}
            >
              <i className="ti ti-arrow-right" />
              ادامه خرید
            </Link>
          </div>
        </div>

        {/* Order summary */}
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-receipt" />
              خلاصه سفارش
            </h3>
          </div>
          <div style={{ padding: "1.25rem 1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "var(--text2)", marginBottom: 10 }}>
              <span>جمع کالاها ({items.length} قلم)</span>
              <span>{formatPrice(totalPrice())}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "var(--text2)", marginBottom: 10 }}>
              <span>هزینه ارسال</span>
              <span style={{ color: shipping === 0 ? "#1a7a4a" : "var(--text)" }}>
                {shipping === 0 ? "رایگان" : formatPrice(shipping)}
              </span>
            </div>
            {shipping === 0 && (
              <div style={{ fontSize: 11, color: "#1a7a4a", marginBottom: 10, background: "#e8f5e9", padding: "6px 10px", borderRadius: 8, fontWeight: 700 }}>
                <i className="ti ti-check" /> ارسال رایگان برای خرید بالای ۵ میلیون تومان
              </div>
            )}
            <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 900, color: "var(--primary)", marginBottom: 20 }}>
              <span>مبلغ قابل پرداخت</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Link
              href="/checkout"
              className="btn-checkout-site"
              style={{ textDecoration: "none" }}
            >
              ادامه به پرداخت
              <i className="ti ti-arrow-left" />
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: "ti-shield-check", text: "ضمانت اصالت کالا" },
              { icon: "ti-refresh", text: "۷ روز ضمانت مرجوعی" },
              { icon: "ti-lock", text: "پرداخت امن" },
            ].map((t) => (
              <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text2)", fontWeight: 700 }}>
                <i className={`ti ${t.icon}`} style={{ color: "#1a7a4a", fontSize: 16 }} />
                {t.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
