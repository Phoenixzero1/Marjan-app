"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

export default function CartPanel() {
  const { items, isOpen, closeCart, removeItem, updateQty, totalPrice } = useCart();

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-overlay ${isOpen ? "open" : ""}`}
        onClick={closeCart}
      />

      {/* Panel */}
      <div className={`cart-panel ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div
          style={{
            background: "var(--primary)",
            color: "#fff",
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 900 }}>
            <i className="ti ti-shopping-cart" /> سبد خرید
          </h3>
          <button
            onClick={closeCart}
            style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22 }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text3)" }}>
              <i className="ti ti-shopping-cart" style={{ fontSize: 56, display: "block", marginBottom: 12 }} />
              <p style={{ fontWeight: 700 }}>سبد خرید شما خالی است</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.id}-${item.sizeLabel}`}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    background: "var(--bg)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <i className="ti ti-package" style={{ fontSize: 24, color: "var(--border)" }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: "block", fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>
                    {item.name}
                  </strong>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>
                    {item.sizeLabel && `سایز: ${item.sizeLabel}`}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <button
                      onClick={() => updateQty(item.id, item.sizeLabel, item.quantity - 1)}
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", width: 26, height: 26, borderRadius: 6, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >-</button>
                    <span style={{ fontSize: 13, fontWeight: 900, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.sizeLabel, item.quantity + 1)}
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", width: 26, height: 26, borderRadius: 6, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >+</button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <button
                    onClick={() => removeItem(item.id, item.sizeLabel)}
                    style={{ background: "transparent", border: "none", color: "#c0392b", fontSize: 16, padding: 4 }}
                  >
                    <i className="ti ti-trash" />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)" }}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: "1.25rem 1.5rem", borderTop: "2px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1rem" }}>
              <span>جمع کل</span>
              <span>{formatPrice(totalPrice())}</span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              style={{
                display: "block",
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                padding: 13,
                borderRadius: "var(--radius-sm)",
                fontSize: 14,
                fontWeight: 900,
                textAlign: "center",
              }}
            >
              ادامه و پرداخت <i className="ti ti-arrow-left" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
