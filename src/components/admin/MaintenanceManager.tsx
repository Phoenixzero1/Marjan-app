"use client";

import { useState, useEffect } from "react";

interface MaintenanceState {
  enabled: boolean;
  message: string;
  estimated: string;
}

type Toast = { msg: string; ok: boolean };

export default function MaintenanceManager() {
  const [data, setData] = useState<MaintenanceState>({ enabled: false, message: "", estimated: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch("/api/admin/maintenance")
      .then((r) => r.json())
      .then((d) => {
        setData({ enabled: d.enabled ?? false, message: d.message ?? "", estimated: d.estimated ?? "" });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) { showToast(result.error ?? "خطا در ذخیره", false); return; }
      showToast(data.enabled ? "حالت تعمیرات فعال شد" : "حالت تعمیرات غیرفعال شد");
    } catch {
      showToast("خطای سرور", false);
    } finally {
      setSaving(false);
    }
  }

  async function toggle() {
    const newEnabled = !data.enabled;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, enabled: newEnabled }),
      });
      if (!res.ok) throw new Error();
      setData((prev) => ({ ...prev, enabled: newEnabled }));
      showToast(newEnabled ? "حالت تعمیرات فعال شد ⚠️" : "سایت در دسترس است ✅");
    } catch {
      showToast("خطا در تغییر وضعیت", false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ textAlign: "center", padding: "4rem", color: "var(--text3)" }}>
      <i className="ti ti-loader-2" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />در حال بارگذاری...
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
          {toast.msg}
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>حالت تعمیرات</h2>
        <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>فقط مدیر ارشد می‌تواند حالت تعمیرات را فعال کند. در این حالت کاربران عادی به صفحه تعمیرات هدایت می‌شوند.</p>
      </div>

      {/* Status banner */}
      <div style={{
        background: data.enabled ? "#fef3c7" : "#dcfce7",
        border: `2px solid ${data.enabled ? "#fcd34d" : "#86efac"}`,
        borderRadius: "var(--radius)",
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: data.enabled ? "#fef3c7" : "#dcfce7",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, flexShrink: 0,
          }}>
            {data.enabled ? "🔧" : "✅"}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: "var(--primary)" }}>
              {data.enabled ? "سایت در حالت تعمیرات است" : "سایت در دسترس است"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
              {data.enabled ? "کاربران عادی به صفحه تعمیرات هدایت می‌شوند" : "همه کاربران می‌توانند به سایت دسترسی داشته باشند"}
            </div>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          style={{
            background: data.enabled ? "#16a34a" : "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "10px 20px",
            fontFamily: "Vazirmatn",
            fontSize: 13,
            fontWeight: 900,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? .7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {saving ? "..." : data.enabled ? "غیرفعال کردن" : "فعال کردن تعمیرات"}
        </button>
      </div>

      {/* Message settings */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem" }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", margin: "0 0 1.25rem" }}>تنظیمات پیام تعمیرات</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 6 }}>
              پیام برای کاربران
            </label>
            <textarea
              value={data.message}
              onChange={(e) => setData((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="در حال به‌روزرسانی هستیم. به زودی برمی‌گردیم."
              rows={3}
              style={{
                width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
                padding: "10px 12px", fontFamily: "Vazirmatn", fontSize: 13, resize: "vertical",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 6 }}>
              زمان تخمینی بازگشت (اختیاری)
            </label>
            <input
              type="text"
              value={data.estimated}
              onChange={(e) => setData((prev) => ({ ...prev, estimated: e.target.value }))}
              placeholder="مثال: ۱۴۰۴/۰۳/۱۵ ساعت ۱۲:۰۰"
              style={{
                width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
                padding: "10px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              alignSelf: "flex-start",
              background: "var(--primary)", color: "#fff", border: "none",
              borderRadius: "var(--radius-sm)", padding: "10px 24px",
              fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900,
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .7 : 1,
            }}
          >
            {saving ? "در حال ذخیره..." : "ذخیره پیام"}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem" }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", margin: "0 0 1rem" }}>پیش‌نمایش صفحه تعمیرات</h3>
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
          <div style={{
            background: "linear-gradient(135deg, #0f2040 0%, #1a3a6e 100%)",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "Vazirmatn",
            direction: "rtl",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔧</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Marjan<span style={{ color: "#ffc107" }}>.</span></div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.85)", marginBottom: 12 }}>سایت در حال به‌روزرسانی است</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.65)", margin: "0 0 12px", lineHeight: 1.8 }}>
              {data.message || "در حال به‌روزرسانی هستیم. به زودی برمی‌گردیم."}
            </p>
            {data.estimated && (
              <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 8, padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,.75)", fontSize: 12 }}>
                ⏰ زمان تخمینی: {data.estimated}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
