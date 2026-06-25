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

  const units = [
    { val: timeLeft.d, label: "روز" },
    { val: timeLeft.h, label: "ساعت" },
    { val: timeLeft.m, label: "دقیقه" },
    { val: timeLeft.s, label: "ثانیه" },
  ];

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(135deg, #0b1d3a 0%, #1a3a6e 100%)",
      boxShadow: "0 4px 32px rgba(0,0,0,.22)",
    }}>
      {/* ── Header bar ── */}
      <div style={{
        background: "linear-gradient(90deg, #c2410c 0%, var(--accent) 100%)",
        padding: "12px 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
      }}>
        {/* Title + countdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-clock-bolt" style={{ color: "#fff", fontSize: 22 }} />
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
                  background: "rgba(0,0,0,.25)",
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
          همه پیشنهادات <i className="ti ti-arrow-left" />
        </Link>
      </div>

      {/* ── Products ── */}
      <div style={{ padding: "1.25rem 2rem 1.5rem" }}>
        <HScrollSlider gap={12} scrollAmount={170} fadeColor="#0f2244">
          {products.map((p) => {
            const flashPrice = Math.round(p.price * (1 - discountPct / 100));
            return (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                style={{
                  flexShrink: 0, width: 158,
                  background: "#fff", borderRadius: 12,
                  overflow: "hidden", textDecoration: "none",
                  display: "flex", flexDirection: "column",
                  boxShadow: "0 4px 18px rgba(0,0,0,.28)",
                  transition: "transform .18s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                {/* Image */}
                <div style={{
                  height: 138, background: "var(--bg2)", position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}>
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <i className="ti ti-package" style={{ fontSize: 44, color: "var(--border)" }} />
                  )}
                  {/* Discount circle badge */}
                  <div style={{
                    position: "absolute", top: 7, left: 7,
                    width: 40, height: 40, borderRadius: "50%",
                    background: "#e53935", color: "#fff",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 900, lineHeight: 1.1,
                    boxShadow: "0 2px 8px rgba(229,57,53,.5)",
                  }}>
                    <span>{discountPct}٪</span>
                    <span style={{ fontSize: 7.5 }}>تخفیف</span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "9px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{
                    fontSize: 11.5, fontWeight: 700, color: "var(--text)",
                    lineHeight: 1.45, minHeight: 32,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {p.name}
                  </div>
                  <div style={{ marginTop: "auto" }}>
                    <div style={{ fontSize: 10.5, color: "var(--text3)", textDecoration: "line-through", marginBottom: 1 }}>
                      {p.price.toLocaleString("fa-IR")} تومان
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#c2410c" }}>
                      {flashPrice.toLocaleString("fa-IR")} تومان
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </HScrollSlider>
      </div>
    </div>
  );
}
