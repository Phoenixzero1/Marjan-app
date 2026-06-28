"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AdminToast, useAdminToast } from "./AdminUI";

interface Props {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
}

type UnitMap = Record<string, string[]>;

const chipBase: React.CSSProperties = {
  height: 38, padding: "0 14px 0 8px", borderRadius: 20,
  fontSize: 13, fontFamily: "Vazirmatn, sans-serif",
  cursor: "pointer", fontWeight: 500, transition: "all .18s",
  border: "1.5px solid #dde1ea", background: "#f7f8fb", color: "#444",
  display: "flex", alignItems: "center", gap: 6,
};

const chipActive: React.CSSProperties = {
  ...chipBase,
  background: "#2f4172", color: "#fff", borderColor: "#2f4172", fontWeight: 600,
};

export default function CategorySizesModal({ categoryId, categoryName, onClose }: Props) {
  const { toast, showToast } = useAdminToast();
  const [units, setUnits] = useState<UnitMap>({});
  const [activeUnit, setActiveUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingUnit, setAddingUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const newUnitRef = useRef<HTMLInputElement>(null);
  const lastSizeRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/categories/${categoryId}/sizes`)
      .then(r => r.json())
      .then(d => {
        const loaded: UnitMap = d.units ?? {};
        setUnits(loaded);
        const keys = Object.keys(loaded);
        if (keys.length > 0) setActiveUnit(keys[0]);
      })
      .catch(() => showToast("error", "خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, [categoryId, showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (addingUnit) newUnitRef.current?.focus();
  }, [addingUnit]);

  const confirmUnit = () => {
    const name = newUnitName.trim();
    if (!name) return;
    if (name in units) { showToast("error", "این واحد قبلاً وجود دارد"); return; }
    setUnits(prev => ({ ...prev, [name]: [] }));
    setActiveUnit(name);
    setAddingUnit(false);
    setNewUnitName("");
  };

  const removeUnit = (unit: string) => {
    setUnits(prev => {
      const next = { ...prev };
      delete next[unit];
      return next;
    });
    if (activeUnit === unit) {
      const remaining = Object.keys(units).filter(k => k !== unit);
      setActiveUnit(remaining[0] ?? null);
    }
  };

  const activeSizes = activeUnit ? (units[activeUnit] ?? []) : [];

  const addSizeRow = () => {
    if (!activeUnit) return;
    setUnits(prev => ({ ...prev, [activeUnit]: [...(prev[activeUnit] ?? []), ""] }));
    setTimeout(() => lastSizeRef.current?.focus(), 30);
  };

  const updateSize = (index: number, value: string) => {
    if (!activeUnit) return;
    setUnits(prev => {
      const arr = [...(prev[activeUnit] ?? [])];
      arr[index] = value;
      return { ...prev, [activeUnit]: arr };
    });
  };

  const removeSize = (index: number) => {
    if (!activeUnit) return;
    setUnits(prev => ({
      ...prev,
      [activeUnit]: (prev[activeUnit] ?? []).filter((_, i) => i !== index),
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}/sizes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units }),
      });
      if (!res.ok) { showToast("error", "خطا در ذخیره"); return; }
      showToast("success", "سایزبندی ذخیره شد");
    } catch { showToast("error", "خطای سرور"); }
    finally { setSaving(false); }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <AdminToast toast={toast} />
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 540, boxShadow: "0 24px 64px rgba(0,0,0,.22)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{ padding: "18px 20px 16px", borderBottom: "1.5px solid #eef0f4", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, background: "#f0f2f7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-ruler-measure" style={{ fontSize: 18, color: "#2f4172" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1e2e" }}>سایزبندی دسته‌بندی</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{categoryName}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#bbb", padding: "2px 8px", borderRadius: 8, lineHeight: 1 }}>×</button>
        </div>

        {loading ? (
          <div style={{ padding: "56px 0", textAlign: "center", color: "#ccc" }}>
            <i className="ti ti-loader-2" style={{ fontSize: 32 }} />
          </div>
        ) : (
          <>
            {/* ── Panel A: واحدها ── */}
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#888", letterSpacing: ".4px", padding: "14px 20px 8px" }}>واحدها</div>
            <div style={{ padding: "0 20px 16px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", minHeight: 42 }}>
                {Object.keys(units).map(unit => (
                  <button
                    key={unit}
                    onClick={() => setActiveUnit(unit)}
                    style={activeUnit === unit ? chipActive : chipBase}
                  >
                    {unit}
                    <span
                      onClick={e => { e.stopPropagation(); removeUnit(unit); }}
                      style={{ opacity: .55, fontSize: 14, lineHeight: 1, cursor: "pointer", padding: "0 2px" }}
                      title="حذف واحد"
                    >×</span>
                  </button>
                ))}

                {addingUnit ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, height: 38 }}>
                    <input
                      ref={newUnitRef}
                      value={newUnitName}
                      onChange={e => setNewUnitName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") confirmUnit(); if (e.key === "Escape") { setAddingUnit(false); setNewUnitName(""); } }}
                      placeholder="نام واحد..."
                      style={{ height: 38, border: "1.5px solid #2f4172", borderRadius: 20, padding: "0 14px", fontSize: 13, fontFamily: "Vazirmatn, sans-serif", outline: "none", width: 130, color: "#222" }}
                    />
                    <button
                      onClick={confirmUnit}
                      style={{ height: 34, padding: "0 14px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 20, fontSize: 13, fontFamily: "Vazirmatn, sans-serif", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      ✓ ثبت
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingUnit(true)}
                    style={{ height: 38, padding: "0 14px", border: "1.5px dashed #b0b8cc", borderRadius: 20, background: "none", color: "#888", fontSize: 13, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                  >
                    + افزودن
                  </button>
                )}
              </div>
            </div>

            <div style={{ height: 1.5, background: "#eef0f4" }} />

            {/* ── Panel B: سایزها ── */}
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#888", letterSpacing: ".4px", padding: "14px 20px 8px" }}>
              {activeUnit ? `سایزهای «${activeUnit}»` : "سایزها"}
            </div>
            <div style={{ padding: "0 20px 16px", maxHeight: 280, overflowY: "auto" }}>
              {!activeUnit ? (
                <div style={{ padding: "28px 0 10px", textAlign: "center", color: "#ccc", fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <i className="ti ti-ruler" style={{ fontSize: 28, opacity: .5 }} />
                  یک واحد از بالا انتخاب کنید
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                    {activeSizes.map((val, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          ref={i === activeSizes.length - 1 ? lastSizeRef : undefined}
                          value={val}
                          onChange={e => updateSize(i, e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") addSizeRow(); }}
                          placeholder="مثلاً: ۱/۲"
                          style={{ flex: 1, height: 40, border: "1.5px solid #dde1ea", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "Vazirmatn, sans-serif", color: "#222", background: "#fafbfc", outline: "none" }}
                        />
                        <div style={{ height: 40, minWidth: 80, border: "1.5px solid #dde1ea", borderRadius: 10, padding: "0 12px", fontSize: 13, fontFamily: "Vazirmatn, sans-serif", color: "#555", background: "#f7f8fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {activeUnit}
                        </div>
                        <button
                          onClick={() => removeSize(i)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", fontSize: 20, padding: 4, borderRadius: 8, lineHeight: 1 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#cc3333")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#ddd")}
                        >×</button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addSizeRow}
                    style={{ marginTop: 10, height: 40, width: "100%", border: "1.5px dashed #c5cad8", borderRadius: 10, background: "none", color: "#999", fontSize: 13, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    + افزودن سایز
                  </button>
                </>
              )}
            </div>

            {/* hint */}
            <div style={{ margin: "0 20px 16px", padding: "10px 14px", background: "#f5f7fc", borderRadius: 10, fontSize: 11.5, color: "#888", lineHeight: 1.8 }}>
              <i className="ti ti-info-circle" style={{ fontSize: 12, marginLeft: 4 }} />
              سایزهای تعریف‌شده در فرم ویرایش محصولات این دسته‌بندی به عنوان گزینه‌های انتخابی نمایش داده می‌شوند
            </div>
          </>
        )}

        {/* ── Footer ── */}
        <div style={{ borderTop: "1.5px solid #eef0f4", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ height: 42, padding: "0 22px", background: saving ? "#5a9e75" : "#27ae60", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "Vazirmatn, sans-serif", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              {saving
                ? <><i className="ti ti-loader-2" style={{ fontSize: 16 }} /> ذخیره...</>
                : <><i className="ti ti-device-floppy" style={{ fontSize: 16 }} /> ذخیره سایزبندی</>
              }
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: 13.5, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", padding: "0 4px" }}>انصراف</button>
          </div>
          <div style={{ fontSize: 11.5, color: "#bbb", textAlign: "left", lineHeight: 1.6 }}>
            در فرم محصول<br />قابل انتخاب می‌شود
          </div>
        </div>
      </div>
    </div>
  );
}
