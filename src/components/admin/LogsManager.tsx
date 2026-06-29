"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminToolbar, AdminSearch, AdminSelect, AdminBtn, AdminBadge,
  AdminEmptyState, AdminCard, AdminPagination, AdminConfirm,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";
import DatePicker from "@/components/ui/DatePicker";

interface LogEntry {
  id: string; level: string; message: string; context: string | null;
  source: string | null; details: Record<string, unknown> | null; createdAt: string;
}

interface Summary { INFO: number; WARNING: number; ERROR: number; CRITICAL: number; }

const LEVEL_CFG: Record<string, { label: string; variant: "info" | "warning" | "danger" | "purple"; icon: string; color: string }> = {
  INFO:     { label: "اطلاعات", variant: "info",    icon: "ti-info-circle",    color: "#2563eb" },
  WARNING:  { label: "هشدار",   variant: "warning",  icon: "ti-alert-triangle", color: "#d97706" },
  ERROR:    { label: "خطا",     variant: "danger",   icon: "ti-circle-x",       color: "#dc2626" },
  CRITICAL: { label: "بحرانی",  variant: "purple",   icon: "ti-flame",          color: "#7c3aed" },
};

const PURGE_OPTIONS = [7, 14, 30, 60, 90];
const PAGE_SIZE = 25;

