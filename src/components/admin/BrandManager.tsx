"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminToolbar, AdminSearch, AdminBtn, AdminTable, AdminTh, AdminTd, AdminTr,
  AdminBadge, AdminEmptyState, AdminDrawer, AdminField, AdminInput, AdminTextarea,
  AdminToggle, AdminToast, AdminDivider, useAdminToast,
} from "@/components/admin/AdminUI";
import ImageUploader from "@/components/admin/ImageUploader";

interface Brand {
  id: string; name: string; slug: string; logoUrl: string | null;
  description: string | null; country: string | null; isActive: boolean;
  _count: { products: number };
}

type Form = { id?: string; name: string; slug: string; logoUrl: string; description: string; country: string; isActive: boolean; };
const emptyForm: Form = { name: "", slug: "", logoUrl: "", description: "", country: "", isActive: true };

function autoSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function BrandManager() {
  const { toast, showToast } = useAdminToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/brands").then(r => r.json()).then(d => setBrands(d.brands ?? [])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(emptyForm); setFormOpen(true); };
  const openEdit = (b: Brand) => { setForm({ id: b.id, name: b.name, slug: b.slug, logoUrl: b.logoUrl ?? "", description: b.description ?? "", country: b.country ?? "", isActive: b.isActive }); setFormOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) { showToast("error", "نام و اسلاگ الزامی است"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/brands", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, logoUrl: form.logoUrl || null, description: form.description || null, country: form.country || null }) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا"); return; }
      showToast("success", form.id ? "برند ویرایش شد" : "برند اضافه شد");
      setFormOpen(false); load();
    } catch { showToast("error", "خطای سرور"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (b: Brand) => {
    const msg = b._count.products > 0 ? `حذف برند "${b.name}"؟ ${b._count.products} محصول بدون برند می‌شوند.` : `آیا از حذف برند "${b.name}" مطمئن هستید؟`;
    if (!window.confirm(msg)) return;
    const res = await fetch("/api/admin/brands", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id }) });
    const data = await res.json();
    if (res.ok) { showToast("success", "برند حذف شد"); load(); }
    else showToast("error", data.error ?? "خطا در حذف");
  };

  const filtered = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.slug.includes(search.toLowerCase()));

  return (
    <div>
      <AdminToast toast={toast} />
      <AdminPageHeader title="برندها" icon="ti-building-factory" count={brands.length}
        subtitle={`${brands.filter(b => b.isActive).length} برند فعال`}
        actions={<AdminBtn icon="ti-plus" variant="primary" onClick={openCreate}>برند جدید</AdminBtn>}
      />
      <AdminToolbar>
        <AdminSearch value={search} onChange={setSearch} placeholder="جستجو نام یا اسلاگ..." />
        <span style={{ fontSize: 12, color: "var(--text3)", marginRight: "auto" }}>{filtered.length} برند</span>
      </AdminToolbar>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh style={{ width: 60 }}>لوگو</AdminTh>
            <AdminTh>نام</AdminTh>
            <AdminTh>اسلاگ</AdminTh>
            <AdminTh>کشور</AdminTh>
            <AdminTh>محصولات</AdminTh>
            <AdminTh>وضعیت</AdminTh>
            <AdminTh style={{ width: 120 }}>عملیات</AdminTh>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={7}><AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /></td></tr>}
          {!loading && filtered.length === 0 && <tr><td colSpan={7}><AdminEmptyState icon="ti-building-factory" title={search ? "برندی با این نام یافت نشد" : "هنوز برندی ثبت نشده"} /></td></tr>}
          {filtered.map(b => (
            <AdminTr key={b.id} style={{ opacity: b.isActive ? 1 : 0.55 }}>
              <AdminTd>
                <div style={{ width: 44, height: 32, borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {b.logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={b.logoUrl} alt={b.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : <i className="ti ti-building-factory" style={{ fontSize: 16, color: "var(--text3)" }} />}
                </div>
              </AdminTd>
              <AdminTd>
                <div style={{ fontWeight: 900 }}>{b.name}</div>
                {b.description && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{b.description.slice(0, 45)}{b.description.length > 45 ? "…" : ""}</div>}
              </AdminTd>
              <AdminTd><code style={{ fontSize: 11, color: "var(--text3)", background: "var(--bg)", padding: "2px 6px", borderRadius: 4, direction: "ltr", display: "inline-block" }}>{b.slug}</code></AdminTd>
              <AdminTd style={{ color: "var(--text2)" }}>{b.country ?? <span style={{ opacity: 0.4 }}>—</span>}</AdminTd>
              <AdminTd>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 28, height: 22, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 11, fontWeight: 900, color: "var(--text2)" }}>{b._count.products}</span>
              </AdminTd>
              <AdminTd><AdminBadge variant={b.isActive ? "success" : "neutral"} dot>{b.isActive ? "فعال" : "غیرفعال"}</AdminBadge></AdminTd>
              <AdminTd>
                <div style={{ display: "flex", gap: 4 }}>
                  <AdminBtn icon="ti-edit" size="sm" onClick={() => openEdit(b)}>ویرایش</AdminBtn>
                  <AdminBtn icon="ti-trash" size="sm" variant="danger" onClick={() => handleDelete(b)} />
                </div>
              </AdminTd>
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>

      <AdminDrawer open={formOpen} onClose={() => setFormOpen(false)} title={form.id ? "ویرایش برند" : "برند جدید"}>
        <form onSubmit={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <AdminField label="نام برند" required>
              <AdminInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v, slug: f.id ? f.slug : autoSlug(v) }))} placeholder="Samsung" />
            </AdminField>
            <AdminField label="اسلاگ (لاتین)" required hint="خودکار پر می‌شود">
              <AdminInput value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} placeholder="samsung" style={{ direction: "ltr" }} />
            </AdminField>
          </div>
          <AdminField label="لوگوی برند">
            <ImageUploader value={form.logoUrl} onChange={v => setForm(f => ({ ...f, logoUrl: v }))} folder="brands" previewHeight={70} compact />
          </AdminField>
          <AdminField label="کشور / مبدأ">
            <AdminInput value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} placeholder="ایران، آلمان، ایتالیا..." />
          </AdminField>
          <AdminField label="توضیحات">
            <AdminTextarea value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} rows={3} />
          </AdminField>
          <AdminField label="وضعیت"><AdminToggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} label="برند فعال باشد" /></AdminField>
          <AdminDivider />
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn variant="primary" icon="ti-device-floppy" loading={saving} style={{ flex: 1, justifyContent: "center" }}>{saving ? "ذخیره..." : form.id ? "ذخیره تغییرات" : "ایجاد برند"}</AdminBtn>
            <AdminBtn variant="secondary" onClick={() => setFormOpen(false)}>انصراف</AdminBtn>
          </div>
        </form>
      </AdminDrawer>
    </div>
  );
}
