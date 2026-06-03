"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  iconClass: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  metaTitle: string | null;
  metaDesc: string | null;
  parent: { name: string } | null;
  _count: { products: number; children: number };
}

const inp: React.CSSProperties = {
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13,
  color: "var(--text)", outline: "none", width: "100%", background: "#fff",
  boxSizing: "border-box",
};
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 };

interface FormState {
  id?: string;
  name: string;
  slug: string;
  parentId: string;
  description: string;
  iconClass: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
  metaTitle: string;
  metaDesc: string;
}

const emptyForm: FormState = {
  name: "", slug: "", parentId: "", description: "", iconClass: "",
  imageUrl: "", sortOrder: "0", isActive: true, metaTitle: "", metaDesc: "",
};

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadCategories = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => showToast("error", "خطا در بارگذاری دسته‌بندی‌ها"))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const openCreate = () => {
    setForm(emptyForm);
    setSlugTouched(false);
    setFormOpen(true);
  };

  const openEdit = (c: Category) => {
    setForm({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId ?? "",
      description: c.description ?? "",
      iconClass: c.iconClass ?? "",
      imageUrl: c.imageUrl ?? "",
      sortOrder: String(c.sortOrder),
      isActive: c.isActive,
      metaTitle: c.metaTitle ?? "",
      metaDesc: c.metaDesc ?? "",
    });
    setSlugTouched(true);
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setForm(emptyForm); };

  // Auto-slug from name (latin chars only) until the user edits the slug manually
  const onNameChange = (value: string) => {
    setForm((f) => {
      const next = { ...f, name: value };
      if (!slugTouched && !f.id) {
        next.slug = value.toLowerCase().trim()
          .replace(/[\s_]+/g, "-")
          .replace(/[^a-z0-9-]+/g, "")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
      }
      return next;
    });
  };

  const uploadImage = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "categories");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, imageUrl: data.url }));
      } else {
        showToast("error", data.error ?? "خطا در آپلود تصویر");
      }
    } catch {
      showToast("error", "خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) { showToast("error", "نام دسته‌بندی الزامی است"); return; }
    if (!/^[a-z0-9-]{2,}$/.test(form.slug)) {
      showToast("error", "اسلاگ فقط شامل حروف انگلیسی، اعداد و خط تیره (حداقل ۲ کاراکتر)");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        parentId: form.parentId || null,
        description: form.description.trim() || undefined,
        iconClass: form.iconClass.trim() || undefined,
        imageUrl: form.imageUrl || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        metaTitle: form.metaTitle.trim() || undefined,
        metaDesc: form.metaDesc.trim() || undefined,
      };

      const res = await fetch("/api/admin/categories", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });
      const data = await res.json();

      if (!res.ok) { showToast("error", data.error ?? "خطا در ذخیره دسته‌بندی"); return; }

      showToast("success", form.id ? "دسته‌بندی ویرایش شد" : "دسته‌بندی ایجاد شد");
      closeForm();
      loadCategories();
    } catch {
      showToast("error", "خطای سرور. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Category) => {
    if (c._count.children > 0) {
      showToast("error", "این دسته دارای زیردسته است. ابتدا زیردسته‌ها را حذف کنید.");
      return;
    }
    if (!window.confirm(`آیا از حذف «${c.name}» مطمئن هستید؟\nاین عملیات برگشت‌پذیر نیست.`)) return;
    setDeletingId(c.id);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در حذف"); return; }
      showToast("success", `«${c.name}» حذف شد`);
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
    } catch {
      showToast("error", "خطای سرور");
    } finally {
      setDeletingId(null);
    }
  };

  // Parents available for selection: top-level cats only, excluding self (no nesting under self)
  const parentOptions = categories.filter((c) => c.id !== form.id && c.parentId === null);

  return (
    <div style={{ position: "relative" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? "#1a7a4a" : "#c0392b",
          color: "#fff", padding: "12px 28px", borderRadius: 10,
          fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700,
          zIndex: 10000, boxShadow: "0 6px 24px rgba(0,0,0,.25)",
          display: "flex", alignItems: "center", gap: 10, maxWidth: "90vw",
        }}>
          <i className={`ti ${toast.type === "success" ? "ti-circle-check" : "ti-circle-x"}`} style={{ fontSize: 18, flexShrink: 0 }} />
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          {loading ? "در حال بارگذاری..." : `${categories.length} دسته‌بندی`}
        </div>
        <button onClick={openCreate} style={{ marginRight: "auto", background: "var(--primary)", color: "#fff", border: "none", padding: "9px 16px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <i className="ti ti-plus" /> دسته‌بندی جدید
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
          <thead>
            <tr>
              {["دسته‌بندی", "اسلاگ", "والد", "محصولات", "زیردسته", "وضعیت", "عملیات"].map((h) => (
                <th key={h} style={{ background: "var(--bg)", padding: "10px 12px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900 }}>
                    {c.parentId && <i className="ti ti-corner-down-left" style={{ color: "var(--text3)", fontSize: 14 }} />}
                    {c.iconClass && <i className={`ti ${c.iconClass}`} style={{ color: "var(--primary)", fontSize: 16 }} />}
                    {c.name}
                  </div>
                </td>
                <td style={{ padding: "10px 12px", color: "var(--text3)", direction: "ltr", textAlign: "right", fontSize: 12 }}>{c.slug}</td>
                <td style={{ padding: "10px 12px", color: "var(--text3)" }}>{c.parent?.name ?? "—"}</td>
                <td style={{ padding: "10px 12px" }}>{c._count.products}</td>
                <td style={{ padding: "10px 12px" }}>{c._count.children}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span className={c.isActive ? "pill-green" : "pill-gray"} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>
                    {c.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: 4 }}>
                  <button onClick={() => openEdit(c)} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "Vazirmatn", color: "var(--text2)", whiteSpace: "nowrap" }}>
                    <i className="ti ti-edit" /> ویرایش
                  </button>
                  <button onClick={() => handleDelete(c)} disabled={deletingId === c.id} style={{ background: "#fdecea", border: "1px solid #f5c6cb", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: deletingId === c.id ? "not-allowed" : "pointer", fontFamily: "Vazirmatn", color: "#c0392b", opacity: deletingId === c.id ? .6 : 1, whiteSpace: "nowrap" }}>
                    <i className="ti ti-trash" /> {deletingId === c.id ? "حذف..." : "حذف"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && categories.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>دسته‌بندی‌ای یافت نشد</td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
                <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} /> در حال بارگذاری...
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      {formOpen && (
        <div
          onClick={closeForm}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9998, display: "flex", justifyContent: "flex-start" }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            style={{ width: 440, maxWidth: "100%", height: "100%", background: "var(--bg)", overflowY: "auto", boxShadow: "0 0 40px rgba(0,0,0,.3)", display: "flex", flexDirection: "column" }}
          >
            <div style={{ padding: "1rem 1.5rem", background: "#fff", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", margin: 0 }}>
                {form.id ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
              </h3>
              <button type="button" onClick={closeForm} style={{ background: "transparent", border: "none", fontSize: 22, color: "var(--text3)", cursor: "pointer", lineHeight: 1, minWidth: 32, minHeight: 32 }}>
                <i className="ti ti-x" />
              </button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <div>
                <label style={lbl}>نام دسته‌بندی <span style={{ color: "#c0392b" }}>*</span></label>
                <input value={form.name} onChange={(e) => onNameChange(e.target.value)} style={inp} placeholder="مثلاً: شیرآلات بهداشتی" />
              </div>

              <div>
                <label style={lbl}>اسلاگ (URL) <span style={{ color: "#c0392b" }}>*</span></label>
                <input
                  value={form.slug}
                  onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                  style={{ ...inp, direction: "ltr", textAlign: "left" }}
                  placeholder="sanitary-faucets"
                />
                <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, marginTop: 4 }}>فقط حروف انگلیسی، اعداد و خط تیره</div>
              </div>

              <div>
                <label style={lbl}>دسته والد</label>
                <select value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">— بدون والد (دسته اصلی) —</option>
                  {parentOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>توضیحات</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inp, resize: "vertical" }} placeholder="توضیح کوتاه درباره این دسته‌بندی..." />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>آیکون (Tabler)</label>
                  <input value={form.iconClass} onChange={(e) => setForm((f) => ({ ...f, iconClass: e.target.value }))} style={{ ...inp, direction: "ltr", textAlign: "left" }} placeholder="ti-droplet" />
                </div>
                <div>
                  <label style={lbl}>ترتیب نمایش</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} style={inp} min="0" />
                </div>
              </div>

              <div>
                <label style={lbl}>تصویر دسته‌بندی</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {form.imageUrl ? (
                    <div style={{ position: "relative", width: 64, height: 64, borderRadius: 8, overflow: "hidden", border: "1.5px solid var(--border)", flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))} style={{ position: "absolute", top: 2, left: 2, background: "rgba(192,57,43,.9)", color: "#fff", border: "none", borderRadius: 4, width: 20, height: 20, cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 8, border: "1.5px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--border)", flexShrink: 0 }}>
                      <i className="ti ti-photo" style={{ fontSize: 24 }} />
                    </div>
                  )}
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "8px 14px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: uploading ? "not-allowed" : "pointer", color: "var(--text2)", display: "flex", alignItems: "center", gap: 6 }}>
                    <i className={`ti ${uploading ? "ti-loader-2" : "ti-upload"}`} /> {uploading ? "در حال آپلود..." : "انتخاب تصویر"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                </div>
              </div>

              <div>
                <label style={lbl}>عنوان سئو (Meta Title)</label>
                <input value={form.metaTitle} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))} style={inp} placeholder="عنوان برای موتورهای جستجو" />
              </div>
              <div>
                <label style={lbl}>توضیحات سئو (Meta Description)</label>
                <textarea value={form.metaDesc} onChange={(e) => setForm((f) => ({ ...f, metaDesc: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} placeholder="توضیحات متا برای سئو..." />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--text2)", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} style={{ width: 16, height: 16, cursor: "pointer" }} />
                دسته‌بندی فعال باشد
              </label>
            </div>

            <div style={{ padding: "1rem 1.5rem", background: "#fff", borderTop: "1px solid var(--border)", display: "flex", gap: 10, position: "sticky", bottom: 0 }}>
              <button type="submit" disabled={saving || uploading} style={{ flex: 1, background: saving || uploading ? "#aaa" : "var(--primary)", color: "#fff", border: "none", padding: "12px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 900, fontFamily: "Vazirmatn", cursor: saving || uploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {saving ? <><i className="ti ti-loader-2" /> در حال ذخیره...</> : <><i className="ti ti-device-floppy" /> {form.id ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}</>}
              </button>
              <button type="button" onClick={closeForm} style={{ background: "var(--bg)", color: "var(--text2)", border: "1px solid var(--border)", padding: "12px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer" }}>
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
