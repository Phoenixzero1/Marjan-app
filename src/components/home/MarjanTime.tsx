"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export interface FlashProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  sizeSummary?: string | null;
  sizes?: { label: string }[];
}

interface Props {
  title: string;
  endTime: string;
  discountPct: number;
  products: FlashProduct[];
}

export default function MarjanTime({ title, endTime, discountPct, products }: Props) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [expired, setExpired] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  if (!mounted || expired || products.length === 0) return null;

  const totalH = timeLeft.d * 24 + timeLeft.h;
  const cardTimer = `${String(totalH).padStart(2, "0")}:${String(timeLeft.m).padStart(2, "0")}:${String(timeLeft.s).padStart(2, "0")}`;

  return (
    <section className="product-row product-row--dark" style={{ boxShadow: "0 4px 32px rgba(0,0,0,.28)", overflow: "hidden", position: "relative" }}>
      {/* percent pattern overlay */}
      <div style={{
        position: "absolute", inset: 0,
        color: "rgba(255,255,255,0.05)",
        fontSize: 22, fontWeight: 700, letterSpacing: 10, lineHeight: 2,
        padding: 8, overflow: "hidden", pointerEvents: "none",
        wordBreak: "break-all", userSelect: "none",
      }}>
        {Array.from({ length: 80 }, () => "٪").join(" ")}
      </div>

      <div className="row-header" style={{ position: "relative", zIndex: 1 }}>
        <Link href="/products" className="show-all">مشاهده همه</Link>
        <h2 className="row-title" style={{ flexWrap: "wrap", gap: 12 }}>
          <span>🔥 {title}</span>
          {/* countdown boxes */}
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            {[
              { val: timeLeft.d, label: "روز" },
              { val: totalH, label: "ساعت" },
              { val: timeLeft.m, label: "دقیقه" },
              { val: timeLeft.s, label: "ثانیه" },
            ].flatMap((u, i) => {
              const box = (
                <div key={u.label} style={{
                  textAlign: "center",
                  background: "rgba(0,0,0,.3)",
                  borderRadius: 7, padding: "4px 8px", minWidth: 42,
                }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                    {String(u.val).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,.6)", marginTop: 2 }}>{u.label}</div>
                </div>
              );
              if (i === 0) return [box];
              return [
                <span key={`s${i}`} style={{ color: "rgba(255,255,255,.5)", fontSize: 18, fontWeight: 900, alignSelf: "flex-start", marginTop: 2 }}>:</span>,
                box,
              ];
            })}
          </div>
        </h2>
      </div>

      <div className="row-cards row-cards--6" style={{ position: "relative", zIndex: 1 }}>
        {products.map((p) => {
          const flashPrice = Math.round(p.price * (1 - discountPct / 100));
          const sizeText = p.sizeSummary
            ? p.sizeSummary
            : p.sizes && p.sizes.length > 1
              ? `${p.sizes[0].label} تا ${p.sizes[p.sizes.length - 1].label}`
              : p.sizes?.[0]?.label ?? null;

          return (
            <Link key={p.id} href={`/product/${p.slug}`} className="card card--dark">
              <span className="card-tag">مرجان تایم</span>
              <span className="card-timer">{cardTimer}</span>
              <div className="card-img-wrap">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} />
                ) : (
                  <i className="ti ti-package" style={{ fontSize: 44, color: "#d1d5db" }} />
                )}
              </div>
              <div className="card-body">
                <p className="card-title">{p.name}</p>
                {sizeText && (
                  <div style={{ fontSize: 10.5, color: "#9ca3af", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                    <i className="ti ti-arrows-horizontal" style={{ fontSize: 10, opacity: .7 }} />
                    {sizeText}
                  </div>
                )}
                <div className="card-price-row">
                  <span className="discount-badge">{discountPct}٪</span>
                  <div className="price-block">
                    <span className="price-current">{formatPrice(flashPrice)} تومان</span>
                    <span className="price-old">{formatPrice(p.price)}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
