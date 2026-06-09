"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export interface FlashProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
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

  const units = [
    { val: timeLeft.d, label: "روز" },
    { val: timeLeft.h, label: "ساعت" },
    { val: timeLeft.m, label: "دقیقه" },
    { val: timeLeft.s, label: "ثانیه" },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--primary-dark) 0%, #1a3a6e 100%)",
        padding: "2.5rem 0",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {/* Title badge */}
            <div
              style={{
                background: "var(--accent)",
                padding: "8px 18px",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <i className="ti ti-clock-bolt" style={{ color: "#fff", fontSize: 20 }} />
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>{title}</span>
            </div>

            {/* Countdown */}
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {units.flatMap((u, i) => {
                const box = (
                  <div
                    key={u.label}
                    style={{
                      textAlign: "center",
                      background: "rgba(255,255,255,.12)",
                      border: "1px solid rgba(255,255,255,.15)",
                      borderRadius: 8,
                      padding: "6px 10px",
                      minWidth: 48,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: "#fff",
                        lineHeight: 1.1,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {String(u.val).padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.55)", marginTop: 3 }}>
                      {u.label}
                    </div>
                  </div>
                );
                if (i === 0) return [box];
                return [
                  <span
                    key={`sep-${i}`}
                    style={{
                      color: "rgba(255,255,255,.4)",
                      fontSize: 22,
                      fontWeight: 900,
                      alignSelf: "flex-start",
                      marginTop: 4,
                    }}
                  >
                    :
                  </span>,
                  box,
                ];
              })}
            </div>
          </div>

          <Link
            href="/products"
            style={{
              color: "rgba(255,255,255,.75)",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            همه پیشنهادات <i className="ti ti-arrow-left" />
          </Link>
        </div>

        {/* Products horizontal scroll */}
        <div
          style={{
            display: "flex",
            gap: 14,
            overflowX: "auto",
            paddingBottom: 10,
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,.2) transparent",
          }}
        >
          {products.map((p) => {
            const flashPrice = Math.round(p.price * (1 - discountPct / 100));
            return (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                style={{
                  flexShrink: 0,
                  width: 185,
                  background: "#fff",
                  borderRadius: 12,
                  overflow: "hidden",
                  textDecoration: "none",
                  display: "block",
                  boxShadow: "0 4px 16px rgba(0,0,0,.2)",
                  transition: "transform .2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                {/* Image */}
                <div
                  style={{
                    height: 148,
                    background: "var(--bg2)",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <i className="ti ti-package" style={{ fontSize: 44, color: "var(--border)" }} />
                  )}
                  {/* Discount badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "var(--accent)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 900,
                      padding: "3px 9px",
                      borderRadius: 20,
                    }}
                  >
                    {discountPct}٪ تخفیف
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "10px 12px" }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text)",
                      lineHeight: 1.45,
                      marginBottom: 10,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      minHeight: 34,
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text3)",
                      textDecoration: "line-through",
                      marginBottom: 2,
                    }}
                  >
                    {p.price.toLocaleString("fa-IR")}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "var(--accent)" }}>
                    {flashPrice.toLocaleString("fa-IR")} تومان
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
