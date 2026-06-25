"use client";

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
  /** When MarjanTime is active for this product — overrides comparePrice completely */
  marjanTime?: { discountPct: number };
}

export default function ProductCard({
  id, name, slug, price, comparePrice, brand, images, sizes = [],
  isNew, stockQty = 0, marjanTime,
}: ProductCardProps) {
  const { addItem, openCart } = useCart();
  const primaryImage = images.find((i) => i.isPrimary) ?? images[0];

  // ── Price logic ─────────────────────────────────────────────────────────────
  // MarjanTime completely overrides any existing comparePrice discount
  const dealPrice   = marjanTime ? Math.round(price * (1 - marjanTime.discountPct / 100)) : null;
  const salePrice   = dealPrice ?? price;                                   // what customer pays
  const originalPx  = marjanTime                                            // what to strike through
    ? price
    : comparePrice && comparePrice > price ? comparePrice : null;
  const discountPct = marjanTime
    ? marjanTime.discountPct
    : comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0;

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
        border: "1px solid #eaecf0",
        boxShadow: "0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "box-shadow .18s, transform .18s",
      }}
    >
      {/* ── مرجان تایم strip ─────────────────────────────────────────────── */}
      {marjanTime && (
        <div style={{
          background: "linear-gradient(90deg,#dc2626,#ea580c)",
          padding: "3px 10px",
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 10, fontWeight: 900, color: "#fff",
        }}>
          <i className="ti ti-clock-bolt" style={{ fontSize: 11 }} />
          مرجان تایم — {marjanTime.discountPct}٪
        </div>
      )}

      {/* ── Image ────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative" }}>
        {/* Discount circle badge */}
        {discountPct > 0 && (
          <div style={{
            position: "absolute", top: 8, left: 8, zIndex: 2,
            width: 38, height: 38, borderRadius: "50%",
            background: marjanTime ? "#dc2626" : "#e53935",
            color: "#fff",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 900, lineHeight: 1,
            boxShadow: "0 2px 6px rgba(0,0,0,.22)",
          }}>
            <span style={{ fontSize: 12 }}>{discountPct}٪</span>
          </div>
        )}

        {/* New badge (only when no discount) */}
        {isNew && !discountPct && (
          <div style={{
            position: "absolute", top: 8, left: 8, zIndex: 2,
            background: "var(--primary-mid)", color: "#fff",
            fontSize: 10, fontWeight: 900, padding: "3px 9px", borderRadius: 20,
          }}>جدید</div>
        )}

        {/* Wishlist */}
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 3 }}>
          <WishlistButton productId={id} size={28} />
        </div>

        <Link href={`/product/${slug}`} style={{ display: "block" }}>
          <div style={{
            aspectRatio: "1",
            background: "#f8f9fb",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 10, overflow: "hidden",
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

      {/* ── Info ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {brand && (
          <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>
            {brand.name}
          </div>
        )}

        <Link href={`/product/${slug}`} style={{ textDecoration: "none", flex: 1 }}>
          <div style={{
            fontSize: 12.5, fontWeight: 600, color: "#111827",
            lineHeight: 1.5, minHeight: 38,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {name}
          </div>
        </Link>

        {/* Sizes strip */}
        {sizes.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {sizes.slice(0, 5).map((s) => (
              <button
                key={s.id}
                onClick={() => handleAddToCart(s.label, s.price ?? price)}
                className="size-btn"
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

        {/* ── Price + cart ──────────────────────────────────────────────── */}
        <div style={{ marginTop: "auto" }}>
          {/* Sale price — BIG, first (Technolife style) */}
          <div style={{
            fontSize: 15, fontWeight: 900,
            color: marjanTime ? "#dc2626" : "#1d4ed8",
            marginBottom: 2,
          }}>
            {formatPrice(salePrice)}
          </div>

          {/* Original price — strikethrough, below (Technolife style) */}
          {originalPx && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>
                {formatPrice(originalPx)}
              </span>
              <button
                onClick={() => handleAddToCart()}
                disabled={stockQty === 0}
                className="btn-cart"
                style={stockQty === 0
                  ? { background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }
                  : marjanTime ? { background: "#dc2626" } : undefined}
                title={stockQty === 0 ? "ناموجود" : "افزودن به سبد"}
              >
                <i className={stockQty === 0 ? "ti ti-x" : "ti ti-shopping-cart"} />
              </button>
            </div>
          )}

          {/* No discount: just the cart button row */}
          {!originalPx && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <button
                onClick={() => handleAddToCart()}
                disabled={stockQty === 0}
                className="btn-cart"
                style={stockQty === 0 ? { background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" } : undefined}
                title={stockQty === 0 ? "ناموجود" : "افزودن به سبد"}
              >
                <i className={stockQty === 0 ? "ti ti-x" : "ti ti-shopping-cart"} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
