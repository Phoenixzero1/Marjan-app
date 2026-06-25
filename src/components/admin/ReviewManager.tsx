"use client";
import { useState, useEffect } from "react";
import {
  AdminPageHeader, AdminBtn, AdminBadge, AdminEmptyState,
} from "@/components/admin/AdminUI";

interface Review {
  id: string; rating: number; title?: string; content?: string;
  isApproved: boolean; createdAt: string;
  reviewerName?: string;
  product: { name: string }; user?: { firstName?: string; lastName?: string } | null;
}

const STARS = [1, 2, 3, 4, 5];

export default function ReviewManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  useEffect(() => {
    fetch("/api/admin/reviews").then(r => r.json()).then(setReviews).finally(() => setLoading(false));
  }, []);

  const approve = async (id: string) => {
    await fetch(`/api/admin/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isApproved: true }) });
    setReviews(r => r.map(x => x.id === id ? { ...x, isApproved: true } : x));
  };

  const del = async (id: string) => {
    if (!confirm("حذف این نظر؟")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setReviews(r => r.filter(x => x.id !== id));
  };

  const filtered = reviews.filter(r => filter === "all" ? true : filter === "pending" ? !r.isApproved : r.isApproved);
  const pendingCount = reviews.filter(r => !r.isApproved).length;

  return (
    <div>
      <AdminPageHeader
        title="نظرات کاربران"
        icon="ti-star"
        count={reviews.length}
        subtitle={pendingCount > 0 ? `${pendingCount} نظر در انتظار تأیید` : undefined}
      />

      <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
        {([["all", "همه"], ["pending", `در انتظار تأیید${pendingCount > 0 ? ` (${pendingCount})` : ""}`], ["approved", "تأیید‌شده"]] as const).map(([val, label]) => (
          <AdminBtn
            key={val}
            size="sm"
            variant={filter === val ? "primary" : "secondary"}
            onClick={() => setFilter(val)}
          >
            {label}
          </AdminBtn>
        ))}
      </div>

      {loading ? (
        <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />
      ) : filtered.length === 0 ? (
        <AdminEmptyState icon="ti-star-off" title="نظری یافت نشد" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map(r => (
            <div key={r.id} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 2 }}>
                      {STARS.map(s => <i key={s} className={`ti ${s <= r.rating ? "ti-star-filled" : "ti-star"}`} style={{ fontSize: 14, color: s <= r.rating ? "#f59e0b" : "var(--border)" }} />)}
                    </div>
                    <span style={{ fontWeight: 900, fontSize: 13, color: "var(--text)" }}>
                      {r.reviewerName || (r.user ? `${r.user.firstName ?? ""} ${r.user.lastName ?? ""}`.trim() : "") || "کاربر ناشناس"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>روی محصول: <strong>{r.product.name}</strong></span>
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{new Date(r.createdAt).toLocaleDateString("fa-IR")}</span>
                    <AdminBadge variant={r.isApproved ? "success" : "warning"} size="xs">
                      {r.isApproved ? "تأیید‌شده" : "در انتظار"}
                    </AdminBadge>
                  </div>
                  {r.title && <div style={{ fontWeight: 900, fontSize: 13, color: "var(--primary)", marginBottom: 4 }}>{r.title}</div>}
                  {r.content && <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{r.content}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {!r.isApproved && (
                    <AdminBtn size="sm" icon="ti-check" variant="ghost" style={{ color: "#1a7a4a", background: "rgba(26,122,74,0.1)" }} onClick={() => approve(r.id)}>تأیید</AdminBtn>
                  )}
                  <AdminBtn size="sm" icon="ti-trash" variant="danger" onClick={() => del(r.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
