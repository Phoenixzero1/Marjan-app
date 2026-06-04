"use client";

import { useState, useEffect, useRef } from "react";

interface LogEntry { type: "info" | "ok" | "error" | "warn" | "done" | "fail"; msg?: string; ts?: string; packageId?: string; size?: number; counts?: Record<string, number>; error?: string; }

interface Package { id: string; date: string; sizeByte: number; counts: Record<string, number>; }

type Toast = { msg: string; ok: boolean };

export default function MigrationManager() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [done, setDone] = useState<LogEntry | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  async function loadPackages() {
    try {
      const res = await fetch("/api/admin/migration/packages");
      const data = await res.json();
      setPackages(data.packages ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPackages(); }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  async function createPackage() {
    setCreating(true);
    setLogs([]);
    setDone(null);

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
            if (entry.type === "done" || entry.type === "fail") {
              setDone(entry);
            } else {
              setLogs((prev) => [...prev, entry]);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setDone({ type: "fail", error: String(err) });
    } finally {
      setCreating(false);
      loadPackages();
    }
  }

  async function deletePackage(id: string) {
    if (!window.confirm("آیا از حذف این پکیج مطمئن هستید؟")) return;
    const res = await fetch(`/api/admin/migration/${id}`, { method: "DELETE" });
    if (res.ok) { setPackages((prev) => prev.filter((p) => p.id !== id)); showToast("پکیج حذف شد"); }
    else showToast("خطا در حذف", false);
  }

  async function verifyPackage(id: string) {
    setVerifying(id);
    try {
      const res = await fetch(`/api/admin/migration/${id}`, { method: "PATCH" });
      const data = await res.json();
      if (data.ok) showToast("✅ فایل سالم است — MD5: " + data.md5?.slice(0, 8) + "...");
      else showToast("❌ فایل ممکن است آسیب دیده باشد", false);
    } catch { showToast("خطا در بررسی", false); }
    finally { setVerifying(null); }
  }

  const fmtSize = (b: number) => b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + " MB" : (b / 1024).toFixed(0) + " KB";
  const fmtDate = (s: string) => new Date(s).toLocaleString("fa-IR");
  const totalRecords = (p: Package) => Object.values(p.counts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)", maxWidth: 500, textAlign: "center" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>انتقال سایت</h2>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>ساخت پکیج کامل برای انتقال سایت به سرور جدید</p>
        </div>
        <button
          onClick={createPackage}
          disabled={creating}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "10px 20px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: creating ? "not-allowed" : "pointer", opacity: creating ? .7 : 1, display: "flex", alignItems: "center", gap: 8 }}
        >
          <i className="ti ti-package-export" style={{ fontSize: 16 }} />
          {creating ? "در حال ساخت..." : "ساخت پکیج انتقال"}
        </button>
      </div>

      {/* Live log */}
      {(creating || logs.length > 0 || done) && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem" }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-terminal-2" />لاگ ساخت پکیج
          </div>
          <div ref={logRef} style={{ background: "#0f2040", borderRadius: 8, padding: "12px 14px", height: 220, overflowY: "auto", fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>
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
        </div>
      )}

      {/* Package list */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", fontWeight: 900, fontSize: 14, color: "var(--primary)", display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-packages" />
          پکیج‌های ساخته‌شده
          <span style={{ marginRight: "auto", fontSize: 12, color: "var(--text3)", fontWeight: 400 }}>{packages.length} پکیج</span>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text3)" }}>
            <i className="ti ti-loader-2" style={{ fontSize: 24, display: "block" }} />
          </div>
        ) : packages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
            <i className="ti ti-package" style={{ fontSize: 40, display: "block", marginBottom: 8 }} />
            هنوز پکیجی ساخته نشده
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["تاریخ", "حجم", "رکوردها", "عملیات"].map((h) => (
                  <th key={h} style={{ background: "var(--bg)", padding: "10px 14px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packages.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < packages.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 700 }}>{fmtDate(p.date)}</td>
                  <td style={{ padding: "12px 14px", color: "var(--text2)" }}>{fmtSize(p.sizeByte)}</td>
                  <td style={{ padding: "12px 14px", color: "var(--text2)" }}>
                    {totalRecords(p).toLocaleString("fa-IR")} رکورد در {Object.keys(p.counts).length} جدول
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <a
                        href={`/api/admin/migration/${p.id}`}
                        download
                        style={{ background: "var(--primary)", color: "#fff", padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <i className="ti ti-download" style={{ fontSize: 12 }} /> دانلود
                      </a>
                      <button
                        onClick={() => verifyPackage(p.id)}
                        disabled={verifying === p.id}
                        style={{ background: "var(--bg)", color: "var(--text2)", border: "1.5px solid var(--border)", padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn" }}
                      >
                        {verifying === p.id ? "..." : "🔍 بررسی"}
                      </button>
                      <button
                        onClick={() => deletePackage(p.id)}
                        style={{ background: "#fdecea", color: "#c0392b", border: "1.5px solid #f5c6cb", padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn" }}
                      >
                        <i className="ti ti-trash" style={{ fontSize: 11 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Instructions */}
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
