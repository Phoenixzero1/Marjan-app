"use client";

import { useState, useEffect, useRef } from "react";
import {
  AdminPageHeader, AdminBtn, AdminCard, AdminCardHeader,
  AdminTable, AdminTh, AdminTd, AdminTr, AdminEmptyState,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

interface LogEntry { type: "info" | "ok" | "error" | "warn" | "done" | "fail"; msg?: string; ts?: string; packageId?: string; size?: number; counts?: Record<string, number>; error?: string; }
interface Package { id: string; date: string; sizeByte: number; counts: Record<string, number>; }

export default function MigrationManager() {
  const { toast, showToast } = useAdminToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [done, setDone] = useState<LogEntry | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  async function loadPackages() {
    try {
      const res = await fetch("/api/admin/migration/packages");
      const data = await res.json();
      setPackages(data.packages ?? []);
    } catch { } finally { setLoading(false); }
  }

  useEffect(() => { loadPackages(); }, []);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  async function createPackage() {
    setCreating(true); setLogs([]); setDone(null);
    try {
      const res = await fetch("/api/admin/migration/create", { method: "POST" });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const entry: LogEntry = JSON.parse(line.slice(6));
            if (entry.type === "done" || entry.type === "fail") setDone(entry);
            else setLogs((prev) => [...prev, entry]);
          } catch { }
        }
      }
    } catch (err) {
      setDone({ type: "fail", error: String(err) });
    } finally { setCreating(false); loadPackages(); }
  }

  async function deletePackage(id: string) {
    if (!window.confirm("آیا از حذف این پکیج مطمئن هستید؟")) return;
    const res = await fetch(`/api/admin/migration/${id}`, { method: "DELETE" });
    if (res.ok) { setPackages((prev) => prev.filter((p) => p.id !== id)); showToast("success", "پکیج حذف شد"); }
    else showToast("error", "خطا در حذف");
  }

  async function verifyPackage(id: string) {
    setVerifying(id);
    try {
      const res = await fetch(`/api/admin/migration/${id}`, { method: "PATCH" });
      const data = await res.json();
      if (data.ok) showToast("success", "فایل سالم است — MD5: " + data.md5?.slice(0, 8) + "...");
      else showToast("error", "فایل ممکن است آسیب دیده باشد");
    } catch { showToast("error", "خطا در بررسی"); }
    finally { setVerifying(null); }
  }

  const fmtSize = (b: number) => b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + " MB" : (b / 1024).toFixed(0) + " KB";
  const fmtDate = (s: string) => new Date(s).toLocaleString("fa-IR");
  const totalRecords = (p: Package) => Object.values(p.counts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <AdminToast toast={toast} />

      <AdminPageHeader
        title="انتقال سایت"
        icon="ti-package-export"
        subtitle="ساخت پکیج کامل برای انتقال سایت به سرور جدید"
        actions={
          <AdminBtn icon="ti-package-export" variant="primary" loading={creating} onClick={createPackage}>
            {creating ? "در حال ساخت..." : "ساخت پکیج انتقال"}
          </AdminBtn>
        }
      />

      {(creating || logs.length > 0 || done) && (
        <AdminCard>
          <AdminCardHeader title="لاگ ساخت پکیج" icon="ti-terminal-2" />
          <div
            ref={logRef}
            style={{ background: "#0f2040", borderRadius: 8, padding: "12px 14px", height: 220, overflowY: "auto", fontFamily: "monospace", fontSize: 12, color: "#94a3b8", marginTop: 12 }}
          >
            {logs.map((l, i) => (
              <div key={i} style={{ padding: "1px 0", color: l.type === "ok" ? "#22c55e" : l.type === "error" ? "#ef4444" : l.type === "warn" ? "#fbbf24" : "#94a3b8" }}>
                {l.ts ? `[${new Date(l.ts).toTimeString().slice(0, 8)}] ` : ""}{l.msg}
              </div>
            ))}
            {creating && <div style={{ color: "#3b82f6" }}>⋯ در حال پردازش...</div>}
          </div>
          {done && (
            <div style={{ marginTop: 12, padding: "12px 16px", background: done.type === "done" ? "#dcfce7" : "#fee2e2", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: done.type === "done" ? "#16a34a" : "#dc2626" }}>
                {done.type === "done"
                  ? `✅ پکیج آماده شد — ${fmtSize(done.size ?? 0)} — ${Object.values(done.counts ?? {}).reduce((a, b) => a + b, 0)} رکورد`
                  : `❌ خطا: ${done.error}`}
              </span>
              {done.type === "done" && done.packageId && (
                <a href={`/api/admin/migration/${done.packageId}`} download style={{ background: "var(--primary)", color: "#fff", padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  ⬇️ دانلود
                </a>
              )}
            </div>
          )}
        </AdminCard>
      )}

      <AdminCard>
        <AdminCardHeader title="پکیج‌های ساخته‌شده" icon="ti-packages" subtitle={`${packages.length} پکیج`} />
        <div style={{ marginTop: 12 }}>
          {loading ? (
            <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />
          ) : packages.length === 0 ? (
            <AdminEmptyState icon="ti-package" title="هنوز پکیجی ساخته نشده" />
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <AdminTh>تاریخ</AdminTh>
                  <AdminTh>حجم</AdminTh>
                  <AdminTh>رکوردها</AdminTh>
                  <AdminTh>عملیات</AdminTh>
                </tr>
              </thead>
              <tbody>
                {packages.map((p) => (
                  <AdminTr key={p.id}>
                    <AdminTd style={{ fontWeight: 700 }}>{fmtDate(p.date)}</AdminTd>
                    <AdminTd>{fmtSize(p.sizeByte)}</AdminTd>
                    <AdminTd>{totalRecords(p).toLocaleString("fa-IR")} رکورد در {Object.keys(p.counts).length} جدول</AdminTd>
                    <AdminTd>
                      <div style={{ display: "flex", gap: 6 }}>
                        <a
                          href={`/api/admin/migration/${p.id}`}
                          download
                          style={{ background: "var(--primary)", color: "#fff", padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          <i className="ti ti-download" style={{ fontSize: 12 }} /> دانلود
                        </a>
                        <AdminBtn size="sm" icon="ti-search" loading={verifying === p.id} onClick={() => verifyPackage(p.id)}>بررسی</AdminBtn>
                        <AdminBtn size="sm" icon="ti-trash" variant="danger" onClick={() => deletePackage(p.id)} />
                      </div>
                    </AdminTd>
                  </AdminTr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </div>
      </AdminCard>

      <div style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: "var(--radius)", padding: "1.25rem" }}>
        <h3 style={{ fontSize: 13, fontWeight: 900, color: "#92400e", margin: "0 0 .75rem" }}>⚡ راهنمای نصب در سرور جدید</h3>
        <ol style={{ fontSize: 12, color: "#78350f", paddingRight: "1.25rem", lineHeight: 2 }}>
          <li>پکیج ZIP را دانلود و در پوشه سایت استخراج کنید</li>
          <li>اجرا کنید: <code style={{ background: "rgba(0,0,0,.08)", padding: "1px 6px", borderRadius: 4 }}>node installer-api.js</code></li>
          <li>فایل installer.html را در مرورگر باز کنید</li>
          <li>مراحل نصب را دنبال کنید</li>
          <li>بعد از نصب، فایل‌های installer.html و installer-api.js را حذف کنید</li>
        </ol>
      </div>
    </div>
  );
}