export default function LogsManager() {
  const { toast, showToast } = useAdminToast();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<Summary>({ INFO: 0, WARNING: 0, ERROR: 0, CRITICAL: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [purgeConfirm, setPurgeConfirm] = useState(false);
  const [purgeDays, setPurgeDays] = useState(30);
  const [purging, setPurging] = useState(false);

  const load = useCallback((pg: number) => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(pg), pageSize: String(PAGE_SIZE) });
    if (level) qs.set("level", level);
    if (q.trim()) qs.set("q", q.trim());
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    fetch(`/api/admin/logs?${qs}`)
      .then(r => r.json())
      .then(d => { setEntries(d.entries ?? []); setTotal(d.total ?? 0); setSummary(d.summary ?? { INFO: 0, WARNING: 0, ERROR: 0, CRITICAL: 0 }); })
      .catch(() => showToast("error", "خطا در بارگذاری لاگ‌ها"))
      .finally(() => setLoading(false));
  }, [level, q, from, to, showToast]);

  useEffect(() => { load(1); setPage(1); }, [level, from, to]); // eslint-disable-line
  useEffect(() => { load(page); }, [page]); // eslint-disable-line

  async function handlePurge() {
    setPurging(true);
    try {
      const res = await fetch(`/api/admin/logs?days=${purgeDays}`, { method: "DELETE" });
      const d = await res.json();
      if (res.ok) { showToast("success", `${d.deleted ?? 0} لاگ پاک‌سازی شد`); load(1); }
      else showToast("error", d.error ?? "خطا");
    } catch { showToast("error", "خطای سرور"); }
    finally { setPurging(false); setPurgeConfirm(false); }
  }

  const LEVELS: (keyof Summary)[] = ["INFO", "WARNING", "ERROR", "CRITICAL"];

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="گزارش رویدادها" icon="ti-file-description" count={total}
        subtitle="لاگ‌های سیستمی — جستجو، فیلتر و پاک‌سازی"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn icon="ti-refresh" onClick={() => load(page)}>بروزرسانی</AdminBtn>
            <AdminBtn icon="ti-trash" variant="danger" onClick={() => setPurgeConfirm(true)}>پاک‌سازی</AdminBtn>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {LEVELS.map(lv => {
          const cfg = LEVEL_CFG[lv];
          const active = level === lv;
          return (
            <button key={lv} onClick={() => setLevel(active ? "" : lv)} style={{ all: "unset", cursor: "pointer" }}>
              <div style={{ background: active ? "var(--primary)" : "#fff", border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, transition: "all .15s" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: active ? "rgba(255,255,255,0.15)" : "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`ti ${cfg.icon}`} style={{ fontSize: 18, color: active ? "#fff" : cfg.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: active ? "rgba(255,255,255,0.7)" : "var(--text3)", fontWeight: 700 }}>{cfg.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: active ? "#fff" : "var(--text1)", lineHeight: 1.1 }}>{summary[lv].toLocaleString("fa-IR")}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <AdminToolbar>
        <AdminSearch value={q} onChange={setQ} placeholder="جستجو در پیام‌ها..." />
        <AdminSelect value={level} onChange={setLevel}>
          <option value="">همه سطوح</option>
          {LEVELS.map(lv => <option key={lv} value={lv}>{LEVEL_CFG[lv].label}</option>)}
        </AdminSelect>
        <div style={{ width: 150 }}><DatePicker value={from} onChange={setFrom} placeholder="از تاریخ" inputStyle={{ height: 32, padding: "0 8px 0 32px", fontSize: 12 }} /></div>
        <div style={{ width: 150 }}><DatePicker value={to} onChange={setTo} placeholder="تا تاریخ" inputStyle={{ height: 32, padding: "0 8px 0 32px", fontSize: 12 }} /></div>
        <AdminBtn icon="ti-search" onClick={() => { load(1); setPage(1); }}>جستجو</AdminBtn>
        {(q || from || to || level) && <AdminBtn variant="ghost" icon="ti-x" onClick={() => { setQ(""); setFrom(""); setTo(""); setLevel(""); }}>پاک</AdminBtn>}
      </AdminToolbar>

      <AdminCard>
        {loading && <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />}
        {!loading && entries.length === 0 && <AdminEmptyState icon="ti-file-off" title="لاگی یافت نشد" subtitle="فیلترها را تغییر دهید" />}
        {!loading && entries.map((e, i) => {
          const cfg = LEVEL_CFG[e.level] ?? LEVEL_CFG.INFO;
          const isOpen = expanded === e.id;
          return (
            <div key={e.id} style={{ borderBottom: i < entries.length - 1 ? "1px solid var(--border)" : "none" }}>
              <button onClick={() => setExpanded(isOpen ? null : e.id)} style={{ all: "unset", width: "100%", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 16px", boxSizing: "border-box" }}>
                <div style={{ paddingTop: 1, flexShrink: 0 }}>
                  <AdminBadge variant={cfg.variant} size="xs">{cfg.label}</AdminBadge>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 12.5, color: "var(--text1)", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.5 }}>{e.message}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                    {e.source && <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "monospace" }}>{e.source}</span>}
                    {e.context && <span style={{ fontSize: 10, color: "var(--text3)" }}>{e.context}</span>}
                    <span style={{ fontSize: 10, color: "var(--text3)", direction: "ltr", marginRight: "auto" }}>{new Date(e.createdAt).toLocaleString("fa-IR")}</span>
                    {e.details && <i className="ti ti-code" style={{ fontSize: 12, color: "var(--text3)" }} />}
                  </div>
                </div>
                <i className={`ti ${isOpen ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ fontSize: 14, color: "var(--text3)", flexShrink: 0, marginTop: 2 }} />
              </button>
              {isOpen && e.details && (
                <div style={{ padding: "0 16px 12px 16px" }}>
                  <pre style={{ background: "#0d1117", color: "#c9d1d9", borderRadius: 8, padding: "12px 14px", fontSize: 11.5, overflowX: "auto", margin: 0, direction: "ltr", lineHeight: 1.6 }}>
                    {JSON.stringify(e.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </AdminCard>

      {total > PAGE_SIZE && (
        <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={p => { setPage(p); setExpanded(null); }} />
      )}

      <AdminConfirm open={purgeConfirm} onClose={() => setPurgeConfirm(false)} onConfirm={handlePurge}
        title="پاک‌سازی لاگ‌های قدیمی" danger
        confirmLabel={purging ? "در حال پاک‌سازی..." : `حذف لاگ‌های قدیمی‌تر از ${purgeDays} روز`}
        message={
          <div>
            <p style={{ marginBottom: 12 }}>لاگ‌های قدیمی‌تر از چند روز پاک شوند؟</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PURGE_OPTIONS.map(d => (
                <button key={d} onClick={() => setPurgeDays(d)} style={{ padding: "4px 12px", borderRadius: 6, border: `1.5px solid ${d === purgeDays ? "var(--primary)" : "var(--border)"}`, background: d === purgeDays ? "var(--primary)" : "#fff", color: d === purgeDays ? "#fff" : "var(--text1)", fontSize: 12, cursor: "pointer", fontWeight: d === purgeDays ? 900 : 400 }}>
                  {d} روز
                </button>
              ))}
            </div>
          </div>
        }
      />
    </div>
  );
}
