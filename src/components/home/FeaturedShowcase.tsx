"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";

export interface ShowcaseSlide {
  id: string;
  headline: string;
  subline?: string;
  description?: string;
  bgColor: string;
  imageUrl?: string | null;
  price?: number | null;
  salePrice?: number | null;
  buttonText?: string;
  buttonLink?: string;
  productId?: string | null;
  productSlug?: string | null;
}

interface Props { slides: ShowcaseSlide[]; }

const DEMO_SLIDES: ShowcaseSlide[] = [
  {
    id: "demo-1",
    headline: "شیر توپی برنجی",
    subline: "کیفیت اروپایی",
    description: "با بدنه برنجی فشرده، آب‌بندی دقیق و دوام بالا. مناسب برای تمام سیستم‌های لوله‌کشی ساختمانی و صنعتی.",
    bgColor: "#0a2a5e",
    imageUrl: null,
    price: 4500000,
    salePrice: 3600000,
    buttonText: "افزودن به سبد",
    buttonLink: "/products",
  },
  {
    id: "demo-2",
    headline: "پمپ آب خانگی",
    subline: "فشار بالا — بی‌سروصدا",
    description: "موتور ضدزنگ با بازده بالا، مناسب آبرسانی طبقات. گارانتی ۲ ساله.",
    bgColor: "#065f46",
    imageUrl: null,
    price: 12000000,
    salePrice: null,
    buttonText: "مشاهده محصول",
    buttonLink: "/products",
  },
];

// ── Simple white arrow button ─────────────────────────────────────────────────
function ArrowBtn({
  side, onClick,
}: { side: "left" | "right"; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      aria-label={side === "right" ? "قبلی" : "بعدی"}
      style={{
        position: "absolute",
        [side]: 20,
        top: "50%",
        transform: `translateY(-50%) scale(${h ? 1.08 : 1})`,
        zIndex: 10,
        width: 42,
        height: 42,
        borderRadius: "50%",
        background: "#fff",
        border: "none",
        boxShadow: h
          ? "0 6px 20px rgba(0,0,0,.22)"
          : "0 2px 10px rgba(0,0,0,.14)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform .16s ease, box-shadow .16s ease",
        padding: 0,
      }}
    >
      <i
        className={`ti ti-chevron-${side}`}
        style={{ fontSize: 18, color: "#374151" }}
      />
    </button>
  );
}

// ── Track slide change for animation reset ────────────────────────────────────
function useAnimKey(dep: number) {
  const [key, setKey] = useState(0);
  const prev = useRef(dep);
  useEffect(() => {
    if (dep !== prev.current) { prev.current = dep; setKey((k) => k + 1); }
  }, [dep]);
  return key;
}

