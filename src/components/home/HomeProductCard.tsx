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
  variant?: "light" | "dark";
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
  isNew, stockQty = 0, sectionLabel, variant = "light", marjanTime,
}: HomeCardProps) {
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

  return (
    <Link href={`/product/${slug}`} className={`card card--${variant}`}>
      {label && (
        <span
          className="card-tag"
          style={isMarjan ? { background: "var(--techno-red)" } : isNew ? { background: "var(--primary)" } : undefined}
        >
          {label}
        </span>
      )}
      {countdown && <span className="card-timer">{countdown}</span>}
      <div className="card-img-wrap" style={{ position: "relative" }}>
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primaryImage.url} alt={name} />
        ) : (
          <i className="ti ti-package" style={{ fontSize: 44, color: "#d1d5db" }} />
        )}
        {stockQty === 0 && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(255,255,255,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#9ca3af", background: "#fff", padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              ناموجود
            </span>
          </div>
        )}
      </div>
      <div className="card-body">
        <p className="card-title">{name}</p>
        {(sizeSummary || (sizes && sizes.length > 0)) && (
          <div style={{ fontSize: 10.5, color: "#9ca3af", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
            <i className="ti ti-arrows-horizontal" style={{ fontSize: 10, opacity: .7 }} />
            {sizeSummary
              ? sizeSummary
              : sizes!.length === 1
                ? sizes![0].label
                : `${sizes![0].label} تا ${sizes![sizes!.length - 1].label}`
            }
          </div>
        )}
        <div className="card-price-row">
          {hasDiscount && <span className="discount-badge">{discountPct}٪</span>}
          <div className="price-block">
            <span className="price-current">{formatPrice(salePrice)} تومان</span>
            {originalPx && <span className="price-old">{formatPrice(originalPx)}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
