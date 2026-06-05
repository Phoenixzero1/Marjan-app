"use client";

import { useState, useEffect, useCallback } from "react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  country: string | null;
  isActive: boolean;
  _count: { products: number };
}

type Form = Partial<Omit<Brand, "_count">>;

const inp: React.CSSProperties = {
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13,
  color: "var(--text)", outline: "none", width: "100%", background: "#fff",
  boxSizing: "border-box",
};
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 };

export default function BrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/brands")
      .then(r => r.json())
      .then(d => setBrands(d.brands ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!editForm?.name || !editForm.slug) return;
    setSaving(true);
    try {
      const isNew = !editForm.id;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch("/api/admin/brands", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطا");
      showToast(isNew ? "برند اضافه شد" : "برند ویرایش شد");
      setEditForm(null);
      load();
    } catch (e) {
      showToast(String(e), false);
    } finally {
      setSaving(false);
    }
  }

  async function deleteBrand(id: string, name: string, count: number) {
    const msg = count > 0
      ? `حذف برند "${name}"؟\n${count} محصول از این برند جدا می‌شوند (brandId → null).`
      : `آیا از حذف برند "${name}" مطمئن هستید؟`;
    if (!window.confirm(msg)) return;

    const res = await fetch("/api/admin/brands", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(count > 0 ? `برند حذف شد. ${count} محصول بدون برند شدند.` : "برند حذف شد");
      load();
    } else {
      showToast(data.error ?? "خطا در حذف", false);
    }
  }

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.includes(search.toLowerCase())
  );

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, fontFamily: "Vazirmatn" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>مدیریت برندها</h2>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>{brands.filter(b => b.isActive).length} برند فعال</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو..."
            style={{ ...inp, width: 200 }}
          />
          <button
            onClick={() => setEditForm({ isActive: true })}
            style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            + برند جدید
          </button>
        </div>
      </div>

      {/* Edit / Create Form */}
      {editForm && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>{editForm.id ? "ویرایش برند" : "برند جدید"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={lbl}>نام برند <span style={{ color: "red" }}>*</span></label>
              <input
                style={inp}
                value={editForm.name ?? ""}
                onChange={e => setEditForm(f => ({
                  ...f,
                  name: e.target.value,
                  slug: f?.id ? f.slug : autoSlug(e.target.value),
                }))}
              />
            </div>
            <div>
              <label style={lbl}>اسلاگ (لاتین) <span style={{ color: "red" }}>*</span></label>
              <input
                style={{ ...inp, direction: "ltr" }}
                value={editForm.slug ?? ""}
                onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="brand-name"
              />
            </div>
            <div>
              <label style={lbl}>لوگو (آدرس تصویر)</label>
              <input
                style={{ ...inp, direction: "ltr" }}
                value={editForm.logoUrl ?? ""}
                onChange={e => setEditForm(f => ({ ...f, logoUrl: e.target.value || null }))}
                placeholder="/uploads/brand-logo.png"
              />
            </div>
            <div>
              <label style={lbl}>کشور / مبدأ</label>
              <input
                style={inp}
                value={editForm.country ?? ""}
                onChange={e => setEditForm(f => ({ ...f, country: e.target.value || null }))}
                placeholder="ایران، آلمان، ایتالیا..."
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>توضیحات</label>
              <textarea
                style={{ ...inp, height: 80, resize: "vertical" }}
                value={editForm.description ?? ""}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value || null }))}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
            <button onClick={save} disabled={saving} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button onClick={() => setEditForm(null)} style={{ background: "var(--bg)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 16px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer" }}>
              انصراف
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginRight: "auto", cursor: "pointer" }}>
              <input type="checkbox" checked={editForm.isActive ?? true} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))} />
              فعال
            </label>
          </div>
        </div>
      )}

      {/* Brand Table */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
            {search ? "برندی با این نام یافت نشد" : "هنوز برندی ثبت نشده است"}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg)", borderBottom: "2px solid var(--border)" }}>
                {["لوگو", "نام", "اسلاگ", "کشور", "محصولات", "وضعیت", "عملیات"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((brand, i) => (
                <tr key={brand.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", opacity: brand.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: "10px 14px" }}>
                    {brand.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brand.logoUrl} alt={brand.name} style={{ width: 40, height: 28, objectFit: "contain", borderRadius: 4 }} />
                    ) : (
                      <div style={{ width: 40, height: 28, background: "var(--bg)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className="ti ti-building-factory" style={{ fontSize: 16, color: "var(--border)" }} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 900 }}>
                    <div>{brand.name}</div>
                    {brand.description && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{brand.description.slice(0, 40)}{brand.description.length > 40 ? "..." : ""}</div>}
                  </td>
                  <td style={{ padding: "10px 14px", direction: "ltr", color: "var(--text3)", fontSize: 12 }}>{brand.slug}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text2)" }}>{brand.country ?? "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontWeight: 700 }}>{brand._count.products}</span>
                    {brand._count.products > 0 && (
                      <a href={`/products?brandId=${brand.slug}`} target="_blank" rel="noreferrer" style={{ marginRight: 6, fontSize: 11, color: "var(--primary)" }}>مشاهده</a>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, background: brand.isActive ? "#dcfce7" : "#f1f5f9", color: brand.isActive ? "#16a34a" : "#64748b", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                      {brand.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setEditForm({ ...brand })}
                        style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 6, padding: "5px 10px", fontFamily: "Vazirmatn", fontSize: 11, cursor: "pointer" }}
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => deleteBrand(brand.id, brand.name, brand._count.products)}
                        style={{ background: "#fdecea", color: "#c0392b", border: "none", borderRadius: 6, padding: "5px 10px", fontFamily: "Vazirmatn", fontSize: 11, cursor: "pointer" }}
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
