"use client";

import { useState, useEffect, useCallback } from "react";

interface SessionEntry {
  id: string;
  sessionToken: string;
  expires: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    role: string;
    status: string;
  };
}

interface Summary { total: number; active: number; expired: number }
type Toast = { msg: string; ok: boolean };

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

export default function SessionsManager() {
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
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (q.trim()) params.set("q", q.trim());
      if (expiredFilter) params.set("expired", expiredFilter);
      const res = await fetch(`/api/admin/sessions?${params}`);
      const data = await res.json();
      setSessions(data.sessions ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(pg);
      if (data.summary) setSummary(data.summary);
      if (data.mySessionUserId) setMyUserId(data.mySessionUserId);
    } finally {
      setLoading(false);
    }
  }, [q, expiredFilter]);

  useEffect(() => { load(1); }, [load]);

  async function handleRevoke(session: SessionEntry) {
    if (!confirm(`نشست ${session.user.firstName} ${session.user.lastName} لغو شود؟`)) return;
    setActing(session.id);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: session.id }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "خطا در لغو نشست", false); return; }
      showToast("نشست لغو شد");
      setSessions(prev => prev.filter(s => s.id !== session.id));
      setSummary(prev => ({ ...prev, total: prev.total - 1, active: isActive(session) ? prev.active - 1 : prev.active, expired: !isActive(session) ? prev.expired - 1 : prev.expired }));
    } finally {
      setActing(null);
    }
  }

  async function handleRevokeAll(userId: string, name: string) {
    if (!confirm(`تمام نشست‌های ${name} لغو شود؟`)) return;
    setActing(userId);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "خطا", false); return; }
      showToast(`${data.deleted} نشست لغو شد`);
      load(page);
    } finally {
      setActing(null);
    }
  }

  async function handlePurgeExpired() {
    if (!confirm("تمام نشست‌های منقضی حذف شوند؟")) return;
    setActing("purge");
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteExpired: true }),
      });
      const data = await res.json();
      if (res.ok) { showToast(`${data.deleted} نشست منقضی حذف شد`); load(1); }
      else showToast("خطا در حذف", false);
    } finally {
      setActing(null);
    }
  }

  const isActive = (s: SessionEntry) => new Date(s.expires) > new Date();

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // Group by userId to show "revoke all" per user
  const userGroups = sessions.reduce<Record<string, SessionEntry[]>>((acc, s) => {
    (acc[s.user.id] = acc[s.user.id] ?? []).push(s);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>مدیریت نشست‌ها</h2>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>نشست‌های فعال و منقضی کاربران</p>
        </div>
        {summary.expired > 0 && (
          <button
            onClick={handlePurgeExpired}
            disabled={acting === "purge"}
            style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <i className="ti ti-trash" /> حذف {summary.expired.toLocaleString("fa-IR")} نشست منقضی
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { label: "کل نشست‌ها", value: summary.total, icon: "ti-device-laptop", color: "#2563eb" },
          { label: "فعال",        value: summary.active,  icon: "ti-circle-check",  color: "#16a34a" },
          { label: "منقضی",      value: summary.expired, icon: "ti-clock-off",     color: "#94a3b8" },
        ].map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: c.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className={`ti ${c.icon}`} style={{ fontSize: 22, color: c.color }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)" }}>{c.value.toLocaleString("fa-IR")}</div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(1)}
          placeholder="جستجو نام یا ایمیل کاربر..."
          style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", minWidth: 220 }}
        />
        <select value={expiredFilter} onChange={e => setExpiredFilter(e.target.value)} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontFamily: "Vazirmatn", fontSize: 13, background: "#fff" }}>
          <option value="">همه نشست‌ها</option>
          <option value="false">فعال</option>
          <option value="true">منقضی</option>
        </select>
        <button onClick={() => load(1)} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 14px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>جستجو</button>
        <div style={{ marginRight: "auto", fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>{total.toLocaleString("fa-IR")} نشست</div>
      </div>

      {/* Sessions list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", color: "var(--text3)" }}>
          <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />در حال بارگذاری...
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", color: "var(--text3)" }}>
          <i className="ti ti-device-laptop-off" style={{ fontSize: 40, display: "block", marginBottom: 8 }} />نشستی یافت نشد
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(userGroups).map(([uid, userSessions]) => {
            const user = userSessions[0].user;
            const isMe = uid === myUserId;
            return (
              <div key={uid} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
                {/* User header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: isMe ? "#dbeafe" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-user" style={{ fontSize: 18, color: isMe ? "#2563eb" : "var(--text3)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: 14, color: "var(--primary)" }}>
                      {user.firstName} {user.lastName}
                      {isMe && <span style={{ marginRight: 6, background: "#dbeafe", color: "#2563eb", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>شما</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)", direction: "ltr", textAlign: "right" }}>
                      {user.email} · {ROLE_LABELS[user.role] ?? user.role}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text3)" }}>{userSessions.length.toLocaleString("fa-IR")} نشست</span>
                    {!isMe && (
                      <button
                        onClick={() => handleRevokeAll(uid, `${user.firstName} ${user.lastName}`)}
                        disabled={acting === uid}
                        style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: 4, padding: "5px 12px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        لغو همه نشست‌ها
                      </button>
                    )}
                  </div>
                </div>

                {/* Session rows */}
                {userSessions.map((s, i) => {
                  const active = isActive(s);
                  const browser = parseBrowser(s.userAgent);
                  const os = parseOS(s.userAgent);
                  return (
                    <div
                      key={s.id}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < userSessions.length - 1 ? "1px solid var(--border)" : "none", flexWrap: "wrap" }}
                    >
                      {/* Browser icon */}
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: active ? "#dcfce7" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className={`ti ${browser === "Chrome" ? "ti-brand-chrome" : browser === "Firefox" ? "ti-brand-firefox" : browser === "Safari" ? "ti-brand-safari" : "ti-browser"}`} style={{ fontSize: 16, color: active ? "#16a34a" : "#94a3b8" }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                          {browser}{os ? ` · ${os}` : ""}
                        </div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 2 }}>
                          {s.ipAddress && <span style={{ fontSize: 11, color: "var(--text3)", direction: "ltr", fontFamily: "monospace" }}>{s.ipAddress}</span>}
                          <span style={{ fontSize: 11, color: "var(--text3)" }}>شروع: {fmtDate(s.createdAt)}</span>
                          <span style={{ fontSize: 11, color: active ? "#16a34a" : "var(--text3)" }}>
                            {active ? `انقضا: ${fmtDate(s.expires)}` : `منقضی شده: ${fmtDate(s.expires)}`}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{
                          background: active ? "#dcfce7" : "#f1f5f9",
                          color: active ? "#16a34a" : "#94a3b8",
                          borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                        }}>
                          {active ? "فعال" : "منقضی"}
                        </span>
                        {!isMe && (
                          <button
                            onClick={() => handleRevoke(s)}
                            disabled={acting === s.id}
                            title="لغو نشست"
                            style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: "#ef4444" }}
                          >
                            <i className="ti ti-logout" style={{ fontSize: 14 }} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

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
