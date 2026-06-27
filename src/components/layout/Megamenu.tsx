"use client";

import { useRef, useEffect, useLayoutEffect, useState, useId } from "react";
import Link from "next/link";
import { ShaderDisplacementGenerator, fragmentShaders } from "@/lib/liquid-glass/shader-utils";

const _cache = new Map<string, string>();
function getMegaShader(w: number, h: number): string {
  const key = `${w}x${h}`;
  if (!_cache.has(key)) {
    const gen = new ShaderDisplacementGenerator({ width: w, height: h, fragment: fragmentShaders.liquidGlass });
    _cache.set(key, gen.updateShader());
    gen.destroy();
  }
  return _cache.get(key)!;
}

const categories = [
  {
    label: "شیرآلات",
    icon: "ti-circle-dotted",
    href: "/category/valves",
    children: [
      { label: "شیر توپی",      href: "/category/ball-valve",      icon: "ti-circle-dotted" },
      { label: "شیر سوزنی",     href: "/category/needle-valve",    icon: "ti-adjustments" },
      { label: "شیر یک‌طرفه",   href: "/category/check-valve",     icon: "ti-git-branch" },
      { label: "شیر فلکه",      href: "/category/gate-valve",      icon: "ti-filter" },
      { label: "شیر رادیاتور",  href: "/category/radiator-valve",  icon: "ti-tool" },
      { label: "شیر مخلوط",     href: "/category/mixer-valve",     icon: "ti-droplet" },
    ],
  },
  {
    label: "لوله‌ها",
    icon: "ti-minus",
    href: "/category/pipes",
    children: [
      { label: "لوله پلیکا PVC",    href: "/category/pvc-pipe",        icon: "ti-minus" },
      { label: "لوله پوش‌فیت",      href: "/category/pushfit-pipe",    icon: "ti-minus" },
      { label: "لوله پنج‌لایه",     href: "/category/multilayer-pipe", icon: "ti-minus" },
      { label: "لوله مانیسمان",     href: "/category/seamless-pipe",   icon: "ti-minus" },
      { label: "لوله گالوانیزه",    href: "/category/galvanized-pipe", icon: "ti-minus" },
      { label: "لوله پلی‌اتیلن",   href: "/category/pe-pipe",         icon: "ti-minus" },
    ],
  },
  {
    label: "اتصالات",
    icon: "ti-git-merge",
    href: "/category/fittings",
    children: [
      { label: "زانو",      href: "/category/elbow",    icon: "ti-git-merge" },
      { label: "سه‌راهی",   href: "/category/tee",      icon: "ti-git-branch-2" },
      { label: "بوشن",      href: "/category/coupling", icon: "ti-minus" },
      { label: "درپوش",     href: "/category/cap",      icon: "ti-circle" },
      { label: "تبدیل",     href: "/category/reducer",  icon: "ti-layout-sidebar" },
      { label: "فلنج",      href: "/category/flange",   icon: "ti-maximize" },
    ],
  },
  {
    label: "پمپ و تجهیزات",
    icon: "ti-activity",
    href: "/category/pumps",
    children: [
      { label: "پمپ آب",         href: "/category/water-pump",      icon: "ti-activity" },
      { label: "منبع انبساط",    href: "/category/expansion-tank",  icon: "ti-thermometer" },
      { label: "فیلتر آب",       href: "/category/water-filter",    icon: "ti-filter" },
      { label: "پمپ تخلیه",      href: "/category/drain-pump",      icon: "ti-bolt" },
    ],
  },
  {
    label: "لوازم بهداشتی",
    icon: "ti-droplet",
    href: "/category/sanitary",
    children: [
      { label: "شیر مخلوط",  href: "/category/mixer",    icon: "ti-droplet" },
      { label: "سیفون",       href: "/category/siphon",   icon: "ti-bath" },
      { label: "یراق‌آلات",   href: "/category/hardware", icon: "ti-tool" },
    ],
  },
];

