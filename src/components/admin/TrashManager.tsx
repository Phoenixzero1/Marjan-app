"use client";

import { useState, useEffect } from "react";
import {
  AdminPageHeader, AdminBtn, AdminTable, AdminTh, AdminTd, AdminTr,
  AdminEmptyState, AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

interface TrashItem { id: string; deletedAt: string; [key: string]: string | number | null; }
interface TrashData {
  products: (TrashItem & { name: string; price: number })[];
  categories: (TrashItem & { name: string; slug: string })[];
  blogPosts: (TrashItem & { title: string; slug: string })[];
  orders: (TrashItem & { orderNumber: string; totalAmount: number })[];
}

const ENTITY_LABELS: Record<string, string> = { product: "محصول", category: "دسته‌بندی", blogPost: "مقاله", order: "سفارش" };

function fmtDate(s: string) { return new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
function fmtPrice(n: number) { return n.toLocaleString("fa-IR") + " ت"; }

export default function TrashManager() {
  const { toast, showToast } = useAdminToast();
  const [data, setData] = useState<TrashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/trash").then(r => r.json()).then(d => {
      setData({
        products:   Array.isArray(d?.products)   ? d.products   : [],
        categories: Array.isArray(d?.categories) ? d.categories : [],
        blogPosts:  Array.isArray(d?.blogPosts)  ? d.blogPosts  : [],
        orders:     Array.isArray(d?.orders)     ? d.orders     : [],
      });
    }).catch(() => setData({ products: [], categories: [], blogPosts: [], orders: [] })).finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function restore(entity: string, id: string) {
    setActing(`${entity}:${id}`);
    const res = await fetch("/api/admin/trash", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entity, id }) });
    setActing(null);
    if (res.ok) { showToast("success", "بازیابی شد"); load(); }
    else showToast("error", "خطا در بازیابی");
  }

  async function permanentDelete(entity: string, id: string, name: string) {
    if (!confirm(`حذف دائمی "${name}"؟ این عمل برگشت‌پذیر نیست.`)) return;
    setActing(`${entity}:${id}`);
    const res = await fetch("/api/admin/trash", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entity, id }) });
    setActing(null);
    if (res.ok) { showToast("success", "حذف دائمی انجام شد"); load(); }
    else showToast("error", "خطا در حذف دائمی");
  }

  const totalCount = data
    ? (data.products?.length ?? 0) + (data.categories?.length ?? 0) + (data.blogPosts?.length ?? 0) + (data.orders?.length ?? 0)
    : 0;

  type Section = { entity: string; items: { id: string; label: string; sub: string; deletedAt: string }[] };
  const sections: Section[] = data ? [
    { entity: "product",  items: (data.products ?? []).map(p => ({ id: p.id, label: p.name, sub: fmtPrice(p.price), deletedAt: p.deletedAt })) },
    { entity: "category", items: (data.categories ?? []).map(c => ({ id: c.id, label: c.name, sub: c.slug, deletedAt: c.deletedAt })) },
    { entity: "blogPost", items: (data.blogPosts ?? []).map(b => ({ id: b.id, label: b.title, sub: b.slug, deletedAt: b.deletedAt })) },
    { entity: "order",    items: (data.orders ?? []).map(o => ({ id: o.id, label: o.orderNumber, sub: fmtPrice(o.totalAmount), deletedAt: o.deletedAt })) },
  ].filter(s => s.items.length > 0) : [];

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="سطل زباله" icon="ti-trash" count={totalCount} subtitle={`${totalCount} آیتم حذف‌شده`}
        actions={<AdminBtn icon="ti-refresh" onClick={load}>بروزرسانی</AdminBtn>}
      />

      <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#92400e", marginBottom: 16 }}>
        <i className="ti ti-alert-triangle" style={{ marginLeft: 6 }} />
        آیتم‌های حذف‌شده ۳۰ روز در سطل زباله نگه‌داری می‌شوند. پس از آن به‌صورت خودکار حذف دائمی می‌شوند.
      </div>

      {loading && <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />}
      {!loading && sections.length === 0 && <AdminEmptyState icon="ti-trash-off" title="سطل زباله خالی است" />}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {sections.map(section => (
          <div key={section.entity} style={{ background: "#fff", borderRadius: 10, border: "1.5px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", background: "var(--bg)", borderBottom: "1.5px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-trash" style={{ color: "var(--accent)", fontSize: 16 }} />
              <strong style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>{ENTITY_LABELS[section.entity]} ({section.items.length})</strong>
            </div>
            <AdminTable>
              <thead>
                <tr>
                  <AdminTh>نام</AdminTh>
                  <AdminTh>اطلاعات</AdminTh>
                  <AdminTh>تاریخ حذف</AdminTh>
                  <AdminTh>عملیات</AdminTh>
                </tr>
              </thead>
              <tbody>
                {section.items.map(item => {
                  const key = `${section.entity}:${item.id}`;
                  const isActing = acting === key;
                  return (
                    <AdminTr key={item.id}>
                      <AdminTd style={{ fontWeight: 700 }}>{item.label}</AdminTd>
                      <AdminTd style={{ color: "var(--text3)", fontSize: 12 }}>{item.sub}</AdminTd>
                      <AdminTd style={{ color: "var(--text3)", fontSize: 12 }}>{fmtDate(item.deletedAt)}</AdminTd>
                      <AdminTd>
                        <div style={{ display: "flex", gap: 6 }}>
                          <AdminBtn size="sm" icon="ti-restore" loading={isActing} onClick={() => restore(section.entity, item.id)}>بازیابی</AdminBtn>
                          <AdminBtn size="sm" icon="ti-trash" variant="danger" loading={isActing} onClick={() => permanentDelete(section.entity, item.id, item.label)}>حذف دائمی</AdminBtn>
                        </div>
                      </AdminTd>
                    </AdminTr>
                  );
                })}
              </tbody>
            </AdminTable>
          </div>
        ))}
      </div>
    </div>
  );
}
