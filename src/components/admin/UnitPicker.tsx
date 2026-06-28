"use client";

import { useState, useRef, useEffect } from "react";

const STANDARD_UNITS = ["عدد", "بسته", "کارتن", "متر", "شاخه", "کیلوگرم", "گرم", "لیتر"];

interface Props {
  value: string;
  onChange: (unit: string) => void;
  size?: "sm" | "md";
}

export default function UnitPicker({ value, onChange, size = "md" }: Props) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCustomMode(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (unit: string) => {
    onChange(unit);
    setOpen(false);
    setCustomMode(false);
    setCustomValue("");
  };

  const isSm = size === "sm";

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={() => { setOpen((p) => !p); setCustomMode(false); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: value ? "rgba(10,42,94,0.07)" : "#fff",
          border: `1.5px solid ${value ? "rgba(10,42,94,0.25)" : "var(--border)"}`,
          borderRadius: "var(--radius-sm)",
          padding: isSm ? "4px 9px" : "7px 12px",
          fontSize: isSm ? 11 : 12, fontWeight: 700, fontFamily: "Vazirmatn",
          cursor: "pointer",
          color: value ? "var(--primary)" : "var(--text3)",
          transition: "all .15s",
        }}
      >
        <i className="ti ti-cube" style={{ fontSize: isSm ? 11 : 13 }} />
        {value || "واحد"}
        <i className={`ti ti-chevron-${open ? "up" : "down"}`} style={{ fontSize: 10, opacity: 0.7 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200,
          background: "#fff", border: "1.5px solid var(--border)",
          borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,.13)",
          width: 200, padding: "10px",
        }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text3)", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid var(--border)" }}>
            واحد فروش محصول
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {STANDARD_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => select(u)}
                style={{
                  padding: "4px 10px", fontSize: 12, fontWeight: 700,
                  fontFamily: "Vazirmatn", cursor: "pointer", borderRadius: 6,
                  border: "1.5px solid",
                  borderColor: value === u ? "var(--primary)" : "var(--border)",
                  background: value === u ? "rgba(10,42,94,0.08)" : "#fff",
                  color: value === u ? "var(--primary)" : "var(--text2)",
                  transition: "all .1s",
                }}
              >
                {u}
              </button>
            ))}
          </div>

          {customMode ? (
            <div style={{ display: "flex", gap: 6, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
              <input
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="واحد دلخواه..."
                style={{
                  flex: 1, border: "1.5px solid var(--border)", borderRadius: 6,
                  padding: "5px 8px", fontSize: 12, fontFamily: "Vazirmatn", outline: "none",
                }}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && customValue.trim()) select(customValue.trim()); }}
              />
              <button
                type="button"
                onClick={() => customValue.trim() && select(customValue.trim())}
                style={{
                  padding: "5px 10px", background: "var(--primary)", color: "#fff",
                  border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700,
                  fontFamily: "Vazirmatn", cursor: "pointer",
                }}
              >
                تأیید
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCustomMode(true)}
              style={{
                width: "100%", padding: "6px 10px",
                background: "var(--bg)", border: "1.5px dashed var(--border)",
                borderRadius: 6, fontSize: 11, fontWeight: 700,
                fontFamily: "Vazirmatn", cursor: "pointer", color: "var(--text3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: 12 }} />
              افزودن واحد دلخواه
            </button>
          )}

          {value && (
            <button
              type="button"
              onClick={() => select("")}
              style={{
                width: "100%", marginTop: 6, padding: "5px",
                fontSize: 11, fontFamily: "Vazirmatn", cursor: "pointer",
                background: "none", border: "none", color: "#c0392b", textAlign: "center",
              }}
            >
              × حذف واحد
            </button>
          )}
        </div>
      )}
    </div>
  );
}
