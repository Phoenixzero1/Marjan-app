"use client";

import { useState, useEffect } from "react";
import {
  AdminPageHeader, AdminBtn, AdminCard, AdminCardHeader, AdminField, AdminInput, AdminTextarea,
  AdminEmptyState, AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

interface MaintenanceState { enabled: boolean; message: string; estimated: string; }

export default function MaintenanceManager() {
  const { toast, showToast } = useAdminToast();
  const [data, setData] = useState<MaintenanceState>({ enabled: false, message: "", estimated: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/maintenance").then(r => r.json()).then(d => { setData({ enabled: d.enabled ?? false, message: d.message ?? "", estimated: d.estimated ?? "" }); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!res.ok) { showToast("error", result.error ?? "خطا در ذخیره"); return; }
      showToast("success", data.enabled ? "حالت تعمیرات فعال شد" : "حالت تعمیرات غیرفعال شد");
    } catch { showToast("error", "خطای سرور"); }
    finally { setSaving(false); }
  }

  async function toggleEnabled() {
    const newEnabled = !data.enabled;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, enabled: newEnabled }) });
      if (!res.ok) throw new Error();
      setData(prev => ({ ...prev, enabled: newEnabled }));
      showToast("success", newEnabled ? "حالت تعمیرات فعال شد" : "سایت در دسترس است");
    } catch { showToast("error", "خطا در تغییر وضعیت"); }
    finally { setSaving(false); }
  }

  if (loading) return <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <AdminToast toast={toast} />

      <AdminPageHeader title="حالت تعمیرات" icon="ti-tools"
        subtitle="فقط مدیر ارشد می‌تواند حالت تعمیرات را فعال کند. در این حالت کاربران عادی به صفحه تعمیرات هدایت می‌شوند."
      />

      {/* Status banner */}
      <div style={{ background: data.enabled ? "#fef3c7" : "#dcfce7", border: `2px solid ${data.enabled ? "#fcd34d" : "#86efac"}`, borderRadius: 10, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
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
        <AdminBtn
          variant={data.enabled ? "primary" : "danger"}
          icon={data.enabled ? "ti-circle-check" : "ti-tools"}
          loading={saving}
          onClick={toggleEnabled}
        >
          {data.enabled ? "غیرفعال کردن" : "فعال کردن تعمیرات"}
        </AdminBtn>
      </div>

      {/* Message settings */}
      <AdminCard>
        <AdminCardHeader title="تنظیمات پیام تعمیرات" icon="ti-message" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
          <AdminField label="پیام برای کاربران">
            <AdminTextarea value={data.message} onChange={v => setData(prev => ({ ...prev, message: v }))} placeholder="در حال به‌روزرسانی هستیم. به زودی برمی‌گردیم." rows={3} />
          </AdminField>
          <AdminField label="زمان تخمینی بازگشت (اختیاری)">
            <AdminInput value={data.estimated} onChange={v => setData(prev => ({ ...prev, estimated: v }))} placeholder="مثال: ۱۴۰۴/۰۳/۱۵ ساعت ۱۲:۰۰" />
          </AdminField>
          <AdminBtn variant="primary" icon="ti-device-floppy" loading={saving} onClick={handleSave} style={{ alignSelf: "flex-start" }}>
            {saving ? "در حال ذخیره..." : "ذخیره پیام"}
          </AdminBtn>
        </div>
      </AdminCard>

      {/* Preview */}
      <AdminCard>
        <AdminCardHeader title="پیش‌نمایش صفحه تعمیرات" icon="ti-eye" />
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", marginTop: 14 }}>
          <div style={{ background: "linear-gradient(135deg, #0f2040 0%, #1a3a6e 100%)", padding: "2rem", textAlign: "center", fontFamily: "Vazirmatn", direction: "rtl" }}>
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
      </AdminCard>
    </div>
  );
}
