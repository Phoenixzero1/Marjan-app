"use client";

import { useState, useEffect, useCallback } from "react";
import DateTimePicker from "@/components/ui/DateTimePicker";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  sku: string | null;
  images: { url: string; isPrimary: boolean }[];
  category: { name: string } | null;
}

interface FlashConfig {
  isActive: boolean;
  title: string;
  endTime: string | null;
  productIds: string[];
  discountPct: number;
}

const DEFAULT_CONFIG: FlashConfig = {
  isActive: false,
  title: "مرجان تایم",
  endTime: null,
  productIds: [],
  discountPct: 20,
};

export default function FlashDealManager() {
  const [config, setConfig] = useState<FlashConfig>(DEFAULT_CONFIG);
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductRow[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const safeJson = async (r: Response) => {
    const text = await r.text();
    try { return JSON.parse(text); } catch { return null; }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/flash-deal").then(safeJson),
      fetch("/api/admin/products?page=1&limit=200&status=PUBLISHED").then(safeJson),
    ]).then(([cfg, prods]) => {
      const c: FlashConfig = cfg ?? DEFAULT_CONFIG;
      const ps: ProductRow[] = prods?.products ?? [];
      setConfig(c);
      setAllProducts(ps);
      setSelectedProducts(ps.filter((p) => c.productIds?.includes(p.id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const q = search.toLowerCase();
    setSearchResults(
      allProducts
        .filter((p) => !config.productIds.includes(p.id))
        .filter((p) => p.name.toLowerCase().includes(q) || (p.sku?.toLowerCase().includes(q) ?? false))
        .slice(0, 8),
    );
  }, [search, allProducts, config.productIds]);

  const addProduct = useCallback((p: ProductRow) => {
    setConfig((prev) => ({ ...prev, productIds: [...prev.productIds, p.id] }));
    setSelectedProducts((prev) => [...prev, p]);
    setSearch("");
    setSearchResults([]);
  }, []);

  const removeProduct = useCallback((id: string) => {
    setConfig((prev) => ({ ...prev, productIds: prev.productIds.filter((x) => x !== id) }));
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/flash-deal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (r.ok) showToast("success", "تنظیمات ذخیره شد");
      else showToast("error", "خطا در ذخیره‌سازی");
    } catch {
      showToast("error", "خطا در ارتباط با سرور");
    }
    setSaving(false);
  };

  const toLocalDatetime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>
        <i className="ti ti-loader-2" style={{ fontSize: 36, display: "block", marginBottom: 12 }} />
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.type === "success" ? "#1a7a4a" : "#c0392b",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: 10,
            fontFamily: "Vazirmatn",
            fontSize: 14,
            fontWeight: 700,
            zIndex: 9999,
            boxShadow: "0 6px 24px rgba(0,0,0,.25)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <i className={`ti ${toast.type === "success" ? "ti-circle-check" : "ti-circle-x"}`} />
          {toast.msg}
        </div>
      )}

      {/* Settings Card */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem" }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 900,
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--primary)",
          }}
        >
          <i className="ti ti-clock-bolt" style={{ color: "var(--accent)" }} />
          تنظیمات مرجان تایم
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          {/* Title */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "var(--text2)" }}>
              عنوان بخش
            </label>
            <input
              value={config.title}
              onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                fontSize: 13,
                fontFamily: "Vazirmatn",
                outline: "none",
              }}
            />
          </div>

          {/* Discount */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "var(--text2)" }}>
              درصد تخفیف (٪)
            </label>
            <input
              type="number"
              min={0}
              max={90}
              value={config.discountPct}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, discountPct: Math.max(0, Math.min(90, parseInt(e.target.value) || 0)) }))
              }
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                fontSize: 13,
                fontFamily: "Vazirmatn",
                outline: "none",
              }}
            />
          </div>

          {/* End time */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "var(--text2)" }}>
              تاریخ و زمان پایان
            </label>
            <DateTimePicker
              value={config.endTime}
              onChange={(val) => setConfig((prev) => ({ ...prev, endTime: val }))}
            />
          </div>

          {/* Active toggle */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <label
              style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "var(--text2)" }}
            >
              وضعیت
            </label>
            <div
              onClick={() => setConfig((prev) => ({ ...prev, isActive: !prev.isActive }))}
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            >
              <div
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: config.isActive ? "var(--accent)" : "var(--border)",
                  position: "relative",
                  transition: "background .2s",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    right: config.isActive ? 2 : 20,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "right .2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                  }}
                />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: config.isActive ? "var(--accent)" : "var(--text3)" }}>
                {config.isActive ? "فعال" : "غیرفعال"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem" }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 900,
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--primary)",
          }}
        >
          <i className="ti ti-package" style={{ color: "var(--primary)" }} />
          محصولات فلش فروش
          <span
            style={{
              marginRight: "auto",
              background: "var(--bg)",
              color: "var(--text3)",
              fontSize: 12,
              fontWeight: 700,
              padding: "2px 10px",
              borderRadius: 20,
            }}
          >
            {selectedProducts.length} محصول
          </span>
        </h3>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "1.25rem" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی محصول برای افزودن..."
            style={{
              width: "100%",
              padding: "10px 42px 10px 12px",
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              fontSize: 13,
              fontFamily: "Vazirmatn",
              outline: "none",
            }}
          />
          <i
            className="ti ti-search"
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text3)",
              fontSize: 16,
            }}
          />
          {searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                left: 0,
                background: "#fff",
                border: "1.5px solid var(--border)",
                borderRadius: 8,
                zIndex: 100,
                maxHeight: 300,
                overflowY: "auto",
                boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                marginTop: 4,
              }}
            >
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addProduct(p)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    borderBottom: "1px solid var(--border)",
                    transition: "background .12s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      background: "var(--bg2)",
                      flexShrink: 0,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <i className="ti ti-package" style={{ color: "var(--border)", fontSize: 16 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>
                      {p.price.toLocaleString("fa-IR")} تومان
                      {p.category && ` · ${p.category.name}`}
                    </div>
                  </div>
                  <i className="ti ti-plus" style={{ color: "var(--primary)", fontSize: 16, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected list */}
        {selectedProducts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2.5rem 1rem",
              color: "var(--text3)",
              background: "var(--bg)",
              borderRadius: 8,
            }}
          >
            <i className="ti ti-package-off" style={{ fontSize: 36, display: "block", marginBottom: 8 }} />
            <p style={{ fontSize: 13 }}>هیچ محصولی انتخاب نشده. از جستجوی بالا اضافه کنید.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selectedProducts.map((p) => {
              const flashPrice = Math.round(p.price * (1 - config.discountPct / 100));
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 6,
                      background: "#fff",
                      flexShrink: 0,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <i className="ti ti-package" style={{ color: "var(--border)", fontSize: 18 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", display: "flex", gap: 8, marginTop: 2 }}>
                      <span style={{ textDecoration: "line-through" }}>
                        {p.price.toLocaleString("fa-IR")}
                      </span>
                      <span style={{ color: "var(--accent)", fontWeight: 900 }}>
                        {flashPrice.toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeProduct(p.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#c0392b",
                      cursor: "pointer",
                      padding: "6px 8px",
                      borderRadius: 6,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                    title="حذف"
                  >
                    <i className="ti ti-trash" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 28px",
            fontSize: 14,
            fontWeight: 900,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "Vazirmatn",
            transition: "opacity .2s",
          }}
        >
          <i className={`ti ${saving ? "ti-loader-2" : "ti-device-floppy"}`} />
          {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
        </button>
      </div>
    </div>
  );
}
