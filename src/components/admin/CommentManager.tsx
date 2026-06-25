"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminToolbar, AdminSearch, AdminSelect, AdminBtn, AdminBadge,
  AdminEmptyState, AdminAvatar, AdminPagination, AdminTabs,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

interface Review {
  id: string; rating: number; title: string | null; content: string | null;
  isApproved: boolean; createdAt: string;
  product: { id: string; name: string; slug: string };
  user: { firstName: string; lastName: string; email: string | null };
}

interface BlogComment {
  id: string; authorName: string; authorEmail: string | null; content: string;
  isApproved: boolean; createdAt: string;
  post: { id: string; title: string; slug: string };
}

type Tab = "reviews" | "blog";

function Stars({ n }: { n: number }) {
  return <span>{[1, 2, 3, 4, 5].map(i => <i key={i} className={`ti ${i <= n ? "ti-star-filled" : "ti-star"}`} style={{ fontSize: 13, color: i <= n ? "#f59e0b" : "#d1d5db" }} />)}</span>;
}

const isReview = (it: Review | BlogComment): it is Review => "rating" in it;

export default function CommentManager() {
  const { toast, showToast } = useAdminToast();
  const [tab, setTab] = useState<Tab>("reviews");
  const [items, setItems] = useState<(Review | BlogComment)[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [approvedFilter, setApprovedFilter] = useState("");
  const [q, setQ] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab, page: String(pg) });
      if (approvedFilter) params.set("approved", approvedFilter);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/comments?${params}`);
      const data = await res.json();
      setItems(data.items ?? []); setTotal(data.total ?? 0); setPages(data.pages ?? 1); setPage(pg); setPendingCount(data.pendingCount ?? 0);
    } finally { setLoading(false); }
  }, [tab, approvedFilter, q]);

  useEffect(() => { load(1); }, [load]);

  async function handleApprove(id: string, approve: boolean) {
    setActing(id);
    try {
      const res = await fetch("/api/admin/comments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, tab, isApproved: approve }) });
      if (!res.ok) { showToast("error", "خطا در بروزرسانی"); return; }
      showToast("success", approve ? "تایید شد" : "رد شد");
      setItems(prev => prev.map(it => it.id === id ? { ...it, isApproved: approve } : it) as (Review | BlogComment)[]);
      setPendingCount(prev => approve ? Math.max(0, prev - 1) : prev + 1);
    } finally { setActing(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm("این نظر حذف شود؟")) return;
    setActing(id);
    try {
      const res = await fetch("/api/admin/comments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, tab }) });
      if (!res.ok) { showToast("error", "خطا در حذف"); return; }
      showToast("success", "نظر حذف شد"); load(page);
    } finally { setActing(null); }
  }

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="نظرات و دیدگاه‌ها" icon="ti-message-circle" count={total}
        subtitle={pendingCount > 0 ? `${pendingCount} نظر در انتظار تایید` : "همه نظرات بررسی شده‌اند"}
        actions={<AdminBtn icon="ti-refresh" onClick={() => load(page)}>بروزرسانی</AdminBtn>}
      />

      <div style={{ marginBottom: 14 }}>
        <AdminTabs
          active={tab}
          onChange={v => { setTab(v as Tab); setApprovedFilter(""); setQ(""); }}
          tabs={[{ id: "reviews", label: "نظرات محصولات", icon: "ti-star" }, { id: "blog", label: "کامنت‌های بلاگ", icon: "ti-message-circle" }]}
        />
      </div>

      <AdminToolbar>
        <AdminSearch value={q} onChange={setQ} placeholder="جستجو در متن نظر..." />
        <AdminSelect value={approvedFilter} onChange={setApprovedFilter}>
          <option value="">همه وضعیت‌ها</option>
          <option value="false">در انتظار تایید</option>
          <option value="true">تایید شده</option>
        </AdminSelect>
        <AdminBtn icon="ti-search" onClick={() => load(1)}>جستجو</AdminBtn>
        {pendingCount > 0 && <AdminBadge variant="warning" dot>{pendingCount} در انتظار</AdminBadge>}
      </AdminToolbar>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading && <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />}
        {!loading && items.length === 0 && <AdminEmptyState icon="ti-message-off" title="نظری یافت نشد" />}
        {!loading && items.map(item => {
          const rev = isReview(item) ? item : null;
          const com = !isReview(item) ? item as BlogComment : null;
          const approved = item.isApproved;
          const authorName = rev ? `${rev.user.firstName} ${rev.user.lastName}` : com!.authorName;
          const authorEmail = rev ? rev.user.email : com!.authorEmail;

          return (
            <div key={item.id} style={{ background: "#fff", borderRadius: 10, border: "1.5px solid var(--border)", borderRight: `4px solid ${approved ? "#22c55e" : "#f59e0b"}`, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <AdminAvatar name={authorName} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontWeight: 900, fontSize: 13, color: "var(--text1)" }}>{authorName}</span>
                    {authorEmail && <span style={{ fontSize: 11, color: "var(--text3)" }}>{authorEmail}</span>}
                    {rev && <Stars n={rev.rating} />}
                    <AdminBadge variant={approved ? "success" : "warning"} size="xs">{approved ? "تایید شده" : "در انتظار"}</AdminBadge>
                    <span style={{ fontSize: 11, color: "var(--text3)", marginRight: "auto" }}>{new Date(item.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>
                    <i className={`ti ${rev ? "ti-package" : "ti-news"}`} style={{ marginLeft: 4 }} />
                    {rev ? rev.product.name : com!.post.title}
                  </div>
                  {rev?.title && <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{rev.title}</div>}
                  <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{rev ? rev.content ?? "—" : com!.content}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {!approved
                    ? <AdminBtn icon="ti-check" size="sm" variant="primary" style={{ background: "#16a34a", border: "none" }} loading={acting === item.id} onClick={() => handleApprove(item.id, true)}>تایید</AdminBtn>
                    : <AdminBtn icon="ti-x" size="sm" loading={acting === item.id} onClick={() => handleApprove(item.id, false)}>رد</AdminBtn>
                  }
                  <AdminBtn icon="ti-trash" size="sm" variant="danger" loading={acting === item.id} onClick={() => handleDelete(item.id)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pages > 1 && <AdminPagination page={page} total={total} pageSize={25} onChange={p => load(p)} />}
    </div>
  );
}
