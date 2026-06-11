"use client";

import { useState, useEffect } from "react";

interface TrashItem { id: string; deletedAt: string; [key: string]: string | number | null; }
interface TrashData {
  products: (TrashItem & { name: string; price: number })[];
  categories: (TrashItem & { name: string; slug: string })[];
  blogPosts: (TrashItem & { title: string; slug: string })[];
  orders: (TrashItem & { orderNumber: string; totalAmount: number })[];
}

type Toast = { msg: string; ok: boolean };

const ENTITY_LABELS: Record<string, string> = {
  product: "محصول",
  category: "دسته‌بندی",
  blogPost: "مقاله",
  order: "سفارش",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtPrice(n: number) {
  return n.toLocaleString("fa-IR") + " ت";
}

export default function TrashManager() {
  const [data, setData] = useState<TrashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = () => {
    setLoading(true);
    fetch("/api/admin/trash")
      .then((r) => r.json())
      .then((d) => {
        setData({
          products:   Array.isArray(d?.products)   ? d.products   : [],
          categories: Array.isArray(d?.categories) ? d.categories : [],
          blogPosts:  Array.isArray(d?.blogPosts)  ? d.blogPosts  : [],
          orders:     Array.isArray(d?.orders)     ? d.orders     : [],
        });
      })
      .catch(() => setData({ products: [], categories: [], blogPosts: [], orders: [] }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function restore(entity: string, id: string) {
    setActing(`${entity}:${id}`);
    const res = await fetch("/api/admin/trash", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, id }),
    });
    setActing(null);
    if (res.ok) { showToast("بازیابی شد"); load(); }
    else showToast("خطا در بازیابی", false);
  }

  async function permanentDelete(entity: string, id: string, name: string) {
    if (!confirm(`حذف دائمی "${name}"؟ این عمل برگشت‌پذیر نیست.`)) return;
    setActing(`${entity}:${id}`);
    const res = await fetch("/api/admin/trash", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, id }),
    });
    setActing(null);
    if (res.ok) { showToast("حذف دائمی انجام شد"); load(); }
    else showToast("خطا در حذف دائمی", false);
  }

  const totalCount = data
    ? (data.products?.length ?? 0) + (data.categories?.length ?? 0) + (data.blogPosts?.length ?? 0) + (data.orders?.length ?? 0)
    : 0;

  type Section = { entity: string; items: { id: string; label: string; sub: string; deletedAt: string }[] };
  const sections: Section[] = data ? [
    { entity: "product",  items: (data.products  ?? []).map((p) => ({ id: p.id, label: p.name,        sub: fmtPrice(p.price),       deletedAt: p.deletedAt })) },
    { entity: "category", items: (data.categories ?? []).map((c) => ({ id: c.id, label: c.name,        sub: c.slug,                   deletedAt: c.deletedAt })) },
    { entity: "blogPost", items: (data.blogPosts  ?? []).map((b) => ({ id: b.id, label: b.title,       sub: b.slug,                   deletedAt: b.deletedAt })) },
    { entity: "order",    items: (data.orders     ?? []).map((o) => ({ id: o.id, label: o.orderNumber, sub: fmtPrice(o.totalAmount),  deletedAt: o.deletedAt })) },
  ].filter((s) => s.items.length > 0) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>سطل زباله</h2>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>{totalCount} آیتم حذف‌شده</p>
        </div>
        <button onClick={load} style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 14px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <i className="ti ti-refresh" /> بروزرسانی
        </button>
      </div>

      <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "var(--radius-sm)", padding: "12px 16px", fontSize: 12, color: "#92400e" }}>
        <i className="ti ti-alert-triangle" style={{ marginLeft: 6 }} />
        آیتم‌های حذف‌شده ۳۰ روز در سطل زباله نگه‌داری می‌شوند. پس از آن به‌صورت خودکار حذف دائمی می‌شوند.
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
          <i className="ti ti-loader-2" style={{ fontSize: 36, display: "block", marginBottom: 8 }} />در حال بارگذاری...
        </div>
      ) : sections.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "3rem", textAlign: "center", color: "var(--text3)" }}>
          <i className="ti ti-trash-off" style={{ fontSize: 48, display: "block", marginBottom: 10 }} />
          <div style={{ fontSize: 15, fontWeight: 700 }}>سطل زباله خالی است</div>
        </div>
      ) : (
        sections.map((section) => (
          <div key={section.entity} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", background: "var(--bg)", borderBottom: "1.5px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-trash" style={{ color: "var(--accent)", fontSize: 16 }} />
              <strong style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>{ENTITY_LABELS[section.entity]} ({section.items.length})</strong>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--bg2)" }}>
                  {["نام", "اطلاعات", "تاریخ حذف", "عملیات"].map((h) => (
                    <th key={h} style={{ textAlign: "right", padding: "10px 16px", fontWeight: 900, color: "var(--text3)", fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.items.map((item) => {
                  const key = `${section.entity}:${item.id}`;
                  const isActing = acting === key;
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--bg)" }}>
                      <td style={{ padding: "10px 16px", fontWeight: 700, color: "var(--text)" }}>{item.label}</td>
                      <td style={{ padding: "10px 16px", color: "var(--text3)", fontSize: 12 }}>{item.sub}</td>
                      <td style={{ padding: "10px 16px", color: "var(--text3)", fontSize: 12 }}>{fmtDate(item.deletedAt)}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => restore(section.entity, item.id)}
                            disabled={isActing}
                            style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: isActing ? "not-allowed" : "pointer", fontFamily: "Vazirmatn", color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <i className="ti ti-restore" /> بازیابی
                          </button>
                          <button
                            onClick={() => permanentDelete(section.entity, item.id, item.label)}
                            disabled={isActing}
                            style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: isActing ? "not-allowed" : "pointer", fontFamily: "Vazirmatn", color: "#dc2626", display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <i className="ti ti-trash" /> حذف دائمی
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
