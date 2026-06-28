"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  AdminPageHeader, AdminToolbar, AdminBtn, AdminTable, AdminTh, AdminTd, AdminTr,
  AdminBadge, AdminEmptyState, AdminDrawer, AdminField, AdminInput, AdminTextarea,
  AdminInputSelect, AdminToggle, AdminToast, AdminDivider, useAdminToast,
} from "@/components/admin/AdminUI";
import CategorySizesModal from "@/components/admin/CategorySizesModal";
import UnitPicker from "@/components/admin/UnitPicker";

interface Category {
  id: string; name: string; slug: string; parentId: string | null;
  description: string | null; iconClass: string | null; imageUrl: string | null;
  sortOrder: number; isActive: boolean; metaTitle: string | null; metaDesc: string | null;
  parent: { name: string } | null; _count: { products: number; children: number };
}

type CatNode = Category & { children: CatNode[] };

interface FormState {
  id?: string; name: string; slug: string; parentId: string; description: string;
  iconClass: string; imageUrl: string; sortOrder: string; isActive: boolean; metaTitle: string; metaDesc: string;
}
const emptyForm: FormState = { name: "", slug: "", parentId: "", description: "", iconClass: "", imageUrl: "", sortOrder: "0", isActive: true, metaTitle: "", metaDesc: "" };

