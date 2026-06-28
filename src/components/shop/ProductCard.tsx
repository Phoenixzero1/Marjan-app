"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import WishlistButton from "./WishlistButton";

interface Size {
  id: string;
  label: string;
  price: number | null;
  unit: string;
}

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  brand?: { name: string } | null;
  images: { url: string; isPrimary: boolean }[];
  sizes?: Size[];
  isNew?: boolean;
  isFeatured?: boolean;
  stockQty?: number;
  /** Pass endTime so the card can show a live countdown */
  marjanTime?: { discountPct: number; endTime?: string };
}

function useCountdown(endTime?: string) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  useEffect(() => {
    if (!endTime) return;
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endTime]);
  return timeLeft;
}

export default function ProductCard({
  id, name, slug, price, comparePrice, brand, images, sizes = [],
  isNew, stockQty = 0, marjanTime,
}: ProductCardProps) {
  const { addItem, openCart } = useCart();
  const primaryImage = images.find((i) => i.isPrimary) ?? images[0];
  const timeLeft = useCountdown(marjanTime?.endTime);

  // ── Price logic ──────────────────────────────────────────────────────────
  const dealPrice   = marjanTime ? Math.round(price * (1 - marjanTime.discountPct / 100)) : null;
  const salePrice   = dealPrice ?? price;
  const originalPx  = marjanTime
    ? price
    : comparePrice && comparePrice > price ? comparePrice : null;
  const discountPct = marjanTime
    ? marjanTime.discountPct
    : comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0;

  const hasDiscount  = discountPct > 0;
  const isMarjan     = !!marjanTime;
  const accentColor  = isMarjan ? "#dc2626" : "#e67e22";

  function handleAddToCart(sizeLabel?: string, sizePrice?: number) {
    addItem({
      id,
      name: sizeLabel ? `${name} — ${sizeLabel}` : name,
      price: sizePrice ?? salePrice,
      quantity: 1,
      imageUrl: primaryImage?.url,
      sizeLabel,
    });
    openCart();
  }

  return (
    <div
      className="product-card"
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #e8e8e8",
        boxShadow: "0 1px 4px rgba(0,0,0,.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* ── Sale / مرجان تایم top indicator ─────────────────────────────── */}
      {hasDiscount && (
        <>
          <div style={{
            padding: "5px 10px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            {isMarjan ? (
              <>
                <span style={{
                  fontSize: 12, fontWeight: 900, color: "#dc2626",
                  fontVariantNumeric: "tabular-nums", letterSpacing: "0.5px",
                }}>
                  {timeLeft ?? `${discountPct}٪ تخفیف`}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "#dc2626",
                  display: "flex", alignItems: "center", gap: 3,
                }}>
                  <i className="ti ti-clock-bolt" style={{ fontSize: 12 }} />
                  مرجان تایم
                </span>
              </>
            ) : (
              <>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "#e67e22",
                  display: "flex", alignItems: "center", gap: 3,
                }}>
                  <i className="ti ti-tag" style={{ fontSize: 12 }} />
                  تخفیف ویژه
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#e67e22" }}>{discountPct}٪</span>
              </>
            )}
          </div>
          <div style={{ height: 2, background: accentColor }} />
        </>
      )}

      {/* ── Image ────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 3 }}>
          <WishlistButton productId={id} size={28} />
        </div>

        {isNew && !hasDiscount && (
          <div style={{
            position: "absolute", top: 8, left: 8, zIndex: 2,
            background: "var(--primary-mid)", color: "#fff",
            fontSize: 10, fontWeight: 900, padding: "3px 9px", borderRadius: 20,
          }}>جدید</div>
        )}

        <Link href={`/product/${slug}`} style={{ display: "block" }}>
          <div style={{
            height: 140,
            background: "#f8f9fb",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 8, overflow: "hidden",
          }}>
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage.url}
                alt={name}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <i className="ti ti-package" style={{ fontSize: 56, color: "#d1d5db" }} />
            )}
          </div>
        </Link>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "8px 10px", flex: 1, display: "flex",
        flexDirection: "column", gap: 5,
        borderTop: "1px solid #f0f0f0",
        minWidth: 0,
      }}>
        {brand && (
          <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>{brand.name}</div>
        )}

        <Link href={`/product/${slug}`} style={{ textDecoration: "none", flex: 1 }}>
          <div style={{
            fontSize: 12.5, fontWeight: 600, color: "#111827",
            lineHeight: 1.45, minHeight: 34,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {name}
          </div>
        </Link>

        {/* Sizes — single-row horizontal scroll, never wraps */}
        {sizes.length > 0 && (
          <div className="size-scroll" style={{
            display: "flex", gap: 3, minWidth: 0,
            overflowX: "auto", overflowY: "hidden",
            msOverflowStyle: "none",
            scrollbarWidth: "none" as const,
          }}>
            {sizes.map((s) => (
              <button
                key={s.id}
                onClick={() => handleAddToCart(s.label, s.price ?? price)}
                className="size-btn"
                style={{ flexShrink: 0 }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {stockQty > 0 && stockQty <= 5 && (
          <div style={{ fontSize: 10, color: "#ea580c", fontWeight: 700 }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 10 }} /> تنها {stockQty} عدد باقی
          </div>
        )}

        {/* ── Pricing ──────────────────────────────────────────────────── */}
        <div style={{ marginTop: "auto" }}>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: hasDiscount ? "space-between" : "flex-end",
            marginBottom: 5,
          }}>
            {hasDiscount && (
              <span style={{
                background: accentColor, color: "#fff",
                fontSize: 12, fontWeight: 900, padding: "3px 10px",
                borderRadius: 4, minWidth: 44, textAlign: "center",
              }}>
                {discountPct}٪
              </span>
            )}
            <div style={{ textAlign: "left" }}>
              <div style={{
                fontSize: 14, fontWeight: 900,
                color: isMarjan ? "#dc2626" : "#1d4ed8",
              }}>
                {formatPrice(salePrice)}
              </div>
              {originalPx && (
                <div style={{ fontSize: 11, color: "#bbb", textDecoration: "line-through" }}>
                  {formatPrice(originalPx)}
                </div>
              )}
            </div>
          </div>

          {/* Cart button — full width */}
          <button
            onClick={() => handleAddToCart()}
            disabled={stockQty === 0}
            style={{
              width: "100%",
              background: stockQty === 0 ? "#f3f4f6" : isMarjan ? "#dc2626" : "var(--primary)",
              color: stockQty === 0 ? "#9ca3af" : "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 900,
              fontFamily: "Vazirmatn",
              cursor: stockQty === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "background .15s",
            }}
            title={stockQty === 0 ? "ناموجود" : "افزودن به سبد"}
            onMouseEnter={(e) => {
              if (stockQty > 0) {
                (e.currentTarget as HTMLElement).style.background = isMarjan ? "#b91c1c" : "var(--accent)";
              }
            }}
            onMouseLeave={(e) => {
              if (stockQty > 0) {
                (e.currentTarget as HTMLElement).style.background = isMarjan ? "#dc2626" : "var(--primary)";
              }
            }}
          >
            <i className={stockQty === 0 ? "ti ti-x" : "ti ti-shopping-cart"} style={{ fontSize: 14 }} />
            {stockQty === 0 ? "ناموجود" : "افزودن به سبد"}
          </button>
        </div>
      </div>
    </div>
  );
}
