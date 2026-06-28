"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminBtn, AdminCard, AdminCardHeader,
  AdminField, AdminEmptyState, AdminModal,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";
import ImageUploader from "@/components/admin/ImageUploader";

interface ShowcaseSlide {
  id: string;
  headline: string;
  subline: string;
  description: string;
  bgColor: string;
  imageUrl: string;
  price: number | null;
  salePrice: number | null;
  buttonText: string;
  buttonLink: string;
  productId: string;
  productSlug: string;
}

const BLANK: ShowcaseSlide = {
  id: "", headline: "", subline: "", description: "",
  bgColor: "#0a2a5e", imageUrl: "", price: null, salePrice: null,
  buttonText: "مشاهده محصول", buttonLink: "", productId: "", productSlug: "",
};

const PRESET_COLORS = [
  "#0a2a5e", "#1a3d7c", "#0f766e", "#7c3aed",
  "#b45309", "#dc2626", "#1e40af", "#065f46",
];

const inputSt: React.CSSProperties = { width: "100%", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "Vazirmatn,sans-serif", background: "#fff", color: "var(--text)", outline: "none", boxSizing: "border-box" };

export default function ShowcaseManager() {
  const { toast, showToast } = useAdminToast();
  const [slides, setSlides] = useState<ShowcaseSlide[]>([]);
  const [editing, setEditing] = useState<ShowcaseSlide | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/showcase");
      const d = await r.json();
      setSlides(d.slides ?? []);
    } catch { showToast("error", "خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(newSlides: ShowcaseSlide[]) {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: newSlides }),
      });
      if (!r.ok) throw new Error("خطا");
      showToast("success", "ذخیره شد");
      setSlides(newSlides);
    } catch { showToast("error", "خطا در ذخیره"); }
    finally { setSaving(false); }
  }

  function startNew() { setEditing({ ...BLANK, id: crypto.randomUUID() }); setIsNew(true); }
  function startEdit(s: ShowcaseSlide) { setEditing({ ...s }); setIsNew(false); }
  function cancelEdit() { setEditing(null); }

  async function submitEdit() {
    if (!editing) return;
    if (!editing.headline.trim()) { showToast("error", "عنوان الزامیست"); return; }
    const updated = isNew ? [...slides, editing] : slides.map(s => s.id === editing.id ? editing : s);
    await save(updated);
    setEditing(null);
  }

  async function deleteSlide(id: string) {
    if (!confirm("حذف شود؟")) return;
    await save(slides.filter(s => s.id !== id));
  }

  function moveSlide(id: string, dir: -1 | 1) {
    const idx = slides.findIndex(s => s.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= slides.length) return;
    const arr = [...slides];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    save(arr);
  }

  function setField<K extends keyof ShowcaseSlide>(k: K, v: ShowcaseSlide[K]) {
    setEditing(prev => prev ? { ...prev, [k]: v } : prev);
  }

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader
        title="ویترین محصول ویژه"
        icon="ti-layout-grid"
        count={slides.length}
        subtitle="اسلایدهای بخش نمایش ویژه صفحه اصلی را مدیریت کنید"
        actions={<AdminBtn variant="primary" icon="ti-plus" onClick={startNew}>اسلاید جدید</AdminBtn>}
      />

      {loading ? (
        <AdminEmptyState icon="ti-loader-2" title="بارگذاری..." />
      ) : slides.length === 0 ? (
        <AdminEmptyState icon="ti-layout-grid-remove" title="هیچ اسلایدی ثبت نشده" subtitle="با کلیک روی «اسلاید جدید» شروع کنید" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {slides.map((s, idx) => (
            <AdminCard key={s.id}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: 10, flexShrink: 0, background: s.bgColor || "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {s.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={s.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : <i className="ti ti-photo" style={{ fontSize: 24, color: "rgba(255,255,255,.5)" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 14, color: "var(--text)", marginBottom: 2 }}>{s.headline || "—"}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{s.subline || s.description || "—"}</div>
                  {s.price != null && (
                    <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 900, marginTop: 3 }}>
                      {s.price.toLocaleString("fa-IR")} تومان
                      {s.salePrice != null && <span style={{ color: "#dc2626", marginRight: 6 }}>← {s.salePrice.toLocaleString("fa-IR")}</span>}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <AdminBtn size="sm" icon="ti-arrow-up" disabled={idx === 0} onClick={() => moveSlide(s.id, -1)} />
                  <AdminBtn size="sm" icon="ti-arrow-down" disabled={idx === slides.length - 1} onClick={() => moveSlide(s.id, 1)} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <AdminBtn size="sm" icon="ti-edit" onClick={() => startEdit(s)}>ویرایش</AdminBtn>
                  <AdminBtn size="sm" icon="ti-trash" variant="danger" onClick={() => deleteSlide(s.id)} />
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <AdminModal open={!!editing} onClose={cancelEdit} title={isNew ? "اسلاید جدید" : "ویرایش اسلاید"} width={640}>
        {editing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <AdminField label="عنوان اصلی" required>
                  <input style={inputSt} value={editing.headline} onChange={e => setField("headline", e.target.value)} placeholder="مثلاً: شیر توپی برنجی اروپایی" />
                </AdminField>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <AdminField label="زیرعنوان (ایتالیک)">
                  <input style={inputSt} value={editing.subline} onChange={e => setField("subline", e.target.value)} placeholder="مثلاً: با ۱۵ سال ضمانت" />
                </AdminField>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <AdminField label="توضیحات">
                  <textarea rows={3} style={{ ...inputSt, resize: "vertical" }} value={editing.description} onChange={e => setField("description", e.target.value)} placeholder="توضیح کوتاه درباره محصول..." />
                </AdminField>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <AdminField label="تصویر محصول">
                  <ImageUploader value={editing.imageUrl} onChange={v => setField("imageUrl", v)} folder="showcase" previewHeight={80} />
                </AdminField>
              </div>

              <div>
                <AdminField label="رنگ پس‌زمینه">
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {PRESET_COLORS.map(c => (
                      <button key={c} onClick={() => setField("bgColor", c)} style={{ width: 28, height: 28, borderRadius: 6, background: c, border: editing.bgColor === c ? "2.5px solid #fff" : "2.5px solid transparent", boxShadow: editing.bgColor === c ? `0 0 0 2px ${c}` : "none", cursor: "pointer" }} />
                    ))}
                  </div>
                  <input type="color" value={editing.bgColor} onChange={e => setField("bgColor", e.target.value)} style={{ width: "100%", height: 36, borderRadius: 8, border: "1.5px solid var(--border)", cursor: "pointer", padding: 2 }} />
                </AdminField>
              </div>

              <div>
                <AdminField label="قیمت اصلی (تومان)">
                  <input style={inputSt} type="number" value={editing.price ?? ""} onChange={e => setField("price", e.target.value ? Number(e.target.value) : null)} placeholder="بدون قیمت = نمایش نمی‌شود" dir="ltr" />
                </AdminField>
              </div>
              <div>
                <AdminField label="قیمت تخفیف‌دار (تومان)">
                  <input style={inputSt} type="number" value={editing.salePrice ?? ""} onChange={e => setField("salePrice", e.target.value ? Number(e.target.value) : null)} placeholder="اختیاری" dir="ltr" />
                </AdminField>
              </div>
              <div>
                <AdminField label="متن دکمه">
                  <input style={inputSt} value={editing.buttonText} onChange={e => setField("buttonText", e.target.value)} placeholder="مشاهده محصول" />
                </AdminField>
              </div>
              <div>
                <AdminField label="لینک دکمه">
                  <input style={inputSt} value={editing.buttonLink} onChange={e => setField("buttonLink", e.target.value)} placeholder="/product/slug" dir="ltr" />
                </AdminField>
              </div>
              <div>
                <AdminField label="Product ID (برای افزودن به سبد)">
                  <input style={inputSt} value={editing.productId} onChange={e => setField("productId", e.target.value)} placeholder="اختیاری" dir="ltr" />
                </AdminField>
              </div>
              <div>
                <AdminField label="Slug محصول (لینک «اطلاعات بیشتر»)">
                  <input style={inputSt} value={editing.productSlug} onChange={e => setField("productSlug", e.target.value)} placeholder="اختیاری" dir="ltr" />
                </AdminField>
              </div>
            </div>

            {editing.bgColor && (
              <div style={{ marginTop: "0.5rem", borderRadius: 12, overflow: "hidden", height: 80, background: editing.bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {editing.imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={editing.imageUrl} alt="" style={{ maxHeight: "100%", maxWidth: "40%", objectFit: "contain" }} />
                  : <i className="ti ti-photo" style={{ fontSize: 32, color: "rgba(255,255,255,.3)" }} />}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
              <AdminBtn onClick={cancelEdit}>انصراف</AdminBtn>
              <AdminBtn variant="primary" icon="ti-device-floppy" loading={saving} onClick={submitEdit}>
                {isNew ? "افزودن" : "ذخیره تغییرات"}
              </AdminBtn>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
