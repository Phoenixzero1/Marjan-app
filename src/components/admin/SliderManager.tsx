"use client";

import { useState, useEffect, useCallback } from "react";
import DatePicker from "@/components/ui/DatePicker";

interface Slide {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  isActive: boolean;
  isDefault: boolean;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
}

interface SliderSettings {
  autoPlay: boolean;
  interval: number;
  showArrows: boolean;
  showDots: boolean;
}

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  imageUrl: "",
  buttonText: "",
  buttonLink: "",
  isActive: true,
  startDate: "",
  endDate: "",
};

export default function SliderManager() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [settings, setSettings] = useState<SliderSettings>({ autoPlay: true, interval: 5000, showArrows: true, showDots: true });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [slidesRes, settingsRes] = await Promise.all([
        fetch("/api/admin/slider").then((r) => r.text()),
        fetch("/api/admin/slider/settings").then((r) => r.text()),
      ]);
      try { const d = JSON.parse(slidesRes); if (d.slides) setSlides(d.slides); } catch { /* ignore */ }
      try { const d = JSON.parse(settingsRes); if (typeof d.autoPlay === "boolean") setSettings(d); } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (slide: Slide) => {
    setEditingId(slide.id);
    setForm({
      title: slide.title ?? "",
      subtitle: slide.subtitle ?? "",
      imageUrl: slide.imageUrl ?? "",
      buttonText: slide.buttonText ?? "",
      buttonLink: slide.buttonLink ?? "",
      isActive: slide.isActive,
      startDate: slide.startDate ? slide.startDate.slice(0, 10) : "",
      endDate: slide.endDate ? slide.endDate.slice(0, 10) : "",
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSaveSlide = async () => {
    if (!form.title.trim()) { showToast("error", "عنوان اسلاید الزامی است"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle || null,
        imageUrl: form.imageUrl || null,
        buttonText: form.buttonText || null,
        buttonLink: form.buttonLink || null,
        isActive: form.isActive,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      const res = editingId
        ? await fetch(`/api/admin/slider/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/admin/slider", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      if (!res.ok) { showToast("error", "خطا در ذخیره اسلاید"); return; }
      showToast("success", editingId ? "اسلاید ویرایش شد" : "اسلاید اضافه شد");
      closeForm();
      load();
    } catch {
      showToast("error", "خطای شبکه");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این اسلاید مطمئن هستید؟")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/slider/${id}`, { method: "DELETE" });
      if (!res.ok) { showToast("error", "خطا در حذف"); return; }
      setSlides((prev) => prev.filter((s) => s.id !== id));
      showToast("success", "اسلاید حذف شد");
    } catch {
      showToast("error", "خطای شبکه");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (slide: Slide) => {
    try {
      await fetch(`/api/admin/slider/${slide.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !slide.isActive }),
      });
      setSlides((prev) => prev.map((s) => s.id === slide.id ? { ...s, isActive: !s.isActive } : s));
    } catch { /* ignore */ }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newSlides = [...slides];
    [newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]];
    const reordered = newSlides.map((s, i) => ({ ...s, sortOrder: i + 1 }));
    setSlides(reordered);
    await fetch("/api/admin/slider", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map(({ id, sortOrder }) => ({ id, sortOrder })) }),
    });
  };

  const handleMoveDown = async (index: number) => {
    if (index === slides.length - 1) return;
    const newSlides = [...slides];
    [newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]];
    const reordered = newSlides.map((s, i) => ({ ...s, sortOrder: i + 1 }));
    setSlides(reordered);
    await fetch("/api/admin/slider", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map(({ id, sortOrder }) => ({ id, sortOrder })) }),
    });
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/slider/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) { showToast("error", "خطا در ذخیره تنظیمات"); return; }
      showToast("success", "تنظیمات اسلایدر ذخیره شد");
    } catch {
      showToast("error", "خطای شبکه");
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "4rem", color: "var(--text3)" }}>در حال بارگذاری...</div>;
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? "#1a7a4a" : "#c0392b",
          color: "#fff", padding: "12px 28px", borderRadius: 10,
          fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700,
          zIndex: 9999, boxShadow: "0 6px 24px rgba(0,0,0,.25)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <i className={`ti ${toast.type === "success" ? "ti-circle-check" : "ti-circle-x"}`} style={{ fontSize: 18 }} />
          {toast.msg}
        </div>
      )}

      {/* Slider Settings Card */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-settings" style={{ color: "var(--accent)" }} />
          تنظیمات اسلایدر
        </div>

        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
          {/* Auto-play toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div
              onClick={() => setSettings((s) => ({ ...s, autoPlay: !s.autoPlay }))}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: settings.autoPlay ? "var(--accent)" : "var(--border)",
                position: "relative", cursor: "pointer", transition: "background .2s",
              }}
            >
              <div style={{
                position: "absolute", top: 2,
                left: settings.autoPlay ? 22 : 2,
                width: 20, height: 20,
                borderRadius: "50%", background: "#fff",
                transition: "left .2s",
                boxShadow: "0 1px 4px rgba(0,0,0,.2)",
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>پخش خودکار</span>
          </label>

          {/* Show arrows toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div
              onClick={() => setSettings((s) => ({ ...s, showArrows: !s.showArrows }))}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: settings.showArrows ? "var(--accent)" : "var(--border)",
                position: "relative", cursor: "pointer", transition: "background .2s",
              }}
            >
              <div style={{
                position: "absolute", top: 2,
                left: settings.showArrows ? 22 : 2,
                width: 20, height: 20,
                borderRadius: "50%", background: "#fff",
                transition: "left .2s",
                boxShadow: "0 1px 4px rgba(0,0,0,.2)",
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>نمایش فلش‌ها</span>
          </label>

          {/* Show dots toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div
              onClick={() => setSettings((s) => ({ ...s, showDots: !s.showDots }))}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: settings.showDots ? "var(--accent)" : "var(--border)",
                position: "relative", cursor: "pointer", transition: "background .2s",
              }}
            >
              <div style={{
                position: "absolute", top: 2,
                left: settings.showDots ? 22 : 2,
                width: 20, height: 20,
                borderRadius: "50%", background: "#fff",
                transition: "left .2s",
                boxShadow: "0 1px 4px rgba(0,0,0,.2)",
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>نمایش نقطه‌ها</span>
          </label>

          {/* Interval */}
          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>فاصله تناوب:</span>
            <select
              value={settings.interval}
              onChange={(e) => setSettings((s) => ({ ...s, interval: parseInt(e.target.value) }))}
              style={{ border: "1.5px solid var(--border)", borderRadius: 6, padding: "5px 10px", fontFamily: "Vazirmatn", fontSize: 13 }}
            >
              {[3000, 4000, 5000, 6000, 8000, 10000].map((v) => (
                <option key={v} value={v}>{v / 1000} ثانیه</option>
              ))}
            </select>
          </label>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          style={{
            background: "var(--primary)", color: "#fff", border: "none",
            borderRadius: "var(--radius-sm)", padding: "9px 20px",
            fontSize: 13, fontWeight: 700, cursor: savingSettings ? "not-allowed" : "pointer",
            opacity: savingSettings ? 0.7 : 1, fontFamily: "Vazirmatn",
          }}
        >
          {savingSettings ? "در حال ذخیره..." : "ذخیره تنظیمات"}
        </button>
      </div>

      {/* Slides List */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden", marginBottom: "1.5rem" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-slideshow" style={{ color: "var(--accent)" }} />
            اسلایدها ({slides.length})
          </div>
          <button
            onClick={openAdd}
            style={{
              background: "var(--accent)", color: "#fff", border: "none",
              borderRadius: "var(--radius-sm)", padding: "8px 16px",
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <i className="ti ti-plus" /> اسلاید جدید
          </button>
        </div>

        {slides.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>
            <i className="ti ti-slideshow" style={{ fontSize: 48, display: "block", marginBottom: 12 }} />
            <p style={{ fontWeight: 700 }}>هنوز اسلایدی اضافه نشده است</p>
            <button onClick={openAdd} style={{ marginTop: 12, background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn" }}>
              افزودن اولین اسلاید
            </button>
          </div>
        ) : (
          <div>
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 1.5rem",
                  borderBottom: index < slides.length - 1 ? "1px solid var(--border)" : "none",
                  background: "#fff",
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 80, height: 50, borderRadius: 6, flexShrink: 0,
                  background: slide.imageUrl
                    ? `url(${slide.imageUrl}) center/cover no-repeat`
                    : "linear-gradient(135deg,var(--primary-dark),#1a5fa0)",
                  border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {!slide.imageUrl && <i className="ti ti-photo" style={{ fontSize: 20, color: "rgba(255,255,255,.4)" }} />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 14, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {slide.title || <span style={{ color: "var(--text3)" }}>بدون عنوان</span>}
                  </div>
                  {slide.subtitle && (
                    <div style={{ fontSize: 12, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {slide.subtitle}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    {slide.buttonText && (
                      <span style={{ fontSize: 11, color: "var(--text3)", display: "flex", alignItems: "center", gap: 3 }}>
                        <i className="ti ti-link" /> {slide.buttonText}
                      </span>
                    )}
                    {(slide.startDate || slide.endDate) && (
                      <span style={{ fontSize: 11, color: "var(--text3)", display: "flex", alignItems: "center", gap: 3 }}>
                        <i className="ti ti-calendar" />
                        {slide.startDate && slide.startDate.slice(0, 10)}
                        {slide.startDate && slide.endDate && " — "}
                        {slide.endDate && slide.endDate.slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Active toggle */}
                <div
                  onClick={() => handleToggleActive(slide)}
                  style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: slide.isActive ? "#1a7a4a" : "var(--border)",
                    position: "relative", cursor: "pointer", transition: "background .2s",
                    flexShrink: 0,
                  }}
                  title={slide.isActive ? "فعال" : "غیرفعال"}
                >
                  <div style={{
                    position: "absolute", top: 2,
                    left: slide.isActive ? 20 : 2,
                    width: 18, height: 18,
                    borderRadius: "50%", background: "#fff",
                    transition: "left .2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                  }} />
                </div>

                {/* Order buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 7px", cursor: index === 0 ? "not-allowed" : "pointer", opacity: index === 0 ? 0.4 : 1, fontSize: 11 }}
                    title="جابه‌جایی به بالا"
                  >
                    <i className="ti ti-arrow-up" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === slides.length - 1}
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 7px", cursor: index === slides.length - 1 ? "not-allowed" : "pointer", opacity: index === slides.length - 1 ? 0.4 : 1, fontSize: 11 }}
                    title="جابه‌جایی به پایین"
                  >
                    <i className="ti ti-arrow-down" />
                  </button>
                </div>

                {/* Edit / Delete */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                  {slide.isDefault && (
                    <span title="اسلاید پیش‌فرض — قابل حذف نیست" style={{ fontSize: 11, fontWeight: 700, color: "#b45309", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, padding: "4px 8px", display: "flex", alignItems: "center", gap: 3 }}>
                      <i className="ti ti-star-filled" /> پیش‌فرض
                    </span>
                  )}
                  <button
                    onClick={() => openEdit(slide)}
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "var(--text2)", fontFamily: "Vazirmatn", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <i className="ti ti-edit" /> ویرایش
                  </button>
                  {slide.isDefault ? (
                    <span title="اسلاید پیش‌فرض قابل حذف نیست" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px", fontSize: 12, color: "var(--text3)", fontFamily: "Vazirmatn", display: "flex", alignItems: "center", gap: 4, cursor: "not-allowed" }}>
                      <i className="ti ti-lock" /> قفل
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDelete(slide.id)}
                      disabled={deletingId === slide.id}
                      style={{ background: "#fdecea", border: "1px solid #f5c6cb", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#c0392b", fontFamily: "Vazirmatn", display: "flex", alignItems: "center", gap: 4, opacity: deletingId === slide.id ? 0.6 : 1 }}
                    >
                      <i className="ti ti-trash" /> {deletingId === slide.id ? "..." : "حذف"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form Panel */}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)" }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)" }}>
              {editingId ? "ویرایش اسلاید" : "افزودن اسلاید جدید"}
            </div>
            <button onClick={closeForm} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text3)" }}>
              <i className="ti ti-x" />
            </button>
          </div>

          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Image URL */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>
                آدرس تصویر (URL)
              </label>
              {form.imageUrl && (
                <div style={{
                  width: "100%", height: 120, borderRadius: 8, marginBottom: 8,
                  background: `url(${form.imageUrl}) center/cover no-repeat`,
                  border: "1px solid var(--border)",
                }} />
              )}
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg — یا از کتابخانه رسانه URL کپی کنید"
                style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 6, padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13 }}
              />
            </div>

            {/* Title */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>
                عنوان اسلاید <span style={{ color: "#c0392b" }}>*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="مثال: بهترین تجهیزات ساختمانی"
                style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 6, padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13 }}
              />
            </div>

            {/* Subtitle */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>زیرعنوان (اختیاری)</label>
              <textarea
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="توضیحی کوتاه درباره این اسلاید..."
                rows={2}
                style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 6, padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, resize: "vertical" }}
              />
            </div>

            {/* Button text + link */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>متن دکمه (اختیاری)</label>
                <input
                  value={form.buttonText}
                  onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
                  placeholder="مثال: مشاهده محصولات"
                  style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 6, padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>لینک دکمه (اختیاری)</label>
                <input
                  value={form.buttonLink}
                  onChange={(e) => setForm((f) => ({ ...f, buttonLink: e.target.value }))}
                  placeholder="/products یا URL کامل"
                  style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 6, padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, direction: "ltr" }}
                />
              </div>
            </div>

            {/* Scheduling */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>
                  <i className="ti ti-calendar" /> تاریخ شروع (اختیاری)
                </label>
                <DatePicker
                  value={form.startDate}
                  onChange={(val) => setForm((f) => ({ ...f, startDate: val }))}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>
                  <i className="ti ti-calendar" /> تاریخ پایان (اختیاری)
                </label>
                <DatePicker
                  value={form.endDate}
                  onChange={(val) => setForm((f) => ({ ...f, endDate: val }))}
                />
              </div>
            </div>

            {/* Active toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: form.isActive ? "var(--accent)" : "var(--border)",
                  position: "relative", cursor: "pointer", transition: "background .2s",
                }}
              >
                <div style={{
                  position: "absolute", top: 2,
                  left: form.isActive ? 22 : 2,
                  width: 20, height: 20,
                  borderRadius: "50%", background: "#fff",
                  transition: "left .2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {form.isActive ? "فعال (نمایش داده می‌شود)" : "غیرفعال (پنهان است)"}
              </span>
            </label>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
              <button
                onClick={handleSaveSlide}
                disabled={saving}
                style={{
                  background: "var(--accent)", color: "#fff", border: "none",
                  borderRadius: "var(--radius-sm)", padding: "10px 24px",
                  fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1, fontFamily: "Vazirmatn",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <i className="ti ti-device-floppy" />
                {saving ? "در حال ذخیره..." : (editingId ? "ذخیره تغییرات" : "افزودن اسلاید")}
              </button>
              <button
                onClick={closeForm}
                style={{ background: "var(--bg)", color: "var(--text2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn" }}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
