"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  children: { id: string; name: string; slug: string }[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stockQty: number;
  isNew: boolean;
  images: { url: string; isPrimary: boolean }[];
  brand: { name: string; slug: string } | null;
  sizes: { id: string; label: string; unit: string; price: number | null; stock: number }[];
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
}

function CategoryPageContent() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState(searchParams.get("sort") ?? "createdAt_desc");
  const [page, setPage] = useState(parseInt(searchParams.get("page") ?? "1"));

  const fetchCategory = useCallback(async () => {
    const res = await fetch(`/api/categories?slug=${slug}`);
    if (res.ok) {
      const data = await res.json();
      setCategory(data.category ?? null);
      return data.category?.id as string | undefined;
    }
  }, [slug]);

  const fetchProducts = useCallback(
    async (categoryId: string) => {
      setLoading(true);
      const params = new URLSearchParams({
        categoryId,
        sort,
        page: String(page),
        limit: "12",
      });
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
        setPagination(data.pagination ?? { total: 0, page: 1, pages: 1 });
      }
      setLoading(false);
    },
    [sort, page]
  );

  useEffect(() => {
    fetchCategory().then((id) => {
      if (id) fetchProducts(id);
      else setLoading(false);
    });
  }, [fetchCategory, fetchProducts]);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) params.set(k, v);
    router.push(`/category/${slug}?${params.toString()}`);
  }

  if (!category && !loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "Vazirmatn" }}>
        <i className="ti ti-folder-off" style={{ fontSize: 56, color: "var(--text3)" }} />
        <h2 style={{ fontSize: 20, fontWeight: 900 }}>دسته‌بندی یافت نشد</h2>
        <Link href="/products" style={{ color: "var(--primary)", fontWeight: 700 }}>مشاهده همه محصولات</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "Vazirmatn" }}>
      {/* Breadcrumb */}
      <nav style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "var(--text3)", marginBottom: 20, flexWrap: "wrap" }}>
        <Link href="/" style={{ color: "var(--text3)", textDecoration: "none" }}>خانه</Link>
        <i className="ti ti-chevron-left" style={{ fontSize: 11 }} />
        <Link href="/products" style={{ color: "var(--text3)", textDecoration: "none" }}>محصولات</Link>
        <i className="ti ti-chevron-left" style={{ fontSize: 11 }} />
        <span style={{ color: "var(--text2)", fontWeight: 700 }}>{category?.name ?? "..."}</span>
      </nav>

      {/* Category Header */}
      <div style={{ background: "var(--primary)", borderRadius: "var(--radius)", padding: "1.5rem 2rem", marginBottom: 28, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ color: "#fff" }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>{category?.name}</h1>
          {category?.description && (
            <p style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.7 }}>{category.description}</p>
          )}
        </div>
      </div>

      {/* Sub-categories */}
      {(category?.children?.length ?? 0) > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          {category!.children.map((ch) => (
            <Link
              key={ch.id}
              href={`/category/${ch.slug}`}
              style={{
                padding: "7px 18px",
                border: "1.5px solid var(--primary)",
                borderRadius: 24,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--primary)",
                textDecoration: "none",
                background: "#fff",
              }}
            >
              {ch.name}
            </Link>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 700 }}>
          {pagination.total.toLocaleString("fa-IR")} محصول
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 700 }}>مرتب‌سازی:</label>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); updateParams({ sort: e.target.value, page: "1" }); }}
            style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 10px", fontSize: 13, fontFamily: "Vazirmatn", background: "#fff", color: "var(--text)" }}
          >
            <option value="createdAt_desc">جدیدترین</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
            <option value="saleCount_desc">پرفروش‌ترین</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius)", height: 300, background: "var(--bg)", animation: "pulse 2s infinite" }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <i className="ti ti-package-off" style={{ fontSize: 56, color: "var(--border)" }} />
          <p style={{ fontSize: 15, color: "var(--text2)", fontWeight: 700, marginTop: 12 }}>
            محصولی در این دسته‌بندی یافت نشد
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {products.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 32, flexWrap: "wrap" }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => { setPage(p); updateParams({ page: String(p) }); }}
              style={{
                width: 36, height: 36, border: `1.5px solid ${p === page ? "var(--primary)" : "var(--border)"}`,
                borderRadius: "var(--radius-sm)", background: p === page ? "var(--primary)" : "#fff",
                color: p === page ? "#fff" : "var(--text)", fontSize: 13, fontWeight: 700,
                fontFamily: "Vazirmatn", cursor: "pointer",
              }}
            >
              {p.toLocaleString("fa-IR")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <CategoryPageContent />
    </Suspense>
  );
}
