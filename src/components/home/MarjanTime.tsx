"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HScrollSlider from "@/components/ui/HScrollSlider";

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

  const cardTimer = `${String(timeLeft.h).padStart(2, "0")}:${String(timeLeft.m).padStart(2, "0")}:${String(timeLeft.s).padStart(2, "0")}`;

  const units = [
    { val: timeLeft.d, label: "روز" },
    { val: timeLeft.h, label: "ساعت" },
    { val: timeLeft.m, label: "دقیقه" },
    { val: timeLeft.s, label: "ثانیه" },
  ];

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      background: "#6b0f1a",
      boxShadow: "0 4px 32px rgba(0,0,0,.28)",
      position: "relative",
    }}>
      {/* Percent pattern overlay */}
      <div style={{
        position: "absolute", inset: 0,
        color: "rgba(255,255,255,0.06)",
        fontSize: 22, fontWeight: 700, letterSpacing: 10, lineHeight: 2,
        padding: 8, overflow: "hidden", pointerEvents: "none",
        wordBreak: "break-all",
        userSelect: "none",
      }}>
        {Array.from({ length: 80 }, () => "٪").join(" ")}
      </div>

      {/* ── Header bar ── */}
      <div style={{
        background: "linear-gradient(90deg,#a50f22 0%,#c0392b 100%)",
        padding: "14px 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
        position: "relative", zIndex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 18, letterSpacing: "-.01em" }}>
              {title}
            </span>
          </div>

          {/* Countdown boxes */}
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            {units.flatMap((u, i) => {
              const box = (
                <div key={u.label} style={{
                  textAlign: "center",
                  background: "rgba(0,0,0,.3)",
                  borderRadius: 7, padding: "5px 9px", minWidth: 46,
                }}>
                  <div style={{
                    fontSize: 21, fontWeight: 900, color: "#fff",
                    lineHeight: 1.1, fontVariantNumeric: "tabular-nums",
                  }}>
                    {String(u.val).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.6)", marginTop: 2 }}>
                    {u.label}
                  </div>
                </div>
              );
              if (i === 0) return [box];
              return [
                <span key={`s${i}`} style={{ color: "rgba(255,255,255,.5)", fontSize: 20, fontWeight: 900, alignSelf: "flex-start", marginTop: 2 }}>:</span>,
                box,
              ];
            })}
          </div>
        </div>

        <Link href="/products" style={{
          color: "rgba(255,255,255,.85)", fontSize: 13, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 4, textDecoration: "none",
        }}>
          ‹ همه پیشنهادات
        </Link>
      </div>

      {/* ── Products ── */}
      <div style={{ padding: "1.25rem 2rem 1.5rem", position: "relative", zIndex: 1 }}>
        <HScrollSlider gap={12} scrollAmount={170} fadeColor="#6b0f1a">
          {products.map((p) => {
            const flashPrice = Math.round(p.price * (1 - discountPct / 100));
            return (
              <div
                key={p.id}
                style={{
                  flexShrink: 0, width: 162,
                  background: "#fff", borderRadius: 10,
                  overflow: "hidden", display: "flex", flexDirection: "column",
                  boxShadow: "0 4px 20px rgba(0,0,0,.32)",
                  transition: "transform .18s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                {/* Card top badge */}
                <div style={{
                  display: "flex", justifyContent: "flex-end", padding: "8px 10px 0",
                }}>
                  <span style={{
                    background: "#6b0f1a", color: "#fff",
                    fontSize: 10, fontWeight: 900, padding: "3px 10px", borderRadius: 4,
                  }}>
                    مرجان تایم
                  </span>
                </div>

                {/* Image */}
                <Link href={`/product/${p.slug}`} style={{ display: "block", textDecoration: "none" }}>
                  <div style={{
                    height: 130, background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "8px 16px", overflow: "hidden",
                  }}>
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <i className="ti ti-package" style={{ fontSize: 44, color: "#d1d5db" }} />
                    )}
                  </div>
                </Link>

                {/* Body */}
                <div style={{
                  padding: "8px 12px 10px", flex: 1,
                  display: "flex", flexDirection: "column", gap: 8,
                  borderTop: "1px solid #f0f0f0",
                }}>
                  <Link href={`/product/${p.slug}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      fontSize: 11.5, fontWeight: 600, color: "#222", lineHeight: 1.55,
                      minHeight: 36,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {p.name}
                    </div>
                  </Link>

                  {/* Pricing */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{
                      background: "#c0392b", color: "#fff",
                      fontSize: 12, fontWeight: 900, padding: "3px 8px",
                      borderRadius: 4, minWidth: 40, textAlign: "center",
                    }}>
                      {discountPct}٪
                    </span>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#1a1a1a" }}>
                        {flashPrice.toLocaleString("fa-IR")}
                      </div>
                      <div style={{ fontSize: 10, color: "#bbb", textDecoration: "line-through" }}>
                        {p.price.toLocaleString("fa-IR")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timer strip at bottom */}
                <div style={{
                  borderTop: "1px solid #f0f0f0",
                  padding: "7px 12px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 10.5, color: "#999",
                  }}>
                    <i className="ti ti-clock" style={{ fontSize: 11 }} />
                    زمان باقی‌مانده
                  </span>
                  <span style={{
                    color: "#c0392b", fontWeight: 900, fontSize: 12.5,
                    letterSpacing: "1px", fontVariantNumeric: "tabular-nums",
                  }}>
                    {cardTimer}
                  </span>
                </div>
              </div>
            );
          })}
        </HScrollSlider>
      </div>
    </div>
  );
}
