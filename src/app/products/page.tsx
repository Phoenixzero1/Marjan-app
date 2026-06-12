"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";

interface Product {
  id: string; name: string; slug: string; price: number; comparePrice: number | null;
  brand: { name: string } | null; images: { url: string; isPrimary: boolean }[];
  sizes: { id: string; label: string; price: number | null; unit: string }[];
  isNew: boolean; isFeatured: boolean; stockQty: number;
}

interface Filters {
  q: string; sort: string; minPrice: string; maxPrice: string;
}

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "پرفروش‌ترین" },
  { value: "price_asc",      label: "ارزان‌ترین" },
  { value: "price_desc",     label: "گران‌ترین" },
  { value: "createdAt_asc",  label: "جدیدترین" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({ q: "", sort: "createdAt_desc", minPrice: "", maxPrice: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const load = useCallback(async (p: number, f: Filters) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "12", sort: f.sort });
    if (f.q) params.set("q", f.q);
    if (f.minPrice) params.set("minPrice", f.minPrice);
    if (f.maxPrice) params.set("maxPrice", f.maxPrice);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.pagination?.total ?? 0);
    setPages(data.pagination?.pages ?? 1);
    setLoading(false);
  }, []);

  useEffect(() => { load(page, filters); }, [page, filters, load]);

  function applyFilters() {
    setPage(1);
    load(1, filters);
    setFilterOpen(false);
  }

  const filterBody = (
    <>
      <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1.25rem" }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: ".75rem" }}>جستجو</div>
        <input
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          placeholder="نام محصول..."
          style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, color: "var(--text)", outline: "none", width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1.25rem" }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: ".75rem" }}>محدوده قیمت</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            placeholder="از"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            style={{ flex: 1, padding: "7px 10px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", fontFamily: "Vazirmatn", fontSize: 13, color: "var(--text)", outline: "none", minWidth: 0 }}
          />
          <span>—</span>
          <input
            type="number"
            placeholder="تا"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            style={{ flex: 1, padding: "7px 10px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", fontFamily: "Vazirmatn", fontSize: 13, color: "var(--text)", outline: "none", minWidth: 0 }}
          />
        </div>
      </div>
      <button
        onClick={applyFilters}
        style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "11px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", width: "100%", cursor: "pointer", minHeight: 44 }}
      >
        اعمال فیلتر
      </button>
    </>
  );

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1280, margin: "auto", padding: ".75rem 1rem", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          <Link href="/" style={{ color: "var(--primary)" }}>خانه</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <span>همه محصولات</span>
        </div>
      </div>

      {/* Page hero */}
      <div style={{ background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: 1280, margin: "auto" }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 6 }}>همه محصولات</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)" }}>بیش از ۱۲,۰۰۰ کالا از برترین برندها</p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "2rem auto", padding: "0 1rem" }}>
        {/* Desktop layout: sidebar + products grid */}
        <div className="grid products-layout" style={{ gap: "1.5rem", alignItems: "start" }}>

          {/* Sidebar — hidden on mobile, shown on md+ */}
          <aside className="hidden md:block" style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", position: "sticky", top: 112 }}>
            {filterBody}
          </aside>

          {/* Products column */}
          <div>
            {/* Toolbar */}
            <div style={{ background: "#fff", borderRadius: "var(--radius)", padding: "1rem 1.25rem", boxShadow: "var(--shadow)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Filter toggle — mobile only */}
                <button
                  className="md:hidden"
                  onClick={() => setFilterOpen(true)}
                  style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", display: "flex", alignItems: "center", gap: 6, minHeight: 40, cursor: "pointer" }}
                >
                  <i className="ti ti-adjustments" /> فیلتر
                </button>
                <div style={{ fontSize: 13, color: "var(--text2)", fontWeight: 700 }}>
                  {filters.q ? (
                    <>
                      <span style={{ color: "var(--primary)", fontWeight: 900 }}>{total.toLocaleString("fa")}</span>
                      {" نتیجه برای "}
                      <strong style={{ color: "var(--text)" }}>&laquo;{filters.q}&raquo;</strong>
                    </>
                  ) : (
                    <><span style={{ color: "var(--primary)", fontWeight: 900 }}>{total.toLocaleString("fa")}</span> محصول</>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                  style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontFamily: "Vazirmatn", fontSize: 13, color: "var(--text)", outline: "none", minHeight: 40 }}
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {/* Grid / List toggle */}
                <div style={{ display: "flex", gap: 4 }}>
                  {(["grid", "list"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m)}
                      title={m === "grid" ? "نمایش شبکه‌ای" : "نمایش لیستی"}
                      style={{
                        width: 36, height: 36, border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
                        background: viewMode === m ? "var(--primary)" : "#fff",
                        color: viewMode === m ? "#fff" : "var(--text3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", fontSize: 16, transition: "all .15s",
                      }}
                    >
                      <i className={m === "grid" ? "ti ti-layout-grid" : "ti ti-list"} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product grid */}
            {loading ? (
              /* 1 col mobile, 2 cols sm, 3 cols lg */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: "var(--radius)", height: 280, boxShadow: "var(--shadow)", animation: "pulse 2s infinite" }} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "4rem 2rem", textAlign: "center" }}>
                <i className="ti ti-search-off" style={{ fontSize: 64, color: "var(--border)", display: "block", marginBottom: 16 }} />
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>نتیجه‌ای یافت نشد</h3>
                <p style={{ fontSize: 14, color: "var(--text3)", marginBottom: 20 }}>
                  {filters.q ? `جستجوی دیگری امتحان کنید یا فیلترها را کم کنید` : "محصولی با این مشخصات یافت نشد"}
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => { setFilters({ q: "", sort: "createdAt_desc", minPrice: "", maxPrice: "" }); setPage(1); }}
                    style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer" }}
                  >
                    پاک کردن فیلترها
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "flex flex-col gap-4"}>
                  {products.map((p) => (
                    <ProductCard key={p.id} {...p} />
                  ))}
                </div>
                {/* Pagination */}
                {pages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: "2rem", flexWrap: "wrap" }}>
                    {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => { setPage(pg); window.scrollTo(0, 0); }}
                        style={{
                          width: 44, height: 44,
                          background: pg === page ? "var(--primary)" : "#fff",
                          border: `1.5px solid ${pg === page ? "var(--primary)" : "var(--border)"}`,
                          borderRadius: "var(--radius-sm)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 900,
                          color: pg === page ? "#fff" : "var(--text2)",
                          cursor: "pointer", fontFamily: "Vazirmatn",
                        }}
                      >
                        {pg}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter overlay */}
      <div className={`filter-overlay ${filterOpen ? "open" : ""}`} onClick={() => setFilterOpen(false)} />

      {/* Mobile filter drawer */}
      <div className={`filter-drawer ${filterOpen ? "open" : ""}`}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)" }}>فیلترها</h3>
          <button onClick={() => setFilterOpen(false)} style={{ background: "transparent", border: "none", fontSize: 22, color: "var(--text2)", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-x" />
          </button>
        </div>
        {filterBody}
      </div>
    </>
  );
}
