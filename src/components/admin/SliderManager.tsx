"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminBtn, AdminBadge, AdminEmptyState, AdminDrawer,
  AdminField, AdminInput, AdminTextarea, AdminToggle, AdminDivider, AdminCard, AdminCardHeader,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";
import ImageUploader from "@/components/admin/ImageUploader";

interface Slide {
  id: string; title: string | null; subtitle: string | null; imageUrl: string | null;
  buttonText: string | null; buttonLink: string | null; isActive: boolean;
  isDefault: boolean; startDate: string | null; endDate: string | null; sortOrder: number;
}

interface SliderSettings { autoPlay: boolean; interval: number; showArrows: boolean; showDots: boolean; }

const EMPTY_FORM = { title: "", subtitle: "", imageUrl: "", buttonText: "", buttonLink: "", isActive: true, startDate: "", endDate: "" };

export default function SliderManager() {
  const { toast, showToast } = useAdminToast();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [settings, setSettings] = useState<SliderSettings>({ autoPlay: true, interval: 5000, showArrows: true, showDots: true });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [slidesRes, settingsRes] = await Promise.all([fetch("/api/admin/slider").then(r => r.text()), fetch("/api/admin/slider/settings").then(r => r.text())]);
      try { const d = JSON.parse(slidesRes); if (d.slides) setSlides(d.slides); } catch { /* ignore */ }
      try { const d = JSON.parse(settingsRes); if (typeof d.autoPlay === "boolean") setSettings(d); } catch { /* ignore */ }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (s: Slide) => { setEditingId(s.id); setForm({ title: s.title ?? "", subtitle: s.subtitle ?? "", imageUrl: s.imageUrl ?? "", buttonText: s.buttonText ?? "", buttonLink: s.buttonLink ?? "", isActive: s.isActive, startDate: s.startDate ? s.startDate.slice(0, 10) : "", endDate: s.endDate ? s.endDate.slice(0, 10) : "" }); setShowForm(true); };

  const handleSaveSlide = async () => {
    if (!form.title.trim()) { showToast("error", "عنوان اسلاید الزامی است"); return; }
    setSaving(true);
    try {
      const payload = { title: form.title, subtitle: form.subtitle || null, imageUrl: form.imageUrl || null, buttonText: form.buttonText || null, buttonLink: form.buttonLink || null, isActive: form.isActive, startDate: form.startDate || null, endDate: form.endDate || null };
      const res = editingId
        ? await fetch(`/api/admin/slider/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/admin/slider", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { showToast("error", "خطا در ذخیره اسلاید"); return; }
      showToast("success", editingId ? "اسلاید ویرایش شد" : "اسلاید اضافه شد"); setShowForm(false); setEditingId(null); load();
    } catch { showToast("error", "خطای شبکه"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این اسلاید مطمئن هستید؟")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/slider/${id}`, { method: "DELETE" });
      if (!res.ok) { showToast("error", "خطا در حذف"); return; }
      setSlides(prev => prev.filter(s => s.id !== id)); showToast("success", "اسلاید حذف شد");
    } catch { showToast("error", "خطای شبکه"); }
    finally { setDeletingId(null); }
  };

  const handleToggleActive = async (slide: Slide) => {
    await fetch(`/api/admin/slider/${slide.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !slide.isActive }) }).catch(() => null);
    setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, isActive: !s.isActive } : s));
  };

  const handleMove = async (index: number, dir: 1 | -1) => {
    const swapIdx = index + dir;
    if (swapIdx < 0 || swapIdx >= slides.length) return;
    const newSlides = [...slides]; [newSlides[index], newSlides[swapIdx]] = [newSlides[swapIdx], newSlides[index]];
    const reordered = newSlides.map((s, i) => ({ ...s, sortOrder: i + 1 })); setSlides(reordered);
    await fetch("/api/admin/slider", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: reordered.map(({ id, sortOrder }) => ({ id, sortOrder })) }) });
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/slider/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      if (!res.ok) { showToast("error", "خطا در ذخیره تنظیمات"); return; }
      showToast("success", "تنظیمات اسلایدر ذخیره شد");
    } catch { showToast("error", "خطای شبکه"); }
    finally { setSavingSettings(false); }
  };

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="مدیریت اسلایدر" icon="ti-slideshow" count={slides.length}
        subtitle={`${slides.filter(s => s.isActive).length} اسلاید فعال`}
        actions={<AdminBtn icon="ti-plus" variant="primary" onClick={openAdd}>اسلاید جدید</AdminBtn>}
      />

      {/* Settings card */}
      <AdminCard style={{ marginBottom: 16 }}>
        <AdminCardHeader title="تنظیمات اسلایدر" icon="ti-settings" />
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
          <AdminToggle checked={settings.autoPlay} onChange={v => setSettings(s => ({ ...s, autoPlay: v }))} label="پخش خودکار" />
          <AdminToggle checked={settings.showArrows} onChange={v => setSettings(s => ({ ...s, showArrows: v }))} label="نمایش فلش‌ها" />
          <AdminToggle checked={settings.showDots} onChange={v => setSettings(s => ({ ...s, showDots: v }))} label="نمایش نقطه‌ها" />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)" }}>فاصله:</span>
            <select value={settings.interval} onChange={e => setSettings(s => ({ ...s, interval: parseInt(e.target.value) }))} style={{ border: "1.5px solid var(--border)", borderRadius: 7, padding: "6px 10px", fontFamily: "Vazirmatn", fontSize: 13 }}>
              {[3000, 4000, 5000, 6000, 8000, 10000].map(v => <option key={v} value={v}>{v / 1000} ثانیه</option>)}
            </select>
          </div>
          <AdminBtn icon="ti-device-floppy" loading={savingSettings} onClick={handleSaveSettings}>ذخیره تنظیمات</AdminBtn>
        </div>
      </AdminCard>

      {/* Slides list */}
      {loading && <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />}
      {!loading && slides.length === 0 && <AdminEmptyState icon="ti-slideshow" title="هنوز اسلایدی اضافه نشده" subtitle="اولین اسلاید را اضافه کنید" />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {slides.map((slide, index) => (
          <div key={slide.id} style={{ background: "#fff", borderRadius: 10, border: "1.5px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, opacity: slide.isActive ? 1 : 0.6 }}>
            <div style={{ width: 80, height: 50, borderRadius: 6, flexShrink: 0, background: slide.imageUrl ? `url(${slide.imageUrl}) center/cover no-repeat` : "linear-gradient(135deg,var(--primary),#1a5fa0)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!slide.imageUrl && <i className="ti ti-photo" style={{ fontSize: 20, color: "rgba(255,255,255,.4)" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 13 }}>{slide.title || <span style={{ color: "var(--text3)" }}>بدون عنوان</span>}</div>
              {slide.subtitle && <div style={{ fontSize: 11, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{slide.subtitle}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <AdminBadge variant={slide.isActive ? "success" : "neutral"} size="xs">{slide.isActive ? "فعال" : "غیرفعال"}</AdminBadge>
                {slide.isDefault && <AdminBadge variant="warning" size="xs">پیش‌فرض</AdminBadge>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <AdminBtn size="sm" icon="ti-arrow-up" disabled={index === 0} onClick={() => handleMove(index, -1)} />
              <AdminBtn size="sm" icon="ti-arrow-down" disabled={index === slides.length - 1} onClick={() => handleMove(index, 1)} />
            </div>
            <AdminToggle checked={slide.isActive} onChange={() => handleToggleActive(slide)} label="" />
            <AdminBtn size="sm" icon="ti-edit" onClick={() => openEdit(slide)}>ویرایش</AdminBtn>
            {slide.isDefault
              ? <AdminBtn size="sm" icon="ti-lock" disabled title="اسلاید پیش‌فرض قابل حذف نیست" />
              : <AdminBtn size="sm" icon="ti-trash" variant="danger" loading={deletingId === slide.id} onClick={() => handleDelete(slide.id)} />
            }
          </div>
        ))}
      </div>

      <AdminDrawer open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? "ویرایش اسلاید" : "اسلاید جدید"} width={540}>
        <AdminField label="تصویر اسلاید">
          <ImageUploader value={form.imageUrl} onChange={v => setForm(f => ({ ...f, imageUrl: v }))} folder="slider" previewHeight={100} />
        </AdminField>
        <AdminField label="عنوان اسلاید" required>
          <AdminInput value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="بهترین تجهیزات ساختمانی" />
        </AdminField>
        <AdminField label="زیرعنوان (اختیاری)">
          <AdminTextarea value={form.subtitle} onChange={v => setForm(f => ({ ...f, subtitle: v }))} rows={2} placeholder="توضیحی کوتاه درباره این اسلاید..." />
        </AdminField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <AdminField label="متن دکمه (اختیاری)">
            <AdminInput value={form.buttonText} onChange={v => setForm(f => ({ ...f, buttonText: v }))} placeholder="مشاهده محصولات" />
          </AdminField>
          <AdminField label="لینک دکمه (اختیاری)">
            <AdminInput value={form.buttonLink} onChange={v => setForm(f => ({ ...f, buttonLink: v }))} placeholder="/products" style={{ direction: "ltr" }} />
          </AdminField>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <AdminField label="تاریخ شروع (اختیاری)">
            <AdminInput type="date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} style={{ direction: "ltr" }} />
          </AdminField>
          <AdminField label="تاریخ پایان (اختیاری)">
            <AdminInput type="date" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} style={{ direction: "ltr" }} />
          </AdminField>
        </div>
        <AdminField label="وضعیت">
          <AdminToggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} label={form.isActive ? "فعال (نمایش داده می‌شود)" : "غیرفعال (پنهان است)"} />
        </AdminField>
        <AdminDivider />
        <div style={{ display: "flex", gap: 8 }}>
          <AdminBtn variant="primary" icon="ti-device-floppy" loading={saving} onClick={handleSaveSlide} style={{ flex: 1, justifyContent: "center" }}>
            {saving ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "افزودن اسلاید"}
          </AdminBtn>
          <AdminBtn variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>انصراف</AdminBtn>
        </div>
      </AdminDrawer>
    </div>
  );
}
