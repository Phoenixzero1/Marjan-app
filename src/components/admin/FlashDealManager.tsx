"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminBtn, AdminField, AdminInput, AdminToggle,
  AdminCard, AdminCardHeader, AdminEmptyState, AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";
import DateTimePicker from "@/components/ui/DateTimePicker";

interface ProductRow {
  id: string; name: string; price: number; sku: string | null;
  images: { url: string; isPrimary: boolean }[];
  category: { name: string } | null;
}

interface FlashConfig {
  isActive: boolean; title: string; endTime: string | null;
  productIds: string[]; discountPct: number;
}

const DEFAULT_CONFIG: FlashConfig = { isActive: false, title: "مرجان تایم", endTime: null, productIds: [], discountPct: 20 };

export default function FlashDealManager() {
  const { toast, showToast } = useAdminToast();
  const [config, setConfig] = useState<FlashConfig>(DEFAULT_CONFIG);
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductRow[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const safeJson = async (r: Response) => { const text = await r.text(); try { return JSON.parse(text); } catch { return null; } };

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/flash-deal").then(safeJson),
      fetch("/api/admin/products?page=1&limit=200&status=PUBLISHED").then(safeJson),
    ]).then(([cfg, prods]) => {
      const c: FlashConfig = cfg ?? DEFAULT_CONFIG;
      const ps: ProductRow[] = prods?.products ?? [];
      setConfig(c); setAllProducts(ps);
      setSelectedProducts(ps.filter(p => c.productIds?.includes(p.id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const q = search.toLowerCase();
    setSearchResults(
      allProducts.filter(p => !config.productIds.includes(p.id)).filter(p => p.name.toLowerCase().includes(q) || (p.sku?.toLowerCase().includes(q) ?? false)).slice(0, 8)
    );
  }, [search, allProducts, config.productIds]);

  const addProduct = useCallback((p: ProductRow) => {
    setConfig(prev => ({ ...prev, productIds: [...prev.productIds, p.id] }));
    setSelectedProducts(prev => [...prev, p]);
    setSearch(""); setSearchResults([]);
  }, []);

  const removeProduct = useCallback((id: string) => {
    setConfig(prev => ({ ...prev, productIds: prev.productIds.filter(x => x !== id) }));
    setSelectedProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/flash-deal", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
      if (r.ok) showToast("success", "تنظیمات ذخیره شد");
      else showToast("error", "خطا در ذخیره‌سازی");
    } catch { showToast("error", "خطا در ارتباط با سرور"); }
    setSaving(false);
  };

  if (loading) return <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <AdminToast toast={toast} />

      <AdminPageHeader title="مرجان تایم" icon="ti-clock-bolt" subtitle="تنظیمات فلش فروش ویژه"
        actions={<AdminBtn icon="ti-device-floppy" variant="primary" loading={saving} onClick={save}>{saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}</AdminBtn>}
      />

      <AdminCard>
        <AdminCardHeader title="تنظیمات مرجان تایم" icon="ti-settings" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 14 }}>
          <AdminField label="عنوان بخش">
            <AdminInput value={config.title} onChange={v => setConfig(prev => ({ ...prev, title: v }))} />
          </AdminField>
          <AdminField label="درصد تخفیف (٪)">
            <AdminInput type="number" value={String(config.discountPct)} onChange={v => setConfig(prev => ({ ...prev, discountPct: Math.max(0, Math.min(90, parseInt(v) || 0)) }))} style={{ direction: "ltr" }} />
          </AdminField>
          <AdminField label="تاریخ و زمان پایان">
            <DateTimePicker
              value={config.endTime}
              onChange={iso => setConfig(prev => ({ ...prev, endTime: iso }))}
            />
          </AdminField>
          <AdminField label="وضعیت">
            <AdminToggle checked={config.isActive} onChange={v => setConfig(prev => ({ ...prev, isActive: v }))} label={config.isActive ? "فعال" : "غیرفعال"} />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader title="محصولات فلش فروش" icon="ti-package"
          actions={<span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700 }}>{selectedProducts.length} محصول</span>}
        />
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14, marginTop: 14 }}>
          <i className="ti ti-search" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 16, pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی محصول برای افزودن..."
            style={{ width: "100%", padding: "10px 42px 10px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "Vazirmatn", outline: "none", boxSizing: "border-box" }}
          />
          {searchResults.length > 0 && (
            <div style={{ position: "absolute", top: "100%", right: 0, left: 0, background: "#fff", border: "1.5px solid var(--border)", borderRadius: 8, zIndex: 100, maxHeight: 300, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.12)", marginTop: 4 }}>
              {searchResults.map(p => (
                <div key={p.id} onClick={() => addProduct(p)}
                  style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 6, flexShrink: 0, overflow: "hidden", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.images[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <i className="ti ti-package" style={{ color: "var(--border)", fontSize: 16 }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{p.price.toLocaleString("fa-IR")} تومان{p.category && ` · ${p.category.name}`}</div>
                  </div>
                  <i className="ti ti-plus" style={{ color: "var(--primary)", fontSize: 16, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProducts.length === 0 ? (
          <AdminEmptyState icon="ti-package-off" title="هیچ محصولی انتخاب نشده" subtitle="از جستجوی بالا محصولات را اضافه کنید" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selectedProducts.map(p => {
              const flashPrice = Math.round(p.price * (1 - config.discountPct / 100));
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0, overflow: "hidden", background: "#fff", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.images[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <i className="ti ti-package" style={{ color: "var(--border)", fontSize: 18 }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", display: "flex", gap: 8, marginTop: 2 }}>
                      <span style={{ textDecoration: "line-through" }}>{p.price.toLocaleString("fa-IR")}</span>
                      <span style={{ color: "var(--accent)", fontWeight: 900 }}>{flashPrice.toLocaleString("fa-IR")} تومان</span>
                    </div>
                  </div>
                  <AdminBtn size="sm" icon="ti-trash" variant="danger" onClick={() => removeProduct(p.id)} />
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
