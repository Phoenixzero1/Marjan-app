"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface ProductRow {
  id: string; name: string; sku: string | null; price: number;
  stockQty: number; status: string;
  category: { name: string } | null;
  brand: { name: string } | null;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    fetch("/api/admin/products")
      .then(r => r.text())
      .then(t => { try { const d = t ? JSON.parse(t) : {}; if (Array.isArray(d.products)) setProducts(d.products); } catch { /* ignore */ } })
      .catch(() => {});
  }, []);

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!window.confirm(`آیا از حذف "${name}" مطمئن هستید؟\nاین عملیات برگشت‌پذیر نیست.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در حذف محصول"); return; }
      showToast("success", `"${name}" با موفقیت حذف شد`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch { showToast("error", "خطای سرور"); }
    finally { setDeletingId(null); }
  }, [showToast]);

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? "#1a7a4a" : "#c0392b", color: "#fff", padding: "12px 28px", borderRadius: 10, fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, zIndex: 9999, boxShadow: "0 6px 24px rgba(0,0,0,.25)", display: "flex", alignItems: "center", gap: 10 }}>
          <i className={`ti ${toast.type === "success" ? "ti-circle-check" : "ti-circle-x"}`} style={{ fontSize: 18 }} />
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <i className="ti ti-search" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--text3)", pointerEvents: "none" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="جستجو نام محصول..."
            style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px 9px 34px", fontFamily: "Vazirmatn", fontSize: 13, color: "var(--text)", outline: "none", width: 260, background: "#fff" }}
          />
        </div>
        <button onClick={() => router.push("/admin/products/new")}
          style={{ marginRight: "auto", background: "var(--primary)", color: "#fff", border: "none", padding: "9px 18px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-plus" /> محصول جدید
        </button>
        <button style={{ background: "#fff", color: "var(--text2)", border: "1.5px solid var(--border)", padding: "9px 16px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <i className="ti ti-file-export" /> خروجی
        </button>
      </div>

      <div className="admin-card" style={{ overflow: "hidden", padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["", "محصول", "دسته‌بندی", "برند", "قیمت", "موجودی", "وضعیت", "عملیات"].map(h => (
                <th key={h} style={{ background: "var(--bg)", padding: "10px 12px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 12px" }}><input type="checkbox" /></td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontWeight: 900 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{p.sku}</div>
                </td>
                <td style={{ padding: "10px 12px" }}>{p.category?.name ?? "—"}</td>
                <td style={{ padding: "10px 12px" }}>{p.brand?.name ?? "—"}</td>
                <td style={{ padding: "10px 12px", fontWeight: 900 }}>{formatPrice(p.price)}</td>
                <td style={{ padding: "10px 12px" }}>{p.stockQty}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span className={p.status === "PUBLISHED" ? "pill-green" : p.status === "DRAFT" ? "pill-orange" : "pill-gray"}
                    style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>
                    {p.status === "PUBLISHED" ? "منتشر" : p.status === "DRAFT" ? "پیش‌نویس" : "آرشیو"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: 4 }}>
                  <button onClick={() => router.push(`/admin/products/${p.id}/edit`)}
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "Vazirmatn", color: "var(--text2)" }}>
                    <i className="ti ti-edit" /> ویرایش
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} disabled={deletingId === p.id}
                    style={{ background: "#fdecea", border: "1px solid #f5c6cb", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: deletingId === p.id ? "not-allowed" : "pointer", fontFamily: "Vazirmatn", color: "#c0392b", opacity: deletingId === p.id ? .6 : 1 }}>
                    <i className="ti ti-trash" /> {deletingId === p.id ? "حذف..." : "حذف"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
                {search ? `محصولی با نام "${search}" یافت نشد` : "محصولی یافت نشد"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
