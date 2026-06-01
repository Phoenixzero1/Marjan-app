"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

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
}

export default function ProductCard({
  id,
  name,
  slug,
  price,
  comparePrice,
  brand,
  images,
  sizes = [],
  isNew,
  isFeatured,
  stockQty = 0,
}: ProductCardProps) {
  const { addItem, openCart } = useCart();
  const primaryImage = images.find((i) => i.isPrimary) ?? images[0];
  const discount =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0;

  function handleAddToCart(sizeLabel?: string, sizePrice?: number) {
    addItem({
      id,
      name: sizeLabel ? `${name} — ${sizeLabel}` : name,
      price: sizePrice ?? price,
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
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow)",
        overflow: "hidden",
        transition: "all .25s",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Badge */}
      {discount > 0 && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "var(--accent)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 900,
            padding: "3px 10px",
            borderRadius: 20,
            zIndex: 2,
          }}
        >
          {discount}٪ تخفیف
        </span>
      )}
      {isNew && !discount && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "var(--primary)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 900,
            padding: "3px 10px",
            borderRadius: 20,
            zIndex: 2,
          }}
        >
          جدید
        </span>
      )}

      {/* Image */}
      <Link href={`/product/${slug}`}>
        <div
          style={{
            background: "var(--bg)",
            aspectRatio: "4/3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage.url}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <i className="ti ti-package" style={{ fontSize: 64, color: "var(--border)" }} />
          )}
        </div>
      </Link>

      {/* Body */}
      <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
        {brand && (
          <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
            {brand.name}
          </div>
        )}
        <Link href={`/product/${slug}`}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 6, lineHeight: 1.4, flex: 1 }}>
            {name}
          </div>
        </Link>

        {/* Sizes */}
        {sizes.length > 0 && (
          <div
            style={{
              background: "var(--bg2)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 10px",
              marginBottom: 8,
              position: "relative",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: "var(--text2)", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <i className="ti ti-ruler-2" style={{ fontSize: 13, color: "var(--primary)" }} />
              سایز موجود
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {sizes.slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleAddToCart(s.label, s.price ?? price)}
                  style={{
                    background: "#fff",
                    border: "1.5px solid var(--border)",
                    color: "var(--text2)",
                    fontSize: 10,
                    fontWeight: 900,
                    padding: "3px 7px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: "Vazirmatn",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = "var(--primary)";
                    (e.target as HTMLElement).style.borderColor = "var(--primary)";
                    (e.target as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = "#fff";
                    (e.target as HTMLElement).style.borderColor = "var(--border)";
                    (e.target as HTMLElement).style.color = "var(--text2)";
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stock indicator */}
        {stockQty <= 5 && stockQty > 0 && (
          <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 6 }}>
            <i className="ti ti-alert-triangle" /> تنها {stockQty} عدد باقی‌مانده
          </div>
        )}

        {/* Price + Cart */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)" }}>
              {formatPrice(price)}
            </div>
            {comparePrice && comparePrice > price && (
              <div style={{ fontSize: 11, color: "var(--text3)", textDecoration: "line-through" }}>
                {formatPrice(comparePrice)}
              </div>
            )}
          </div>
          <button
            onClick={() => handleAddToCart()}
            disabled={stockQty === 0}
            style={{
              background: stockQty === 0 ? "var(--bg2)" : "var(--primary)",
              color: stockQty === 0 ? "var(--text3)" : "#fff",
              border: "none",
              width: 36,
              height: 36,
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              cursor: stockQty === 0 ? "not-allowed" : "pointer",
              transition: "background .2s",
            }}
            title={stockQty === 0 ? "ناموجود" : "افزودن به سبد"}
          >
            <i className={stockQty === 0 ? "ti ti-x" : "ti ti-shopping-cart"} />
          </button>
        </div>
      </div>
    </div>
  );
}
