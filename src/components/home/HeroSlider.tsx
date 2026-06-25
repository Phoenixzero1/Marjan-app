"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ShaderDisplacementGenerator, fragmentShaders } from "@/lib/liquid-glass/shader-utils";

/* Shared 48×48 displacement map — generated once, reused by both buttons */
let _sliderShaderUrl = "";
function getSliderShader(): string {
  if (!_sliderShaderUrl) {
    const gen = new ShaderDisplacementGenerator({ width: 48, height: 48, fragment: fragmentShaders.liquidGlass });
    _sliderShaderUrl = gen.updateShader();
    gen.destroy();
  }
  return _sliderShaderUrl;
}


export interface SliderSlide {
  id: string;
  imageUrl: string | null;
  buttonLink: string | null;
}
export interface SliderSettings {
  autoPlay: boolean;
  interval: number;
  showArrows: boolean;
  showDots: boolean;
}

let _sliderFilterId = 0;

function SliderBtn({
  dir,
  onClick,
  label,
}: {
  dir: "right" | "left";
  onClick: () => void;
  label: string;
}) {
  const isR = dir === "right";
  const filterId = useRef(`sb-${++_sliderFilterId}`).current;
  const [shaderUrl, setShaderUrl] = useState("");

  useEffect(() => {
    setShaderUrl(getSliderShader());
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        [isR ? "right" : "left"]: 20,
        top: "calc(50% - 24px)",
        width: 48, height: 48,
        zIndex: 5,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
        border: "1.5px solid rgba(255,255,255,0.45)",
        boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.9), inset 1px 1px 6px rgba(255,255,255,0.2), 0 3px 12px rgba(0,0,0,0.2)",
      }}
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
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        ...(shaderUrl ? { filter: `url(#${filterId})` } : {}),
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        overflow: "hidden", pointerEvents: "none", zIndex: 0,
      }} />
      <button
        onClick={onClick}
        aria-label={label}
        style={{
          position: "absolute", inset: 0,
          background: "transparent", border: "none", color: "#fff",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 22, zIndex: 1,
        }}
      >
        <i className={`ti ti-chevron-${isR ? "right" : "left"}`} style={{ textShadow: "0 1px 6px rgba(0,0,0,0.55)" }} />
      </button>
    </div>
  );
}

export default function HeroSlider({
  slides,
  settings,
}: {
  slides: SliderSlide[];
  settings: SliderSettings;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = slides.length;
  const goTo = useCallback(
    (idx: number) => setCurrent(((idx % total) + total) % total),
    [total]
  );
  const next = useCallback(() => goTo(current + 1), [goTo, current]);
  const prev = useCallback(() => goTo(current - 1), [goTo, current]);

  useEffect(() => {
    if (!settings.autoPlay || paused || total <= 1) return;
    timerRef.current = setInterval(next, settings.interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [settings.autoPlay, settings.interval, paused, total, next]);

  // Keyboard navigation — ArrowLeft = next, ArrowRight = prev (RTL layout)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")  next();
      else if (e.key === "ArrowRight") prev();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (total === 0) return null;

  return (
    <section
      style={{ position: "relative", overflow: "hidden", background: "#071d42" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="اسلایدر اصلی"
    >
      {/* Preload first slide image — improves LCP */}
      {slides[0]?.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slides[0].imageUrl} alt="" aria-hidden
          loading="eager"
          style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
        />
      )}

      {/* Slide track */}
      <div style={{ position: "relative", height: "clamp(280px, 46vw, 520px)" }}>
        {slides.map((slide, i) => {
          const active = i === current;
          const bg = slide.imageUrl
            ? `url(${slide.imageUrl}) center/cover no-repeat`
            : "linear-gradient(135deg,#071d42 0%,#1a5fa0 100%)";
          const shared: React.CSSProperties = {
            position: "absolute", inset: 0, display: "block",
            opacity: active ? 1 : 0, transition: "opacity 0.7s ease",
            pointerEvents: active ? "auto" : "none",
            background: bg, textDecoration: "none",
          };
          return slide.buttonLink ? (
            <a key={slide.id} href={slide.buttonLink} style={shared}
               aria-hidden={!active} tabIndex={active ? 0 : -1} />
          ) : (
            <div key={slide.id} style={shared} aria-hidden={!active} />
          );
        })}

        {/* Dots */}
        {settings.showDots && total > 1 && (
          <div style={{
            position: "absolute", bottom: 18, left: "50%",
            transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 5,
          }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} aria-label={`اسلاید ${i + 1}`}
                style={{
                  width: i === current ? 28 : 8, height: 8, borderRadius: 4,
                  background: i === current ? "var(--accent)" : "rgba(255,255,255,.45)",
                  border: "none", cursor: "pointer", padding: 0, transition: "all .3s ease",
                }}
              />
            ))}
          </div>
        )}

        {/* Triangle arrows — GlassBtn style */}
        {settings.showArrows && total > 1 && (
          <>
            <SliderBtn dir="right" onClick={prev} label="اسلاید قبلی" />
            <SliderBtn dir="left"  onClick={next} label="اسلاید بعدی" />
          </>
        )}
      </div>
    </section>
  );
}
