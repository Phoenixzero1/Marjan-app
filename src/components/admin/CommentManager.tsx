"use client";

import { useState, useEffect, useCallback } from "react";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  isApproved: boolean;
  createdAt: string;
  product: { id: string; name: string; slug: string };
  user: { firstName: string; lastName: string; email: string | null };
}

interface BlogComment {
  id: string;
  authorName: string;
  authorEmail: string | null;
  content: string;
  isApproved: boolean;
  createdAt: string;
  post: { id: string; title: string; slug: string };
}

type Tab = "reviews" | "blog";
type Toast = { msg: string; ok: boolean };

function Stars({ n }: { n: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(i => (
        <i key={i} className={`ti ${i <= n ? "ti-star-filled" : "ti-star"}`} style={{ fontSize: 13, color: i <= n ? "#f59e0b" : "#d1d5db" }} />
      ))}
    </span>
  );
}

export default function CommentManager() {
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
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab, page: String(pg) });
      if (approvedFilter) params.set("approved", approvedFilter);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/comments?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(pg);
      setPendingCount(data.pendingCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, [tab, approvedFilter, q]);

  useEffect(() => { load(1); }, [load]);

  async function handleApprove(id: string, approve: boolean) {
    setActing(id);
    try {
      const res = await fetch("/api/admin/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, tab, isApproved: approve }),
      });
      if (!res.ok) { showToast("خطا در بروزرسانی", false); return; }
      showToast(approve ? "تایید شد" : "رد شد");
      setItems(prev => prev.map((it): Review | BlogComment =>
        it.id === id ? { ...it, isApproved: approve } : it
      ));
      setPendingCount(prev => approve ? Math.max(0, prev - 1) : prev + 1);
    } finally {
      setActing(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("این نظر حذف شود؟")) return;
    setActing(id);
    try {
      const res = await fetch("/api/admin/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, tab }),
      });
      if (!res.ok) { showToast("خطا در حذف", false); return; }
      showToast("نظر حذف شد");
      load(page);
    } finally {
      setActing(null);
    }
  }

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });

  const isReview = (it: Review | BlogComment): it is Review => "rating" in it;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>نظرات و دیدگاه‌ها</h2>
        <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>
          {pendingCount > 0
            ? <span style={{ color: "#ea580c", fontWeight: 700 }}>{pendingCount.toLocaleString("fa-IR")} نظر در انتظار تایید</span>
            : "همه نظرات تایید شده‌اند"}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)" }}>
        {([
          ["reviews", "ti-star", "نظرات محصولات"],
          ["blog",    "ti-message-circle", "کامنت‌های بلاگ"],
        ] as [Tab, string, string][]).map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => { setTab(id); setApprovedFilter(""); setQ(""); }}
            style={{
              background: "none", border: "none", padding: "10px 20px", fontFamily: "Vazirmatn",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              color: tab === id ? "var(--accent)" : "var(--text3)",
              borderBottom: tab === id ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -2, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <i className={`ti ${icon}`} />{label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(1)}
          placeholder="جستجو در متن نظر..."
          style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", minWidth: 220 }}
        />
        <select
          value={approvedFilter}
          onChange={e => setApprovedFilter(e.target.value)}
          style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontFamily: "Vazirmatn", fontSize: 13, background: "#fff" }}
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="false">در انتظار تایید</option>
          <option value="true">تایید شده</option>
        </select>
        <button
          onClick={() => load(1)}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          جستجو
        </button>
        <div style={{ marginRight: "auto", fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          {total.toLocaleString("fa-IR")} نظر
        </div>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", color: "var(--text3)" }}>
            <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />در حال بارگذاری...
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", color: "var(--text3)" }}>
            <i className="ti ti-message-off" style={{ fontSize: 40, display: "block", marginBottom: 8 }} />نظری یافت نشد
          </div>
        ) : items.map(item => {
          const rev = isReview(item) ? item : null;
          const com = !isReview(item) ? item : null;
          const approved = item.isApproved;

          return (
            <div
              key={item.id}
              style={{
                background: "#fff",
                borderRadius: "var(--radius)",
                boxShadow: "var(--shadow)",
                padding: "16px 20px",
                borderRight: `4px solid ${approved ? "#22c55e" : "#f59e0b"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                {/* Left: content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Author line */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className="ti ti-user" style={{ fontSize: 16, color: "var(--text3)" }} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 900, fontSize: 13, color: "var(--primary)" }}>
                        {rev ? `${rev.user.firstName} ${rev.user.lastName}` : com!.authorName}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text3)", marginRight: 6 }}>
                        {rev ? rev.user.email : com!.authorEmail ?? ""}
                      </span>
                    </div>
                    {rev && <Stars n={rev.rating} />}
                    <span style={{ fontSize: 11, color: "var(--text3)", marginRight: "auto" }}>{fmtDate(item.createdAt)}</span>
                  </div>

                  {/* Target (product or post) */}
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>
                    <i className={`ti ${rev ? "ti-package" : "ti-news"}`} style={{ marginLeft: 4 }} />
                    {rev ? rev.product.name : com!.post.title}
                  </div>

                  {/* Content */}
                  {rev?.title && <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 4 }}>{rev.title}</div>}
                  <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
                    {rev ? rev.content ?? "—" : com!.content}
                  </div>
                </div>

                {/* Right: actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <span style={{
                    background: approved ? "#dcfce7" : "#fff7ed",
                    color: approved ? "#16a34a" : "#ea580c",
                    borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, textAlign: "center",
                  }}>
                    {approved ? "تایید شده" : "در انتظار"}
                  </span>
                  {!approved ? (
                    <button
                      onClick={() => handleApprove(item.id, true)}
                      disabled={acting === item.id}
                      style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #86efac", borderRadius: 4, padding: "6px 12px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <i className="ti ti-check" /> تایید
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(item.id, false)}
                      disabled={acting === item.id}
                      style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", borderRadius: 4, padding: "6px 12px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <i className="ti ti-x" /> رد کردن
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={acting === item.id}
                    style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: 4, padding: "6px 12px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <i className="ti ti-trash" /> حذف
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          <button onClick={() => load(page - 1)} disabled={page <= 1} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer", opacity: page <= 1 ? .5 : 1 }}>قبلی</button>
          <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "var(--text2)", padding: "0 8px" }}>
            {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}
          </span>
          <button onClick={() => load(page + 1)} disabled={page >= pages} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer", opacity: page >= pages ? .5 : 1 }}>بعدی</button>
        </div>
      )}
    </div>
  );
}
