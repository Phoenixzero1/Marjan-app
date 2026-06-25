"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminToolbar, AdminSearch, AdminSelect, AdminBtn,
  AdminBadge, AdminEmptyState, AdminStatCard, AdminPagination,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

interface SessionEntry {
  id: string; sessionToken: string; expires: string; userAgent: string | null;
  ipAddress: string | null; createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string | null; role: string; status: string; };
}

interface Summary { total: number; active: number; expired: number }

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "سوپرادمین", ADMIN: "ادمین", CONTENT_MANAGER: "مدیر محتوا",
  CUSTOMER: "مشتری", GUEST: "مهمان",
};

function parseBrowser(ua: string | null): string {
  if (!ua) return "نامشخص";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return "مرورگر نامشخص";
}

function parseOS(ua: string | null): string {
  if (!ua) return "";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "";
}

const PAGE_SIZE = 25;

export default function SessionsManager() {
  const { toast, showToast } = useAdminToast();
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, active: 0, expired: 0 });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [myUserId, setMyUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [expiredFilter, setExpiredFilter] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (q.trim()) params.set("q", q.trim());
      if (expiredFilter) params.set("expired", expiredFilter);
      const res = await fetch(`/api/admin/sessions?${params}`);
      const data = await res.json();
      setSessions(data.sessions ?? []); setTotal(data.total ?? 0); setPages(data.pages ?? 1); setPage(pg);
      if (data.summary) setSummary(data.summary);
      if (data.mySessionUserId) setMyUserId(data.mySessionUserId);
    } finally { setLoading(false); }
  }, [q, expiredFilter]);

  useEffect(() => { load(1); }, [load]);

  async function handleRevoke(session: SessionEntry) {
    if (!confirm(`نشست ${session.user.firstName} ${session.user.lastName} لغو شود؟`)) return;
    setActing(session.id);
    try {
      const res = await fetch("/api/admin/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: session.id }) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در لغو نشست"); return; }
      showToast("success", "نشست لغو شد");
      setSessions(prev => prev.filter(s => s.id !== session.id));
      setSummary(prev => ({ ...prev, total: prev.total - 1, active: isActive(session) ? prev.active - 1 : prev.active, expired: !isActive(session) ? prev.expired - 1 : prev.expired }));
    } finally { setActing(null); }
  }

  async function handleRevokeAll(userId: string, name: string) {
    if (!confirm(`تمام نشست‌های ${name} لغو شود؟`)) return;
    setActing(userId);
    try {
      const res = await fetch("/api/admin/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا"); return; }
      showToast("success", `${data.deleted} نشست لغو شد`); load(page);
    } finally { setActing(null); }
  }

  async function handlePurgeExpired() {
    if (!confirm("تمام نشست‌های منقضی حذف شوند؟")) return;
    setActing("purge");
    try {
      const res = await fetch("/api/admin/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deleteExpired: true }) });
      const data = await res.json();
      if (res.ok) { showToast("success", `${data.deleted} نشست منقضی حذف شد`); load(1); }
      else showToast("error", "خطا در حذف");
    } finally { setActing(null); }
  }

  const isActive = (s: SessionEntry) => new Date(s.expires) > new Date();
  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const userGroups = sessions.reduce<Record<string, SessionEntry[]>>((acc, s) => {
    (acc[s.user.id] = acc[s.user.id] ?? []).push(s); return acc;
  }, {});

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="مدیریت نشست‌ها" icon="ti-device-laptop" count={total}
        subtitle="نشست‌های فعال و منقضی کاربران"
        actions={summary.expired > 0
          ? <AdminBtn icon="ti-trash" variant="danger" loading={acting === "purge"} onClick={handlePurgeExpired}>
              حذف {summary.expired.toLocaleString("fa-IR")} نشست منقضی
            </AdminBtn>
          : undefined
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
        <AdminStatCard icon="ti-device-laptop" label="کل نشست‌ها" value={summary.total.toLocaleString("fa-IR")} color="#2563eb" />
        <AdminStatCard icon="ti-circle-check" label="فعال" value={summary.active.toLocaleString("fa-IR")} color="#16a34a" />
        <AdminStatCard icon="ti-clock-off" label="منقضی" value={summary.expired.toLocaleString("fa-IR")} color="#94a3b8" />
      </div>

      <AdminToolbar>
        <AdminSearch value={q} onChange={setQ} placeholder="جستجو نام یا ایمیل کاربر..." />
        <AdminSelect value={expiredFilter} onChange={setExpiredFilter}>
          <option value="">همه نشست‌ها</option>
          <option value="false">فعال</option>
          <option value="true">منقضی</option>
        </AdminSelect>
        <AdminBtn icon="ti-search" onClick={() => load(1)}>جستجو</AdminBtn>
        <span style={{ fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>{total.toLocaleString("fa-IR")} نشست</span>
      </AdminToolbar>

      {loading && <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />}
      {!loading && sessions.length === 0 && <AdminEmptyState icon="ti-device-laptop-off" title="نشستی یافت نشد" />}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Object.entries(userGroups).map(([uid, userSessions]) => {
          const user = userSessions[0].user;
          const isMe = uid === myUserId;
          return (
            <div key={uid} style={{ background: "#fff", borderRadius: 10, border: "1.5px solid var(--border)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--bg)", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: isMe ? "#dbeafe" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="ti ti-user" style={{ fontSize: 18, color: isMe ? "#2563eb" : "var(--text3)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 14, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    {user.firstName} {user.lastName}
                    {isMe && <AdminBadge variant="info" size="xs">شما</AdminBadge>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>{user.email} · {ROLE_LABELS[user.role] ?? user.role}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>{userSessions.length.toLocaleString("fa-IR")} نشست</span>
                  {!isMe && <AdminBtn size="sm" icon="ti-logout" variant="danger" loading={acting === uid} onClick={() => handleRevokeAll(uid, `${user.firstName} ${user.lastName}`)}>لغو همه</AdminBtn>}
                </div>
              </div>
              {userSessions.map((s, i) => {
                const active = isActive(s);
                const browser = parseBrowser(s.userAgent);
                const os = parseOS(s.userAgent);
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < userSessions.length - 1 ? "1px solid var(--border)" : "none", flexWrap: "wrap" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: active ? "#dcfce7" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className={`ti ${browser === "Chrome" ? "ti-brand-chrome" : browser === "Firefox" ? "ti-brand-firefox" : browser === "Safari" ? "ti-brand-safari" : "ti-browser"}`} style={{ fontSize: 16, color: active ? "#16a34a" : "#94a3b8" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{browser}{os ? ` · ${os}` : ""}</div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 2 }}>
                        {s.ipAddress && <span style={{ fontSize: 11, color: "var(--text3)", direction: "ltr", fontFamily: "monospace" }}>{s.ipAddress}</span>}
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>شروع: {fmtDate(s.createdAt)}</span>
                        <span style={{ fontSize: 11, color: active ? "#16a34a" : "var(--text3)" }}>
                          {active ? `انقضا: ${fmtDate(s.expires)}` : `منقضی شده: ${fmtDate(s.expires)}`}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <AdminBadge variant={active ? "success" : "neutral"} size="xs">{active ? "فعال" : "منقضی"}</AdminBadge>
                      {!isMe && <AdminBtn size="sm" icon="ti-logout" variant="danger" loading={acting === s.id} onClick={() => handleRevoke(s)} />}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {pages > 1 && <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={pg => load(pg)} />}
    </div>
  );
}