export default function CategoryManager() {
  const { toast, showToast } = useAdminToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category default unit (loaded/saved with the edit drawer)
  const [categoryUnit, setCategoryUnit] = useState("");

  // Sizes modal — holds { id, name } of the category being configured
  const [sizesModal, setSizesModal] = useState<{ id: string; name: string } | null>(null);

  const toggleCollapse = (id: string) => setCollapsed(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/categories").then(r => r.json()).then(d => setCategories(d.categories ?? [])).catch(() => showToast("error", "خطا در بارگذاری")).finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setCategoryUnit("");
    setSlugTouched(false);
    setFormOpen(true);
  };

  const openEdit = (c: Category) => {
    setForm({ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId ?? "", description: c.description ?? "", iconClass: c.iconClass ?? "", imageUrl: c.imageUrl ?? "", sortOrder: String(c.sortOrder), isActive: c.isActive, metaTitle: c.metaTitle ?? "", metaDesc: c.metaDesc ?? "" });
    setSlugTouched(true);
    setCategoryUnit("");
    fetch(`/api/admin/categories/${c.id}/unit`)
      .then((r) => r.json())
      .then((d) => setCategoryUnit(d.unit ?? ""))
      .catch(() => {});
    setFormOpen(true);
  };

  const onNameChange = (value: string) => {
    setForm(f => {
      const next = { ...f, name: value };
      if (!slugTouched && !f.id) next.slug = value.toLowerCase().trim().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]+/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
      return next;
    });
  };

  const uploadImage = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("folder", "categories");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) setForm(f => ({ ...f, imageUrl: data.url }));
      else showToast("error", data.error ?? "خطا در آپلود");
    } catch { showToast("error", "خطا در آپلود تصویر"); }
    finally { setUploading(false); }
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) { showToast("error", "نام دسته‌بندی الزامی است"); return; }
    if (!/^[a-z0-9-]{2,}$/.test(form.slug)) { showToast("error", "اسلاگ فقط حروف انگلیسی، اعداد و خط تیره"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), slug: form.slug.trim(), parentId: form.parentId || null, description: form.description.trim() || undefined, iconClass: form.iconClass.trim() || undefined, imageUrl: form.imageUrl || undefined, sortOrder: Number(form.sortOrder) || 0, isActive: form.isActive, metaTitle: form.metaTitle.trim() || undefined, metaDesc: form.metaDesc.trim() || undefined };
      const res = await fetch("/api/admin/categories", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در ذخیره"); return; }

      // Save category unit alongside category data
      const savedId = form.id ?? data.category?.id;
      if (savedId) {
        await fetch(`/api/admin/categories/${savedId}/unit`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unit: categoryUnit }),
        }).catch(() => {});
      }

      showToast("success", form.id ? "دسته‌بندی ویرایش شد" : "دسته‌بندی ایجاد شد");
      setFormOpen(false); load();
    } catch { showToast("error", "خطای سرور"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c: Category) => {
    if (c._count.children > 0) { showToast("error", "این دسته دارای زیردسته است. ابتدا زیردسته‌ها را حذف کنید."); return; }
    if (!window.confirm(`آیا از حذف «${c.name}» مطمئن هستید؟`)) return;
    setDeletingId(c.id);
    try {
      const res = await fetch("/api/admin/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id }) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در حذف"); return; }
      showToast("success", `«${c.name}» حذف شد`);
      setCategories(p => p.filter(x => x.id !== c.id));
    } catch { showToast("error", "خطای سرور"); }
    finally { setDeletingId(null); }
  };

  const parentOptions = categories.filter(c => c.id !== form.id && c.parentId === null);

  const tree = useMemo(() => {
    const map = new Map<string, CatNode>();
    categories.forEach(c => map.set(c.id, { ...c, children: [] }));
    const roots: CatNode[] = [];
    categories.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(node);
      else roots.push(node);
    });
    const sortFn = (a: CatNode, b: CatNode) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fa");
    roots.sort(sortFn);
    map.forEach(n => n.children.sort(sortFn));
    return roots;
  }, [categories]);

  const countCell = (n: number) => (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 28, height: 22, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 11, fontWeight: 900, color: "var(--text2)" }}>{n.toLocaleString("fa-IR")}</span>
  );

  const renderRows = (nodes: CatNode[], depth: number): React.ReactElement[] =>
    nodes.flatMap(node => {
      const hasChildren = node.children.length > 0;
      const isCollapsed = collapsed.has(node.id);
      const row = (
        <AdminTr key={node.id}>
          <AdminTd>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: depth * 22 }}>
              {hasChildren ? (
                <button onClick={() => toggleCollapse(node.id)}
                  style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "var(--text2)", flexShrink: 0, padding: 0 }}
                  title={isCollapsed ? "باز کردن" : "بستن"}>
                  <i className={`ti ti-chevron-${isCollapsed ? "left" : "down"}`} style={{ fontSize: 15 }} />
                </button>
              ) : (
                <span style={{ width: 20, flexShrink: 0, display: "inline-flex", justifyContent: "center", color: "var(--text3)", opacity: 0.4 }}>
                  {depth > 0 ? <i className="ti ti-point" style={{ fontSize: 12 }} /> : null}
                </span>
              )}
              {node.iconClass && <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(10,42,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className={`ti ${node.iconClass}`} style={{ color: "var(--primary)", fontSize: 14 }} />
              </div>}
              {node.imageUrl && <img src={node.imageUrl} alt={node.name} style={{ width: 28, height: 28, borderRadius: 7, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} />}
              <span style={{ fontWeight: depth === 0 ? 900 : 700, color: depth === 0 ? "var(--text)" : "var(--text2)" }}>{node.name}</span>
              {hasChildren && <span style={{ fontSize: 10, color: "var(--text3)" }}>({node.children.length})</span>}
            </div>
          </AdminTd>
          <AdminTd><code style={{ fontSize: 11, color: "var(--text3)", background: "var(--bg)", padding: "2px 6px", borderRadius: 4, direction: "ltr", display: "inline-block" }}>{node.slug}</code></AdminTd>
          <AdminTd>{countCell(node._count.products)}</AdminTd>
          <AdminTd>{countCell(node._count.children)}</AdminTd>
          <AdminTd><AdminBadge variant={node.isActive ? "success" : "neutral"} dot>{node.isActive ? "فعال" : "غیرفعال"}</AdminBadge></AdminTd>
          <AdminTd>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <AdminBtn
                icon="ti-ruler-measure"
                size="sm"
                variant="ghost"
                title="مدیریت سایزبندی"
                onClick={() => setSizesModal({ id: node.id, name: node.name })}
              >
                سایزها
              </AdminBtn>
              <AdminBtn icon="ti-edit" size="sm" onClick={() => openEdit(node)}>ویرایش</AdminBtn>
              <AdminBtn icon="ti-trash" size="sm" variant="danger" loading={deletingId === node.id} onClick={() => handleDelete(node)} />
            </div>
          </AdminTd>
        </AdminTr>
      );
      const childRows = hasChildren && !isCollapsed ? renderRows(node.children, depth + 1) : [];
      return [row, ...childRows];
    });

  const allCollapsed = collapsed.size > 0;

  return (
    <div>
      <AdminToast toast={toast} />

      {/* Sizes modal — rendered at root so it overlays everything */}
      {sizesModal && (
        <CategorySizesModal
          categoryId={sizesModal.id}
          categoryName={sizesModal.name}
          onClose={() => setSizesModal(null)}
        />
      )}

      <AdminPageHeader title="دسته‌بندی‌ها" icon="ti-category" count={categories.length}
        subtitle="ساختار سلسله‌مراتبی محصولات"
        actions={<AdminBtn icon="ti-plus" variant="primary" onClick={openCreate}>دسته‌بندی جدید</AdminBtn>}
      />
      <AdminToolbar>
        <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700 }}>
          {loading ? "در حال بارگذاری..." : `${categories.filter(c => c.isActive).length} دسته فعال از ${categories.length}`}
        </span>
        {tree.some(n => n.children.length > 0) && (
          <AdminBtn size="sm" variant="ghost" icon={allCollapsed ? "ti-fold-down" : "ti-fold-up"}
            onClick={() => {
              if (allCollapsed) setCollapsed(new Set());
              else setCollapsed(new Set(categories.filter(c => c._count.children > 0).map(c => c.id)));
            }}
            style={{ marginRight: "auto" }}>
            {allCollapsed ? "باز کردن همه" : "بستن همه"}
          </AdminBtn>
        )}
      </AdminToolbar>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>دسته‌بندی</AdminTh>
            <AdminTh>اسلاگ</AdminTh>
            <AdminTh>محصولات</AdminTh>
            <AdminTh>زیردسته</AdminTh>
            <AdminTh>وضعیت</AdminTh>
            <AdminTh style={{ width: 210 }}>عملیات</AdminTh>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={6}><AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /></td></tr>}
          {!loading && categories.length === 0 && <tr><td colSpan={6}><AdminEmptyState icon="ti-category" title="دسته‌بندی‌ای یافت نشد" /></td></tr>}
          {!loading && renderRows(tree, 0)}
        </tbody>
      </AdminTable>

      <AdminDrawer open={formOpen} onClose={() => setFormOpen(false)} title={form.id ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}>
        <form onSubmit={handleSubmit}>
          <AdminField label="نام دسته‌بندی" required>
            <AdminInput value={form.name} onChange={onNameChange} placeholder="مثلاً: شیرآلات بهداشتی" />
          </AdminField>
          <AdminField label="اسلاگ (URL)" required hint="فقط حروف انگلیسی، اعداد و خط تیره">
            <AdminInput value={form.slug} onChange={v => { setSlugTouched(true); setForm(f => ({ ...f, slug: v })); }} placeholder="sanitary-faucets" style={{ direction: "ltr" }} />
          </AdminField>
          <AdminField label="دسته والد">
            <AdminInputSelect value={form.parentId} onChange={v => setForm(f => ({ ...f, parentId: v }))}>
              <option value="">— دسته اصلی (بدون والد) —</option>
              {parentOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </AdminInputSelect>
          </AdminField>
          <AdminField label="توضیحات">
            <AdminTextarea value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="توضیح کوتاه..." rows={3} />
          </AdminField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <AdminField label="آیکون (Tabler)">
              <AdminInput value={form.iconClass} onChange={v => setForm(f => ({ ...f, iconClass: v }))} placeholder="ti-droplet" style={{ direction: "ltr" }} />
            </AdminField>
            <AdminField label="ترتیب نمایش">
              <AdminInput type="number" value={form.sortOrder} onChange={v => setForm(f => ({ ...f, sortOrder: v }))} />
            </AdminField>
          </div>

          {/* Default unit for products in this category */}
          <AdminField label="واحد پیش‌فرض محصولات" hint="واحد فروش پیش‌فرض برای محصولات این دسته — قابل override در هر محصول">
            <UnitPicker value={categoryUnit} onChange={setCategoryUnit} />
          </AdminField>

          <AdminField label="تصویر دسته‌بندی">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {form.imageUrl ? (
                <div style={{ position: "relative", width: 60, height: 60, borderRadius: 8, overflow: "hidden", border: "1.5px solid var(--border)", flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))} style={{ position: "absolute", top: 2, left: 2, background: "rgba(192,57,43,.9)", color: "#fff", border: "none", borderRadius: 4, width: 18, height: 18, cursor: "pointer", fontSize: 11, padding: 0 }}>×</button>
                </div>
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 8, border: "1.5px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", flexShrink: 0 }}>
                  <i className="ti ti-photo" style={{ fontSize: 22 }} />
                </div>
              )}
              <AdminBtn icon={uploading ? "ti-loader" : "ti-upload"} loading={uploading} onClick={() => fileInputRef.current?.click()} size="sm">
                {uploading ? "آپلود..." : "انتخاب تصویر"}
              </AdminBtn>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
            </div>
          </AdminField>
          <AdminDivider label="سئو" />
          <AdminField label="عنوان سئو"><AdminInput value={form.metaTitle} onChange={v => setForm(f => ({ ...f, metaTitle: v }))} placeholder="عنوان برای موتورهای جستجو" /></AdminField>
          <AdminField label="توضیحات سئو"><AdminTextarea value={form.metaDesc} onChange={v => setForm(f => ({ ...f, metaDesc: v }))} rows={2} placeholder="متا دسکریپشن..." /></AdminField>
          <AdminField label="وضعیت"><AdminToggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} label="دسته‌بندی فعال باشد" /></AdminField>
          <AdminDivider />
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn variant="primary" icon="ti-device-floppy" loading={saving || uploading} style={{ flex: 1, justifyContent: "center" }}>{saving ? "ذخیره..." : form.id ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}</AdminBtn>
            <AdminBtn variant="secondary" onClick={() => setFormOpen(false)}>انصراف</AdminBtn>
          </div>
        </form>
      </AdminDrawer>
    </div>
  );
}
