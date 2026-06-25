"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  children: React.ReactNode;
  gap?: number;
  scrollAmount?: number;
  /** Override the gradient fade color (default: #fff for white backgrounds) */
  fadeColor?: string;
}

function SliderArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        position: "absolute",
        [side]: 6,
        top: "50%",
        transform: `translateY(-50%) scale(${h ? 1.1 : 1})`,
        zIndex: 10,
        width: 40, height: 40,
        borderRadius: "50%",
        background: "#fff",
        border: "1.5px solid #e5e7eb",
        boxShadow: h
          ? "0 6px 20px rgba(0,0,0,.20)"
          : "0 2px 10px rgba(0,0,0,.13)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform .16s ease, box-shadow .16s ease",
        padding: 0,
        pointerEvents: "auto",
      }}
    >
      <i
        className={`ti ti-chevron-${side}`}
        style={{ fontSize: 17, color: "#374151", lineHeight: 1 }}
      />
    </button>
  );
}

export default function HScrollSlider({ children, gap = 12, scrollAmount = 210, fadeColor = "#fff" }: Props) {
  const ref       = useRef<HTMLDivElement>(null);
  const [showL, setShowL] = useState(false);
  const [showR, setShowR] = useState(false);

  const setup = useCallback(() => {
    const el = ref.current;
    if (!el || !el.children.length) return;

    const first = el.children[0] as HTMLElement;
    const last  = el.children[el.children.length - 1] as HTMLElement;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          // RTL: first child = rightmost → show Right btn when not visible (scrolled away)
          if (e.target === first) setShowR(!e.isIntersecting);
          // RTL: last child  = leftmost  → show Left  btn when not visible (more to see)
          if (e.target === last)  setShowL(!e.isIntersecting);
        });
      },
      { root: el, threshold: 0.85 }
    );

    obs.observe(first);
    obs.observe(last);
    return () => obs.disconnect();
  }, []);

  useEffect(() => setup(), [setup]);

  function scroll(dir: "left" | "right") {
    const el = ref.current;
    if (!el) return;
    // Left btn → scroll physically left (negative); Right btn → scroll right (positive)
    el.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Fade + arrow — right side (go back toward start in RTL) */}
      {showR && (
        <>
          <div
            aria-hidden
            style={{
              position: "absolute", right: 0, top: 0, bottom: 4,
              width: 64, pointerEvents: "none", zIndex: 8,
              background: `linear-gradient(to left, ${fadeColor} 35%, transparent)`,
            }}
          />
          <SliderArrow side="right" onClick={() => scroll("right")} />
        </>
      )}

      {/* Fade + arrow — left side (forward / more items in RTL) */}
      {showL && (
        <>
          <div
            aria-hidden
            style={{
              position: "absolute", left: 0, top: 0, bottom: 4,
              width: 64, pointerEvents: "none", zIndex: 8,
              background: `linear-gradient(to right, ${fadeColor} 35%, transparent)`,
            }}
          />
          <SliderArrow side="left" onClick={() => scroll("left")} />
        </>
      )}

      {/* Scroll track */}
      <div
        ref={ref}
        style={{
          display: "flex",
          gap,
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingBottom: 4,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>
    </div>
  );
}