export default function Megamenu() {
  const barRef = useRef<HTMLDivElement>(null);
  const rawId = useId().replace(/:/g, "");
  const filterId = `mgb-${rawId}`;
  const [shaderUrl, setShaderUrl] = useState("");
  const [pinned, setPinned] = useState(false);

  /* Switch between relative (in-flow) and fixed (pinned) based on navbar scroll.
     position:sticky is avoided — sticky+z-index creates an isolated compositing layer
     that breaks backdropFilter (samples empty layer instead of slider content).
     position:fixed correctly uses the root compositing layer as backdrop. */
  useLayoutEffect(() => {
    function checkPin() {
      const nav = document.querySelector<HTMLElement>("nav.site-nav");
      if (!nav) { setPinned(window.scrollY > 10); return; }
      setPinned(nav.getBoundingClientRect().bottom <= 0);
    }
    checkPin();
    window.addEventListener("scroll", checkPin, { passive: true });
    return () => window.removeEventListener("scroll", checkPin);
  }, []);

  useEffect(() => {
    function measure() {
      if (!barRef.current) return;
      const r = barRef.current.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      if (w <= 0 || h <= 0) return;
      setShaderUrl(getMegaShader(w, h));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      ref={barRef}
      className="megabar"
      style={pinned
        ? { position: "fixed", top: 0, left: 0, right: 0, width: "100%", zIndex: 50 }
        : { position: "absolute", top: 0, left: 0, right: 0, width: "100%", zIndex: 50 }
      }
    >
      {shaderUrl && (
        <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden>
          <defs>
            <filter id={filterId} x="-150%" y="-150%" width="400%" height="400%" colorInterpolationFilters="sRGB">
              <feImage x="0" y="0" width="100%" height="100%" result="DMAP" href={shaderUrl} preserveAspectRatio="xMidYMid slice" />
              <feDisplacementMap in="SourceGraphic" in2="DMAP" scale="30" xChannelSelector="R" yChannelSelector="B" result="RED_D" />
              <feColorMatrix in="RED_D" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
              <feDisplacementMap in="SourceGraphic" in2="DMAP" scale="27" xChannelSelector="R" yChannelSelector="B" result="GRN_D" />
              <feColorMatrix in="GRN_D" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
              <feDisplacementMap in="SourceGraphic" in2="DMAP" scale="24" xChannelSelector="R" yChannelSelector="B" result="BLU_D" />
              <feColorMatrix in="BLU_D" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
              <feBlend in="G" in2="B" mode="screen" result="GB" />
              <feBlend in="R" in2="GB" mode="screen" />
            </filter>
          </defs>
        </svg>
      )}
      {/* Layer 1: backdrop-filter ONLY — no filter property, so it samples real page content */}
      <span style={{
        position: "absolute", inset: 0,
        borderRadius: "0 0 18px 18px",
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      {/* Layer 2: SVG displacement ONLY — TEMPORARILY DISABLED FOR DIAGNOSTIC */}
      {/* {shaderUrl && (
        <span style={{
          position: "absolute", inset: 0,
          borderRadius: "0 0 18px 18px",
          filter: `url(#${filterId})`,
          pointerEvents: "none", zIndex: 1,
          opacity: 0.6,
        }} />
      )} */}

      {/* ── Nav content ── */}
      <div
        style={{
          position: "relative", zIndex: 10,
          width: "100%",
          padding: "0 2rem",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        {categories.map((item) => (
          <div key={item.href} className="mega-item" style={{ position: "relative" }}>
            <Link
              href={item.href}
              className="mega-nav-link"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "14px 16px",
                color: "var(--text2)", fontSize: 13.5, fontWeight: 700,
                whiteSpace: "nowrap", cursor: "pointer",
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 14, color: "var(--primary)" }} />
              <span data-label>{item.label}</span>
              <i className="ti ti-chevron-down" style={{ fontSize: 10, opacity: 0.5 }} />
            </Link>

            <div className="mega-drop">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 18px", fontSize: 13,
                    color: "var(--text2)", fontWeight: 700,
                  }}
                >
                  <i className={`ti ${child.icon}`} style={{ fontSize: 16, color: "var(--primary)" }} />
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* ── Left-side items ── */}
        <div style={{ marginRight: "auto", display: "flex", alignItems: "stretch" }}>
          <Link
            href="/blog"
            className="mega-nav-link"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px", color: "var(--text2)", fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap" }}
          >
            <i className="ti ti-news" style={{ fontSize: 15, color: "var(--primary)" }} /> <span data-label>وبلاگ</span>
          </Link>

          <div className="mega-item" style={{ position: "relative" }}>
            <span className="mega-nav-link" style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px", color: "var(--text2)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              <i className="ti ti-file-invoice" style={{ fontSize: 14, color: "var(--primary)" }} />
              <span data-label>فاکتورساز</span>
              <span style={{ background: "#17a865", color: "#fff", fontSize: 10, fontWeight: 900, padding: "1px 7px", borderRadius: 20, lineHeight: 1.6 }}>جدید</span>
              <i className="ti ti-chevron-down" style={{ fontSize: 10, opacity: 0.5 }} />
            </span>
            <div className="mega-drop" style={{ minWidth: 300, padding: 16, right: 0, left: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                نوع فاکتور را انتخاب کنید
              </div>
              <Link href="/invoice?type=official" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", marginBottom: 10, textDecoration: "none" }}>
                <div style={{ width: 40, height: 40, background: "var(--bg)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-file-certificate" style={{ fontSize: 20, color: "var(--primary)" }} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 13, fontWeight: 900 }}>فاکتور فروش</strong>
                  <span style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>فاکتور کامل با اطلاعات خریدار، مالیات، تخفیف و چاپ رسمی</span>
                </div>
              </Link>
              <Link href="/invoice?type=contractor" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", textDecoration: "none" }}>
                <div style={{ width: 40, height: 40, background: "var(--bg)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-helmet" style={{ fontSize: 20, color: "var(--primary)" }} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 13, fontWeight: 900 }}>فاکتور مجریان</strong>
                  <span style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>لیست سریع لوله، اتصالات و شیرآلات با سایزبندی</span>
                </div>
              </Link>
            </div>
          </div>

          <Link
            href="/organizational"
            className="mega-nav-link"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "14px 18px",
              color: "var(--accent)", fontSize: 13.5, fontWeight: 900,
              whiteSpace: "nowrap", borderRight: "1px solid var(--border)",
            }}
          >
            <i className="ti ti-building-skyscraper" style={{ fontSize: 14 }} />
            <span data-label>خرید سازمانی</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
