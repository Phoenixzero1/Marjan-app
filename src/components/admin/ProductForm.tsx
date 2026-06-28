"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import UnitPicker from "@/components/admin/UnitPicker";

interface Category { id: string; name: string; parentId: string | null; }
interface Brand { id: string; name: string; }
interface PImage { id?: string; url: string; isPrimary: boolean; altText?: string; sortOrder: number; }
interface PSize { label: string; unit: string; stock: number; }

const INCH_SIZES = ['1/4"', '3/8"', '1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"', '2 1/2"', '3"', '4"', '5"', '6"'];
const MM_SIZES = ["16", "20", "25", "32", "40", "50", "63", "75", "90", "110", "125", "160", "200", "250", "315"];

// maps Persian/display unit names to the DB enum value
const UNIT_TO_ENUM: Record<string, string> = {
  INCH: "INCH", MM: "MM", METER: "METER", PIECE: "PIECE",
  "اینچ": "INCH", "میلیمتر": "MM", "میلی‌متر": "MM",
  "متر": "METER", "عدد": "PIECE",
};
function toEnum(unit: string): string { return UNIT_TO_ENUM[unit] ?? "PIECE"; }

// display name for the stock-inputs section
const ENUM_LABEL: Record<string, string> = {
  INCH: "اینچ", MM: "میلیمتر", METER: "متر", PIECE: "عدد",
};

interface SizeSectionProps {
  sizes: PSize[];
  setSizes: React.Dispatch<React.SetStateAction<PSize[]>>;
  sizeUnit: string;
  setSizeUnit: (u: string) => void;
  categorySizes: Record<string, string[]>;
  inp: React.CSSProperties;
}