export default function FeaturedShowcase({ slides: rawSlides }: Props) {
  const slides  = rawSlides && rawSlides.length > 0 ? rawSlides : DEMO_SLIDES;
  const isDemo  = !rawSlides || rawSlides.length === 0;
  const [idx, setIdx] = useState(0);
  const { addItem, openCart } = useCart();
  const animKey = useAnimKey(idx);
  const total   = slides.length;

  const go   = useCallback((i: number) => setIdx(((i % total) + total) % total), [total]);
  const next = useCallback(() => go(idx + 1), [go, idx]);
  const prev = useCallback(() => go(idx - 1), [go, idx]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") prev();
      if (e.key === "ArrowLeft")  next();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev]);

  const s         = slides[idx];
  const finalPrice = s.salePrice ?? s.price;
  const hasDisc   = !!(s.salePrice && s.price && s.salePrice < s.price);
  const discPct   = hasDisc && s.price && s.salePrice
    ? Math.round((1 - s.salePrice / s.price) * 100)
    : 0;

  function addCart() {
    if (!s.productId || !finalPrice) return;
    addItem({
      id: s.productId,
      name: s.headline,
      price: finalPrice,
      quantity: 1,
      imageUrl: s.imageUrl ?? undefined,
    });
    openCart();
  }

  return (
    <>
      <style>{`
        @keyframes sc-left {
          from { opacity:0; transform:translateX(48px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes sc-right {
          from { opacity:0; transform:translateX(-60px) rotate(-6deg) scale(.92); }
          60%  { transform:translateX(6px) rotate(1deg) scale(1.02); }
          to   { opacity:1; transform:translateX(0) rotate(0) scale(1); }
        }
        .sc-anim-text { animation: sc-left  .45s cubic-bezier(.25,.8,.25,1) both; }
        .sc-anim-img  { animation: sc-right .55s cubic-bezier(.25,.8,.25,1) both; }
      `}</style>

      <div
        dir="rtl"
        style={{
          position: "relative",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 4px 32px rgba(0,0,0,.12), 0 1px 4px rgba(0,0,0,.06)",
          display: "flex",
          height: 500,
        }}
      >
        {/* Demo badge */}
        {isDemo && (
          <div style={{
            position: "absolute", top: 14, right: 14, zIndex: 20,
            background: "rgba(0,0,0,.55)", color: "#fff",
            fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
            backdropFilter: "blur(6px)",
          }}>
            نمونه — از پنل ادمین اسلاید اضافه کنید
          </div>
        )}

        {/* ── RIGHT: pure white text panel ──────────────────────────────── */}
        <div
          key={`txt-${animKey}`}
          className="sc-anim-text"
          style={{
            flex: "0 0 56%",
            background: "#ffffff",
            padding: "3rem 3.5rem 3rem 2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {/* Title */}
          <div>
            <h2 style={{
              fontSize: "clamp(32px, 4vw, 58px)",
              fontWeight: 900,
              lineHeight: 1.1,
              color: "#111",
              margin: 0,
              letterSpacing: "-.02em",
            }}>
              {s.headline}
            </h2>
            {s.subline && (
              <p style={{
                fontSize: "clamp(18px, 2.2vw, 32px)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "#6b7280",
                marginTop: 4,
                lineHeight: 1.2,
              }}>
                {s.subline}
              </p>
            )}
          </div>

          {/* Price */}
          {finalPrice != null && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{
                fontSize: "clamp(22px, 2.5vw, 30px)",
                fontWeight: 900,
                color: hasDisc ? "#dc2626" : "#111",
              }}>
                {formatPrice(finalPrice)}
              </span>
              {hasDisc && s.price && (
                <>
                  <span style={{ fontSize: 14, color: "#9ca3af", textDecoration: "line-through" }}>
                    {formatPrice(s.price)}
                  </span>
                  <span style={{
                    background: "#dc2626", color: "#fff",
                    fontSize: 11, fontWeight: 900,
                    padding: "2px 9px", borderRadius: 20,
                  }}>
                    {discPct}٪
                  </span>
                </>
              )}
            </div>
          )}

          {/* Description */}
          {s.description && (
            <p style={{
              fontSize: 13.5,
              color: "#6b7280",
              lineHeight: 1.75,
              maxWidth: 360,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}>
              {s.description}
            </p>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {s.productId && finalPrice != null ? (
              <button
                onClick={addCart}
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  padding: "13px 28px",
                  borderRadius: 40,
                  fontSize: 14,
                  fontWeight: 900,
                  fontFamily: "Vazirmatn, sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--primary-mid)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--primary)"; }}
              >
                <i className="ti ti-shopping-cart" style={{ fontSize: 16 }} />
                {s.buttonText ?? "افزودن به سبد"}
              </button>
            ) : s.buttonLink ? (
              <Link
                href={s.buttonLink}
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  padding: "13px 28px",
                  borderRadius: 40,
                  fontSize: 14,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none",
                  transition: "background .15s",
                }}
              >
                <i className="ti ti-eye" style={{ fontSize: 16 }} />
                {s.buttonText ?? "مشاهده محصول"}
              </Link>
            ) : null}

            {(s.productSlug || s.buttonLink) && (
              <Link
                href={s.productSlug ? `/product/${s.productSlug}` : (s.buttonLink ?? "/products")}
                style={{
                  color: "var(--primary)",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                  borderBottom: "1.5px solid transparent",
                  paddingBottom: 1,
                  transition: "border-color .15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderBottomColor = "var(--primary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderBottomColor = "transparent"; }}
              >
                مشاهده کامل
              </Link>
            )}
          </div>

          {/* Dots */}
          {total > 1 && (
            <div style={{ display: "flex", gap: 7, marginTop: 4 }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  style={{
                    width: i === idx ? 26 : 8, height: 8, borderRadius: 4, padding: 0,
                    background: i === idx ? "var(--primary)" : "#d1d5db",
                    border: "none", cursor: "pointer",
                    transition: "all .3s ease",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── LEFT: solid color image panel ─────────────────────────────── */}
        <div
          style={{
            flex: "0 0 44%",
            background: s.bgColor,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            transition: "background .4s ease",
          }}
        >
          {s.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`img-${animKey}`}
              src={s.imageUrl}
              alt={s.headline}
              className="sc-anim-img"
              style={{
                maxHeight: "88%",
                maxWidth: "82%",
                objectFit: "contain",
                position: "relative",
                zIndex: 2,
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,.3))",
              }}
            />
          ) : (
            <div key={`ph-${animKey}`} className="sc-anim-img" style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              color: "rgba(255,255,255,.3)",
            }}>
              <i className="ti ti-photo" style={{ fontSize: 72 }} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>تصویر محصول</span>
            </div>
          )}
        </div>

        {/* ── Arrows ────────────────────────────────────────────────────── */}
        {total > 1 && (
          <>
            <ArrowBtn side="right" onClick={prev} />
            <ArrowBtn side="left"  onClick={next} />
          </>
        )}
      </div>
    </>
  );
}
