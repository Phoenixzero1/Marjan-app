"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export interface HomeCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  images: { url: string; isPrimary: boolean }[];
  sizeSummary?: string | null;
  sizes?: { label: string }[];
  isNew?: boolean;
  stockQty?: number;
  sectionLabel?: string;
  marjanTime?: { discountPct: number; endTime?: string };
}

function useCountdown(endTime?: string) {
  const [display, setDisplay] = useState<string | null>(null);
  useEffect(() => {
    if (!endTime) return;
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setDisplay(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDisplay(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endTime]);
  return display;
}

export default function HomeProductCard({
  name, slug, price, comparePrice, images, sizeSummary, sizes,
  isNew, stockQty = 0, sectionLabel, marjanTime,
}: HomeCardProps) {
  const [hover, setHover] = useState(false);
  const countdown = useCountdown(marjanTime?.endTime);

  const primaryImage = images.find((i) => i.isPrimary) ?? images[0];

  const isMarjan = !!marjanTime;
  const dealPrice = isMarjan ? Math.round(price * (1 - marjanTime!.discountPct / 100)) : null;
  const salePrice = dealPrice ?? price;
  const originalPx = isMarjan
    ? price
    : comparePrice && comparePrice > price ? comparePrice : null;
  const discountPct = isMarjan
    ? marjanTime!.discountPct
    : comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0;
  const hasDiscount = discountPct > 0;

  const label = sectionLabel ?? (isMarjan ? "مرجان تایم" : isNew ? "جدید" : null);
  const labelBg = isMarjan ? "#c0392b" : isNew ? "#0a2a5e" : "rgba(10,42,94,0.55)";

  const sizeText = sizeSummary
    ? sizeSummary
    : sizes && sizes.length > 1
      ? `${sizes[0].label} تا ${sizes[sizes.length - 1].label}`
      : sizes?.[0]?.label ?? null;

  return (
    <Link
      href={`/product/${slug}`}
      style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{
        width: 175,
        borderRadius: 12,
        overflow: "hidden",
        transform: hover ? "translateY(-3px)" : "none",
        transition: "transform .18s",
        cursor: "pointer",
        flexShrink: 0,
      }}>
        {/* ── Image area ──────────────────────────────────── */}
        <div style={{ position: "relative", height: 152, background: "#f8f9fb" }}>
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage.url}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8, boxSizing: "border-box" }}
            />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-package" style={{ fontSize: 48, color: "#d1d5db" }} />
            </div>
          )}

          {/* Label badge — top right */}
          {label && (
            <span style={{
              position: "absolute", top: 8, right: 8,
              background: labelBg, color: "#fff",
              fontSize: 9.5, fontWeight: 900, padding: "3px 9px",
              borderRadius: 5, letterSpacing: "0.02em",
            }}>
              {label}
            </span>
          )}

          {/* Countdown — top left (MarjanTime only) */}
          {isMarjan && countdown && (
            <span style={{
              position: "absolute", top: 8, left: 8,
              fontSize: 11, fontWeight: 900, color: "#c0392b",
              background: "rgba(255,255,255,0.92)",
              borderRadius: 5, padding: "3px 7px",
              letterSpacing: "0.5px", fontVariantNumeric: "tabular-nums",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <i className="ti ti-clock" style={{ fontSize: 10 }} />
              {countdown}
            </span>
          )}

          {/* Out of stock overlay */}
          {stockQty === 0 && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(255,255,255,0.65)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#9ca3af", background: "#fff", padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
                ناموجود
              </span>
            </div>
          )}
        </div>

        {/* ── Accent line ─────────────────────────────────── */}
        <div style={{
          height: 2,
          background: isMarjan
            ? "#c0392b"
            : hasDiscount
              ? "var(--accent, #e8920a)"
              : "var(--primary, #0a2a5e)",
          opacity: hasDiscount || isMarjan ? 1 : 0.15,
        }} />

        {/* ── Body ────────────────────────────────────────── */}
        <div style={{ padding: "9px 10px 11px", display: "flex", flexDirection: "column", gap: 5, background: "#fff" }}>
          {/* Name */}
          <div style={{
            fontSize: 12, fontWeight: 600, color: "#111827", lineHeight: 1.5,
            minHeight: 36,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {name}
          </div>

          {/* Size summary */}
          {sizeText && (
            <div style={{ fontSize: 10.5, color: "#9ca3af", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
              <i className="ti ti-arrows-horizontal" style={{ fontSize: 10, opacity: .7 }} />
              {sizeText}
            </div>
          )}

          {/* Price row */}
          <div style={{ marginTop: "auto", paddingTop: 2 }}>
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: hasDiscount ? "space-between" : "flex-end",
              gap: 4,
            }}>
              {hasDiscount && (
                <span style={{
                  background: isMarjan ? "#c0392b" : "var(--accent, #e8920a)",
                  color: "#fff", fontSize: 11, fontWeight: 900,
                  padding: "2px 7px", borderRadius: 4,
                  minWidth: 32, textAlign: "center",
                }}>
                  {discountPct}٪
                </span>
              )}
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: isMarjan ? "#c0392b" : "#1d4ed8", lineHeight: 1.2 }}>
                  {formatPrice(salePrice)}
                </div>
              </div>
            </div>
            {originalPx && (
              <div style={{ fontSize: 10.5, color: "#bbb", textDecoration: "line-through", textAlign: "left", marginTop: 2 }}>
                {formatPrice(originalPx)}
              </div>
            )}
            {!hasDiscount && !originalPx && (
              <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "left", marginTop: 2 }}>تومان</div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
