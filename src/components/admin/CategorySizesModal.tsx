"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminBtn, AdminToast, useAdminToast } from "./AdminUI";

interface SizePreset {
  label: string;
  unit: "INCH" | "MM" | "METER" | "PIECE";
}

interface Props {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
}

const UNIT_LABELS: Record<string, string> = {
  INCH: "اینچ",
  MM: "میلیمتر",
  METER: "متر",
  PIECE: "عدد",
};

const UNIT_COLORS: Record<string, string> = {
  INCH: "#1d4ed8",
  MM: "#7c3aed",
  METER: "#059669",
  PIECE: "#d97706",
};

const INP: React.CSSProperties = {
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "8px 12px", fontFamily: "Vazirmatn", fontSize: 13,
  color: "var(--text)", outline: "none", background: "#fff",
  boxSizing: "border-box", width: "100%",
};

const SEL: React.CSSProperties = {
  ...{} as React.CSSProperties,
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "8px 10px", fontFamily: "Vazirmatn", fontSize: 12,
  color: "var(--text)", background: "#fff", cursor: "pointer", outline: "none",
};

export default function CategorySizesModal({ categoryId, categoryName, onClose }: Props) {
  const { toast, showToast } = useAdminToast();
  const [sizes, setSizes] = useState<SizePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUnit, setNewUnit] = useState<"INCH" | "MM" | "METER" | "PIECE">("INCH");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/categories/${categoryId}/sizes`)
      .then((r) => r.json())
      .then((d) => setSizes(d.sizes ?? []))
      .catch(() => showToast("error", "خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, [categoryId, showToast]);

  useEffect(() => { load(); }, [load]);

  const addSize = () => {
    const label = newLabel.trim();
    if (!label) return;
    if (sizes.some((s) => s.label === label && s.unit === newUnit)) {
      showToast("error", "این سایز قبلاً اضافه شده");
      return;
    }
    setSizes((p) => [...p, { label, unit: newUnit }]);
    setNewLabel("");
  };

  const removeSize = (index: number) =>
    setSizes((p) => p.filter((_, i) => i !== index));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}/sizes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sizes }),
      });
      if (!res.ok) { showToast("error", "خطا در ذخیره"); return; }
      showToast("success", "سایزها ذخیره شدند");
    } catch { showToast("error", "خطای سرور"); }
    finally { setSaving(false); }
  };

  const applyToAll = async () => {
    if (sizes.length === 0) { showToast("error", "ابتدا سایزهایی اضافه کنید"); return; }
    if (!confirm(
      `آیا می‌خواهید این ${sizes.length} سایز را روی تمام محصولات دسته «${categoryName}» اعمال کنید؟\n\nسایزهای قبلی محصولات جایگزین می‌شوند.`
    )) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}/apply-sizes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sizes }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا"); return; }
      showToast("success", data.updated > 0 ? `${data.updated} محصول بروزرسانی شد` : "محصولی در این دسته یافت نشد");
    } catch { showToast("error", "خطای سرور"); }
    finally { setApplying(false); }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 580,
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,.22)", overflow: "hidden",
      }}>
        {/* ── Header ── */}
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(135deg, rgba(10,42,94,0.04) 0%, #fff 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(10,42,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-ruler-measure" style={{ fontSize: 18, color: "var(--primary)" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)" }}>سایزبندی دسته‌بندی</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{categoryName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 18, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
          <AdminToast toast={toast} />

          {/* Add row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
              placeholder="برچسب سایز — مثلاً: ۱/۲ اینچ"
              style={{ ...INP, flex: 1 }}
            />
            <select
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value as "INCH" | "MM" | "METER" | "PIECE")}
              style={{ ...SEL, flexShrink: 0 }}
            >
              <option value="INCH">اینچ</option>
              <option value="MM">میلیمتر</option>
              <option value="METER">متر</option>
              <option value="PIECE">عدد</option>
            </select>
            <AdminBtn icon="ti-plus" variant="primary" onClick={addSize}>افزودن</AdminBtn>
          </div>

          {/* Size chips */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)" }}>
              <i className="ti ti-loader-2" style={{ fontSize: 28 }} />
            </div>
          ) : sizes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)", fontSize: 13 }}>
              <i className="ti ti-ruler" style={{ fontSize: 32, display: "block", marginBottom: 8, opacity: 0.4 }} />
              هیچ سایزی تعریف نشده — از فرم بالا سایز اضافه کنید
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {sizes.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "#f8f9fb", border: "1.5px solid var(--border)",
                    borderRadius: 8, padding: "5px 8px 5px 5px",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{s.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 900, padding: "1px 6px", borderRadius: 10,
                    background: `${UNIT_COLORS[s.unit]}18`, color: UNIT_COLORS[s.unit],
                    border: `1px solid ${UNIT_COLORS[s.unit]}40`,
                  }}>
                    {UNIT_LABELS[s.unit]}
                  </span>
                  <button
                    onClick={() => removeSize(i)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#c0392b", padding: 2, display: "flex", alignItems: "center", borderRadius: 4 }}
                  >
                    <i className="ti ti-x" style={{ fontSize: 11 }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Info note */}
          {sizes.length > 0 && (
            <div style={{ marginTop: 20, padding: "10px 14px", background: "rgba(10,42,94,0.04)", borderRadius: 8, border: "1px solid rgba(10,42,94,0.1)", fontSize: 11, color: "var(--text3)", lineHeight: 1.7 }}>
              <i className="ti ti-info-circle" style={{ fontSize: 12, marginLeft: 4 }} />
              ذخیره فقط قالب‌های سایز را ثبت می‌کند.
              برای اعمال روی محصولات موجود، از دکمه <strong>«اعمال روی همه محصولات»</strong> استفاده کنید.
              سایزهای قبلی محصولات جایگزین خواهند شد.
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center",
          background: "var(--bg)",
        }}>
          <AdminBtn
            icon={applying ? "ti-loader" : "ti-wand"}
            variant="secondary"
            loading={applying}
            onClick={applyToAll}
            disabled={sizes.length === 0}
          >
            اعمال روی همه محصولات
          </AdminBtn>
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn variant="ghost" onClick={onClose}>انصراف</AdminBtn>
            <AdminBtn icon="ti-device-floppy" variant="primary" loading={saving} onClick={save}>
              ذخیره سایزها
            </AdminBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
