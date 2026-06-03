"use client";

import { useState, useEffect, useCallback } from "react";

type LogLevel = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

interface LogEntry {
  id: string;
  level: LogLevel;
  action: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string | null } | null;
}

type Toast = { msg: string; ok: boolean };

const LEVEL: Record<LogLevel, { label: string; bg: string; color: string; icon: string }> = {
  INFO:     { label: "اطلاعات", bg: "#dbeafe", color: "#2563eb", icon: "ti-info-circle" },
  WARNING:  { label: "هشدار",   bg: "#fef9c3", color: "#ca8a04", icon: "ti-alert-triangle" },
  ERROR:    { label: "خطا",     bg: "#fee2e2", color: "#dc2626", icon: "ti-circle-x" },
  CRITICAL: { label: "بحرانی", bg: "#fce7f3", color: "#be185d", icon: "ti-skull" },
};

export default function LogsManager() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (levelFilter) params.set("level", levelFilter);
      if (q.trim()) params.set("q", q.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(pg);
      if (data.levelCounts) setLevelCounts(data.levelCounts);
    } finally {
      setLoading(false);
    }
  }, [levelFilter, q, from, to]);

  useEffect(() => { load(1); }, [load]);

  async function handlePurge(days: number) {
    if (!confirm(`لاگ‌های قدیمی‌تر از ${days} روز حذف شوند؟`)) return;
    setPurging(true);
    try {
      const res = await fetch("/api/admin/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ olderThanDays: days }),
      });
      const data = await res.json();
      if (res.ok) { showToast(`${data.deleted} لاگ حذف شد`); load(1); }
      else showToast("خطا در حذف لاگ‌ها", false);
    } finally {
      setPurging(false);
    }
  }

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const totalLogs = Object.values(levelCounts).reduce((a, b) => a + b, 0);

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
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>لاگ سیستم</h2>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>{totalLogs.toLocaleString("fa-IR")} رویداد ثبت‌شده</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => handlePurge(d)}
              disabled={purging}
              style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "var(--radius-sm)", padding: "7px 12px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              حذف +{d} روز
            </button>
          ))}
        </div>
      </div>

      {/* Level summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {(Object.entries(LEVEL) as [LogLevel, typeof LEVEL[LogLevel]][]).map(([key, val]) => (
          <div
            key={key}
            onClick={() => setLevelFilter(levelFilter === key ? "" : key)}
            style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: levelFilter === key ? `0 0 0 2px ${val.color}` : "var(--shadow)", padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "box-shadow .15s" }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: val.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className={`ti ${val.icon}`} style={{ fontSize: 20, color: val.color }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)" }}>
                {(levelCounts[key] ?? 0).toLocaleString("fa-IR")}
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{val.label}</div>
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
          placeholder="جستجو عملیات یا IP..."
          style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", minWidth: 220 }}
        />
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontFamily: "Vazirmatn", fontSize: 13, background: "#fff" }}>
          <option value="">همه سطوح</option>
          {(Object.entries(LEVEL) as [LogLevel, typeof LEVEL[LogLevel]][]).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text3)" }}>
          <span>از:</span>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 10px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text3)" }}>
          <span>تا:</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 10px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none" }} />
        </div>
        <button onClick={() => load(1)} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>اعمال</button>
        {(levelFilter || q || from || to) && (
          <button onClick={() => { setLevelFilter(""); setQ(""); setFrom(""); setTo(""); }} style={{ background: "var(--surface)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 12px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer" }}>پاک‌سازی</button>
        )}
        <div style={{ marginRight: "auto", fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>{total.toLocaleString("fa-IR")} نتیجه</div>
      </div>

      {/* Log list */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
            <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />در حال بارگذاری...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
            <i className="ti ti-terminal-2" style={{ fontSize: 40, display: "block", marginBottom: 8 }} />لاگی یافت نشد
          </div>
        ) : logs.map((log, i) => {
          const lv = LEVEL[log.level];
          const isExpanded = expanded === log.id;
          return (
            <div
              key={log.id}
              style={{ borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <div
                onClick={() => setExpanded(isExpanded ? null : log.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: log.details ? "pointer" : "default", background: isExpanded ? "#f8fafc" : "#fff" }}
              >
                {/* Level badge */}
                <span style={{ background: lv.bg, color: lv.color, borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 900, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <i className={`ti ${lv.icon}`} style={{ fontSize: 11 }} />{lv.label}
                </span>

                {/* Action */}
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {log.action}
                </span>

                {/* User */}
                {log.user && (
                  <span style={{ fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap", flexShrink: 0 }}>
                    <i className="ti ti-user" style={{ fontSize: 11 }} /> {log.user.firstName} {log.user.lastName}
                  </span>
                )}

                {/* IP */}
                {log.ipAddress && (
                  <span style={{ fontSize: 11, color: "var(--text3)", direction: "ltr", fontFamily: "monospace", flexShrink: 0 }}>{log.ipAddress}</span>
                )}

                {/* Time */}
                <span style={{ fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap", flexShrink: 0 }}>{fmtDate(log.createdAt)}</span>

                {/* Expand */}
                {log.details && (
                  <i className={`ti ${isExpanded ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ fontSize: 14, color: "var(--text3)", flexShrink: 0 }} />
                )}
              </div>

              {/* Expanded details */}
              {isExpanded && log.details && (
                <div style={{ padding: "0 16px 12px 16px" }}>
                  <pre style={{ background: "#0f172a", color: "#e2e8f0", borderRadius: 8, padding: "12px 14px", fontSize: 11, lineHeight: 1.7, overflowX: "auto", margin: 0, fontFamily: "monospace" }}>
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                  {log.userAgent && (
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6, direction: "ltr", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      UA: {log.userAgent}
                    </div>
                  )}
                </div>
              )}
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
