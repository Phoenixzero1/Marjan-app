"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

export interface SliderSlide {
  id: string;
  imageUrl: string | null;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
}

export interface SliderSettings {
  autoPlay: boolean;
  interval: number;
  showArrows: boolean;
  showDots: boolean;
}

interface Props {
  slides: SliderSlide[];
  settings: SliderSettings;
}

export default function HeroSlider({ slides, settings }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = slides.length;

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [goTo, current]);
  const prev = useCallback(() => goTo(current - 1), [goTo, current]);

  useEffect(() => {
    if (!settings.autoPlay || paused || total <= 1) return;
    timerRef.current = setInterval(next, settings.interval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [settings.autoPlay, settings.interval, paused, total, next]);

  if (total === 0) return null;

  return (
    <section
      style={{ position: "relative", overflow: "hidden", background: "var(--primary-dark)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="اسلایدر اصلی"
    >
      {/* Slide track — all slides absolute-stacked, fade between them */}
      <div style={{ position: "relative", height: "clamp(280px, 46vw, 520px)" }}>
        {slides.map((slide, i) => {
          const active = i === current;
          return (
            <div
              key={slide.id}
              aria-hidden={!active}
              style={{
                position: "absolute",
                inset: 0,
                opacity: active ? 1 : 0,
                transition: "opacity 0.6s ease",
                pointerEvents: active ? "auto" : "none",
                background: slide.imageUrl
                  ? `url(${slide.imageUrl}) center/cover no-repeat`
                  : "linear-gradient(135deg,var(--primary-dark) 0%,#1a5fa0 100%)",
              }}
            >
              {/* Overlay for readability */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: slide.imageUrl
                    ? "linear-gradient(to left, rgba(0,0,0,.6) 0%, rgba(0,0,0,.2) 60%, transparent 100%)"
                    : "radial-gradient(circle at 80% 50%,rgba(232,146,10,.12) 0%,transparent 60%)",
                }}
              />
              {/* Content */}
              <div
                style={{
                  position: "relative",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  maxWidth: 1280,
                  margin: "0 auto",
                  padding: "2rem 2rem 4rem",
                }}
              >
                <div style={{ maxWidth: 560 }}>
                  {slide.title && (
                    <h1
                      style={{
                        fontSize: "clamp(22px, 3.5vw, 44px)",
                        fontWeight: 900,
                        lineHeight: 1.25,
                        color: "#fff",
                        marginBottom: "1rem",
                        textShadow: "0 2px 8px rgba(0,0,0,.4)",
                      }}
                    >
                      {slide.title}
                    </h1>
                  )}
                  {slide.subtitle && (
                    <p
                      style={{
                        fontSize: "clamp(13px, 1.5vw, 16px)",
                        color: "rgba(255,255,255,.85)",
                        maxWidth: 480,
                        marginBottom: "2rem",
                        lineHeight: 1.7,
                        textShadow: "0 1px 4px rgba(0,0,0,.3)",
                      }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.buttonText && slide.buttonLink && (
                    <Link
                      href={slide.buttonLink}
                      style={{
                        background: "var(--accent)",
                        color: "#fff",
                        padding: "13px 30px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 14,
                        fontWeight: 900,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 4px 16px rgba(232,146,10,.5)",
                        transition: "transform .15s, box-shadow .15s",
                      }}
                    >
                      {slide.buttonText}
                      <i className="ti ti-arrow-left" style={{ fontSize: 16 }} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation arrows */}
      {settings.showArrows && total > 1 && (
        <>
          {/* Next (RTL: left side) */}
          <button
            onClick={next}
            aria-label="اسلاید بعدی"
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,.18)",
              border: "1.5px solid rgba(255,255,255,.35)",
              color: "#fff",
              fontSize: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
              transition: "background .2s",
              zIndex: 5,
            }}
          >
            <i className="ti ti-chevron-left" />
          </button>
          {/* Prev (RTL: right side) */}
          <button
            onClick={prev}
            aria-label="اسلاید قبلی"
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,.18)",
              border: "1.5px solid rgba(255,255,255,.35)",
              color: "#fff",
              fontSize: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
              transition: "background .2s",
              zIndex: 5,
            }}
          >
            <i className="ti ti-chevron-right" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {settings.showDots && total > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 8,
            zIndex: 5,
          }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`اسلاید ${i + 1}`}
              style={{
                width: i === current ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? "var(--accent)" : "rgba(255,255,255,.5)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all .3s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* Slide counter (top-left) */}
      {total > 1 && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: "rgba(0,0,0,.4)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 20,
            backdropFilter: "blur(4px)",
            zIndex: 5,
          }}
        >
          {current + 1} / {total}
        </div>
      )}
    </section>
  );
}