function SizeSection({ sizes, setSizes, sizeUnit, setSizeUnit, categorySizes, inp }: SizeSectionProps) {
  const customKeys = Object.keys(categorySizes);
  // if category defines "اینچ" or "میلیمتر", use those instead of the hardcoded defaults
  const hasCustomInch = "اینچ" in categorySizes;
  const hasCustomMM   = "میلیمتر" in categorySizes || "میلی‌متر" in categorySizes;
  const allTabs = [
    ...(!hasCustomInch ? [{ key: "INCH",  label: "اینچ",     chips: INCH_SIZES }] : []),
    ...(!hasCustomMM   ? [{ key: "MM",    label: "میلی‌متر", chips: MM_SIZES   }] : []),
    ...customKeys.map(name => ({ key: name, label: name, chips: categorySizes[name] ?? [] })),
  ];
  const activeTab = allTabs.find(t => t.key === sizeUnit) ?? allTabs[0];
  const enumUnit = toEnum(activeTab.key);

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "4px 14px", borderRadius: 6,
    borderWidth: "1.5px", borderStyle: "solid",
    borderColor: isActive ? "var(--primary)" : "var(--border)",
    fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer",
    transition: "all .15s",
    background: isActive ? "var(--primary)" : "#fff",
    color: isActive ? "#fff" : "var(--text2)",
  });

  const chipStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "5px 14px", borderRadius: 6,
    borderWidth: "1.5px", borderStyle: "solid",
    borderColor: isActive ? "var(--primary)" : "var(--border)",
    fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer",
    background: isActive ? "var(--primary)" : "#fff",
    color: isActive ? "#fff" : "var(--text2)",
    transition: "all .15s",
  });

  return (
    <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        سایزبندی و موجودی هر سایز
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {allTabs.map(tab => (
            <button key={tab.key} type="button" onClick={() => setSizeUnit(tab.key)} style={tabStyle(sizeUnit === tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "1rem 1.5rem" }}>
        {activeTab.chips.length > 0 ? (
          <>
            <p style={{ fontSize: 12, color: "var(--text3)", margin: "0 0 10px" }}>روی سایز کلیک کنید تا انتخاب شود:</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {activeTab.chips.map(lbl => {
                const active = sizes.some(s => s.label === lbl && toEnum(s.unit) === enumUnit);
                return (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => {
                      if (active) {
                        setSizes(prev => prev.filter(s => !(s.label === lbl && toEnum(s.unit) === enumUnit)));
                      } else {
                        setSizes(prev => [...prev, { label: lbl, unit: enumUnit, stock: 0 }]);
                      }
                    }}
                    style={chipStyle(active)}
                  >{lbl}</button>
                );
              })}
            </div>
          </>
        ) : (
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "0 0 16px" }}>هنوز سایزی برای این واحد تعریف نشده</p>
        )}

        {sizes.length > 0 && (
          <div>
            <p style={{ fontSize: 12, color: "var(--text3)", margin: "0 0 8px", fontWeight: 700 }}>موجودی هر سایز:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sizes.map((sz, i) => (
                <div key={`${sz.label}-${sz.unit}-${i}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ minWidth: 80, fontSize: 13, fontWeight: 900, color: "var(--text)" }}>
                    {sz.label}
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text3)", marginRight: 4 }}>
                      {ENUM_LABEL[sz.unit] ?? sz.unit}
                    </span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={sz.stock}
                    onChange={e => setSizes(prev => prev.map((s, j) => j === i ? { ...s, stock: Math.max(0, Number(e.target.value) || 0) } : s))}
                    style={{ ...inp, width: 90, textAlign: "center" }}
                    placeholder="موجودی"
                  />
                  <span style={{ fontSize: 11, color: sz.stock === 0 ? "#c0392b" : "#1a7a4a", fontWeight: 700 }}>
                    {sz.stock === 0 ? "ناموجود" : `${sz.stock} عدد`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSizes(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: "#fdecea", color: "#c0392b", border: "none", borderRadius: 5, width: 28, height: 28, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sizes.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", padding: "8px 0" }}>
            سایزی انتخاب نشده — اگر محصول سایز ندارد خالی بگذارید
          </p>
        )}
      </div>
    </div>
  );
}

interface Props {
  productId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const inp: React.CSSProperties = {
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13,
  color: "var(--text)", outline: "none", width: "100%", background: "#fff",
  boxSizing: "border-box",
};
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 };

export default function ProductForm({ productId, onSuccess, onCancel }: Props) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [stockQty, setStockQty] = useState("0");
  const [description, setDescription] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT" | "ARCHIVED">("DRAFT");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<PImage[]>([]);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);
  const [sizes, setSizes] = useState<PSize[]>([]);
  const [sizeUnit, setSizeUnit] = useState<string>("INCH");
  const [categorySizes, setCategorySizes] = useState<Record<string, string[]>>({});
  const [unit, setUnit] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Load categories + brands in parallel
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
    ]).then(([catData, brandData]) => {
      setCategories(catData.categories ?? []);
      setBrands(brandData.brands ?? []);
    });
  }, []);

  // Load size presets when category changes
  useEffect(() => {
    if (!categoryId) { setCategorySizes({}); return; }
    fetch(`/api/admin/categories/${categoryId}/sizes`)
      .then(r => r.json())
      .then(d => {
        const loaded = d.units ?? {};
        setCategorySizes(loaded);
        const keys = Object.keys(loaded);
        if (keys.length > 0) setSizeUnit(keys[0]);
      })
      .catch(() => {});
  }, [categoryId]);

  // Populate form when editing an existing product
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        const p = d.product;
        if (!p) return;
        setName(p.name ?? "");
        setSku(p.sku ?? "");
        setPrice(String(p.price ?? ""));
        setComparePrice(p.comparePrice ? String(p.comparePrice) : "");
        setStockQty(String(p.stockQty ?? 0));
        setDescription(p.description ?? "");
        setShortDesc(p.shortDesc ?? "");
        setCategoryId(p.categoryId ?? "");
        setBrandId(p.brandId ?? "");
        setStatus(p.status ?? "DRAFT");
        setIsFeatured(!!p.isFeatured);
        setIsNew(!!p.isNew);
        setTags((p.tags ?? []).join(", "));
        setImages((p.images ?? []).map((img: PImage, i: number) => ({ ...img, sortOrder: i })));
      })
      .then(() => {
        if (productId) {
          fetch(`/api/admin/products/${productId}/specs`).then(r => r.json()).then(d => {
            const allSpecs: { key: string; value: string }[] = d.specs ?? [];
            const unitSpec = allSpecs.find((s) => s.key === "__unit__");
            if (unitSpec) setUnit(unitSpec.value);
            setSpecs(allSpecs.filter((s) => s.key !== "__unit__").map((s) => ({ key: s.key, value: s.value })));
          });
          fetch(`/api/admin/products/${productId}/sizes`).then(r => r.json()).then(d => {
            const loaded: PSize[] = (d.sizes ?? []).map((s: { label: string; unit: string; stock: number }) => ({ label: s.label, unit: s.unit, stock: s.stock }));
            setSizes(loaded);
          });
        }
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const uploadFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "products");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          setImages((prev) => [
            ...prev,
            { url: data.url, isPrimary: prev.length === 0, sortOrder: prev.length },
          ]);
        } else {
          showToast("error", data.error ?? "خطا در آپلود تصویر");
        }
      }
    } finally {
      setUploading(false);
    }
  }, [showToast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, sortOrder: i }));
      if (prev[index]?.isPrimary && next.length > 0) next[0].isPrimary = true;
      return next;
    });
  };

  const makePrimary = (index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showToast("error", "نام محصول الزامی است"); return; }
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum < 0) { showToast("error", "قیمت معتبر وارد کنید"); return; }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim() || null,
        price: priceNum,
        comparePrice: comparePrice ? Number(comparePrice) : null,
        stockQty: Number(stockQty) || 0,
        description: description.trim() || null,
        shortDesc: shortDesc.trim() || null,
        categoryId: categoryId || null,
        brandId: brandId || null,
        status,
        isFeatured,
        isNew,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        images: images.map((img, i) => ({
          url: img.url,
          isPrimary: img.isPrimary,
          altText: img.altText,
          sortOrder: i,
        })),
      };

      const url = productId ? `/api/admin/products/${productId}` : "/api/admin/products";
      const method = productId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error ?? "خطا در ذخیره محصول");
        return;
      }

      const savedProductId = productId ?? data.product?.id;
      if (savedProductId) {
        const specsToSave = specs.filter((s) => s.key.trim() && s.value.trim());
        if (unit.trim()) specsToSave.push({ key: "__unit__", value: unit.trim() });
        await fetch(`/api/admin/products/${savedProductId}/specs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ specs: specsToSave }),
        });
        await fetch(`/api/admin/products/${savedProductId}/sizes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sizes }),
        });
      }

      showToast("success", productId ? "محصول با موفقیت ویرایش شد" : "محصول با موفقیت ذخیره شد");
      setTimeout(onSuccess, 1200);
    } catch {
      showToast("error", "خطای سرور. لطفاً دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "var(--text3)" }}>
        <i className="ti ti-loader-2" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
        در حال بارگذاری محصول...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ position: "relative" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? "#1a7a4a" : "#c0392b",
          color: "#fff", padding: "12px 28px", borderRadius: 10,
          fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700,
          zIndex: 9999, boxShadow: "0 6px 24px rgba(0,0,0,.25)",
          display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap",
        }}>
          <i className={`ti ${toast.type === "success" ? "ti-circle-check" : "ti-circle-x"}`} style={{ fontSize: 18 }} />
          {toast.msg}
        </div>
      )}

      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ background: "var(--bg)", color: "var(--text2)", border: "1px solid var(--border)", padding: "7px 14px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
        >
          <i className="ti ti-arrow-right" /> بازگشت
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)", margin: 0 }}>
          {productId ? "ویرایش محصول" : "افزودن محصول جدید"}
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" }}>
        {/* ─── Left column ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Basic info */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>اطلاعات اصلی</div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>نام محصول <span style={{ color: "#c0392b" }}>*</span></label>
                <input value={name} onChange={(e) => setName(e.target.value)} style={inp} placeholder="مثلاً: شیر توپی برنجی ۱ اینچ" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>برند</label>
                  <select value={brandId} onChange={(e) => setBrandId(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                    <option value="">-- انتخاب برند --</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>کد محصول (SKU)</label>
                  <input value={sku} onChange={(e) => setSku(e.target.value)} style={inp} placeholder="TB-V100" />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>توضیح کوتاه</label>
                  <input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} style={inp} placeholder="توضیح یک‌خطی برای نمایش در کارت محصول" />
                </div>
                <div style={{ flexShrink: 0, paddingTop: 20 }}>
                  <UnitPicker value={unit} onChange={setUnit} />
                </div>
              </div>
              <div>
                <label style={lbl}>توضیحات کامل</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} style={{ ...inp, resize: "vertical" }} placeholder="توضیحات فنی کامل محصول..." />
              </div>
              <div>
                <label style={lbl}>تگ‌ها <span style={{ color: "var(--text3)", fontWeight: 700 }}>(با کاما جدا کنید)</span></label>
                <input value={tags} onChange={(e) => setTags(e.target.value)} style={inp} placeholder="شیر، توپی، برنجی، ۱ اینچ" />
              </div>
            </div>
          </div>

          {/* Specs */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              مشخصات فنی
              <button type="button" onClick={() => setSpecs(s => [...s, { key: "", value: "" }])} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ افزودن ردیف</button>
            </div>
            <div style={{ padding: "1rem 1.5rem" }}>
              {specs.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--text3)", textAlign: "center" }}>ردیفی ندارد — روی «افزودن ردیف» کلیک کنید</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {specs.map((sp, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input value={sp.key} onChange={e => setSpecs(s => s.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} placeholder="مشخصه (مثال: جنس)" style={{ ...inp, flex: 1 }} />
                      <input value={sp.value} onChange={e => setSpecs(s => s.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="مقدار (مثال: برنجی)" style={{ ...inp, flex: 2 }} />
                      <button type="button" onClick={() => setSpecs(s => s.filter((_, j) => j !== i))} style={{ background: "#fdecea", color: "#c0392b", border: "none", borderRadius: 6, width: 32, height: 32, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sizes */}
          <SizeSection
            sizes={sizes}
            setSizes={setSizes}
            sizeUnit={sizeUnit}
            setSizeUnit={setSizeUnit}
            categorySizes={categorySizes}
            inp={inp}
          />

          {/* Images */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              تصاویر محصول
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>اول = تصویر اصلی | نگه‌داشتن ماوس روی تصویر: ⭐ اصلی / 🗑️ حذف</span>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)",
                  padding: "2rem",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragOver ? "rgba(10,42,94,.04)" : "transparent",
                  transition: "all .2s",
                  marginBottom: images.length > 0 ? "1rem" : 0,
                }}
              >
                <i className="ti ti-cloud-upload" style={{ fontSize: 36, color: dragOver ? "var(--primary)" : "var(--border)", display: "block", marginBottom: ".5rem", transition: "color .2s" }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", margin: 0 }}>
                  {uploading ? "در حال آپلود..." : "تصاویر را اینجا بکشید یا کلیک کنید"}
                </p>
                <p style={{ fontSize: 11, color: "var(--text3)", margin: "4px 0 0" }}>PNG، JPG، WebP — حداکثر ۵ مگابایت</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              />

              {images.length > 0 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {images.map((img, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        width: 90,
                        height: 90,
                        borderRadius: 8,
                        overflow: "hidden",
                        border: img.isPrimary ? "2.5px solid var(--primary)" : "2px solid var(--border)",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

                      {/* Hover overlay */}
                      <div
                        className="img-overlay"
                        style={{
                          position: "absolute", inset: 0,
                          background: "rgba(0,0,0,.55)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          gap: 6, opacity: 0, transition: "opacity .18s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                      >
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); makePrimary(i); }}
                          title="تنظیم به عنوان تصویر اصلی"
                          style={{ background: "rgba(255,255,255,.9)", border: "none", borderRadius: 4, padding: "4px 7px", cursor: "pointer", fontSize: 13, lineHeight: 1 }}
                        >⭐</button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                          title="حذف تصویر"
                          style={{ background: "rgba(255,255,255,.9)", border: "none", borderRadius: 4, padding: "4px 7px", cursor: "pointer", fontSize: 13, color: "#c0392b", lineHeight: 1 }}
                        >🗑️</button>
                      </div>

                      {img.isPrimary && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--primary)", color: "#fff", fontSize: 9, fontWeight: 900, textAlign: "center", padding: "2px 0" }}>
                          اصلی
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Right column ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Pricing */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>قیمت‌گذاری</div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={lbl}>قیمت (تومان) <span style={{ color: "#c0392b" }}>*</span></label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={inp} placeholder="0" min="0" />
              </div>
              <div>
                <label style={lbl}>قیمت قبل از تخفیف</label>
                <input type="number" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} style={inp} placeholder="0" min="0" />
                {comparePrice && Number(comparePrice) > 0 && Number(price) > 0 && (
                  <div style={{ fontSize: 11, color: "#1a7a4a", fontWeight: 700, marginTop: 4 }}>
                    تخفیف: {Math.round((1 - Number(price) / Number(comparePrice)) * 100)}٪
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stock */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>موجودی</div>
            <div style={{ padding: "1.5rem" }}>
              <label style={lbl}>تعداد موجودی</label>
              <input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} style={inp} min="0" />
              {Number(stockQty) === 0 && (
                <div style={{ fontSize: 11, color: "#c0392b", fontWeight: 700, marginTop: 4 }}>ناموجود</div>
              )}
              {Number(stockQty) > 0 && Number(stockQty) <= 5 && (
                <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginTop: 4 }}>موجودی کم — هشدار</div>
              )}
            </div>
          </div>

          {/* Category, Status, Flags */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>دسته‌بندی و وضعیت</div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={lbl}>دسته‌بندی</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">-- انتخاب دسته --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.parentId ? "  ↳ " : ""}{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>وضعیت انتشار</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} style={{ ...inp, cursor: "pointer" }}>
                  <option value="DRAFT">پیش‌نویس</option>
                  <option value="PUBLISHED">منتشر شده</option>
                  <option value="ARCHIVED">آرشیو</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 20, paddingTop: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "var(--text2)", cursor: "pointer" }}>
                  <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                  ویژه
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "var(--text2)", cursor: "pointer" }}>
                  <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                  جدید
                </label>
              </div>
            </div>
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={saving || uploading}
            style={{
              background: saving || uploading ? "#aaa" : "var(--primary)",
              color: "#fff", border: "none", padding: "13px",
              borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 900,
              fontFamily: "Vazirmatn", width: "100%",
              cursor: saving || uploading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background .2s",
            }}
          >
            {uploading ? (
              <><i className="ti ti-cloud-upload" /> در حال آپلود تصویر...</>
            ) : saving ? (
              <><i className="ti ti-loader-2" /> در حال ذخیره‌سازی...</>
            ) : (
              <><i className="ti ti-device-floppy" /> {productId ? "ذخیره تغییرات" : "ثبت محصول"}</>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
