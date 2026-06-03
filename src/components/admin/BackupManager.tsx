"use client";

import { useState, useEffect, useRef } from "react";

interface Counts {
  users: number; products: number; categories: number; orders: number;
  payments: number; coupons: number; blogPosts: number; blogCategories: number;
  reviews: number; blogComments: number; media: number; newsletter: number;
  siteSettings: number;
}

interface BackupRecord {
  id: string; filename: string; format: string; sizeByte: number;
  tableCount: number; status: string; createdAt: string;
  user?: { firstName: string; lastName: string } | null;
}

type Toast = { msg: string; ok: boolean };

const TABLE_GROUPS = [
  {
    label: "محتوا و کاربران", icon: "ti-users",
    tables: [
      { key: "users", label: "کاربران", countKey: "users" as keyof Counts },
      { key: "addresses", label: "آدرس‌ها", countKey: null },
      { key: "reviews", label: "نظرات محصولات", countKey: "reviews" as keyof Counts },
      { key: "sessions", label: "نشست‌ها", countKey: null },
      { key: "notifications", label: "اطلاع‌رسانی‌ها", countKey: null },
    ],
  },
  {
    label: "فروشگاه", icon: "ti-package",
    tables: [
      { key: "products", label: "محصولات", countKey: "products" as keyof Counts },
      { key: "categories", label: "دسته‌بندی‌ها", countKey: "categories" as keyof Counts },
      { key: "brands", label: "برندها", countKey: null },
      { key: "orders", label: "سفارشات", countKey: "orders" as keyof Counts },
      { key: "payments", label: "پرداخت‌ها", countKey: "payments" as keyof Counts },
      { key: "coupons", label: "کوپن‌ها", countKey: "coupons" as keyof Counts },
    ],
  },
  {
    label: "بلاگ", icon: "ti-news",
    tables: [
      { key: "blogPosts", label: "مقالات", countKey: "blogPosts" as keyof Counts },
      { key: "blogCategories", label: "دسته‌بندی بلاگ", countKey: "blogCategories" as keyof Counts },
      { key: "blogComments", label: "کامنت‌های بلاگ", countKey: "blogComments" as keyof Counts },
    ],
  },
  {
    label: "سیستم", icon: "ti-settings",
    tables: [
      { key: "media", label: "رسانه‌ها", countKey: "media" as keyof Counts },
      { key: "newsletter", label: "خبرنامه", countKey: "newsletter" as keyof Counts },
      { key: "siteSettings", label: "تنظیمات سایت", countKey: "siteSettings" as keyof Counts },
      { key: "faqs", label: "سوالات متداول", countKey: null },
    ],
  },
];

const ALL_KEYS = TABLE_GROUPS.flatMap((g) => g.tables.map((t) => t.key));

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fa-IR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function BackupManager() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [history, setHistory] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set(ALL_KEYS));
  const [format, setFormat] = useState<"sql" | "json">("sql");
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [activeTab, setActiveTab] = useState<"new" | "history" | "restore">("new");
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  };

  const load = () => {
    setLoading(true);
    fetch("/api/admin/backup")
      .then((r) => r.json())
      .then((d) => { setCounts(d.counts); setHistory(d.history ?? []); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  function toggleTable(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleGroup(keys: string[]) {
    const allSel = keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSel) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  }

  async function createBackup() {
    if (format === "json" && selected.size === 0) { showToast("حداقل یک جدول انتخاب کنید", false); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, tables: Array.from(selected) }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "خطا در تهیه پشتیبان", false); return; }
      showToast(`پشتیبان ${d.record.filename} ایجاد شد`);
      load();
      setActiveTab("history");
    } finally {
      setCreating(false);
    }
  }

  async function downloadBackup(id: string, filename: string) {
    const res = await fetch(`/api/admin/backup/${id}`);
    if (!res.ok) { showToast("خطا در دانلود فایل", false); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteBackup(id: string) {
    if (!confirm("آیا مطمئن هستید؟ فایل پشتیبان از دیسک حذف می‌شود.")) return;
    const res = await fetch(`/api/admin/backup/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("پشتیبان حذف شد"); setHistory((h) => h.filter((b) => b.id !== id)); }
    else showToast("خطا در حذف پشتیبان", false);
  }

  async function restore() {
    const file = fileRef.current?.files?.[0];
    if (!file) { showToast("فایل پشتیبان را انتخاب کنید", false); return; }
    if (!file.name.endsWith(".json")) { showToast("فقط فایل‌های JSON پشتیبان پشتیبانی می‌شوند", false); return; }
    if (!confirm("این عملیات داده‌های موجود را با فایل پشتیبان جایگزین می‌کند. ادامه می‌دهید؟")) return;
    setRestoring(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/backup/restore", { method: "POST", body: fd });
      const d = await res.json();
      if (res.ok) showToast(d.message ?? "بازیابی انجام شد");
      else showToast(d.error ?? "خطا در بازیابی", false);
    } finally {
      setRestoring(false);
    }
  }

  const totalRecords = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const lastBackup = history.find((h) => h.status === "completed");

  const tabBtn = (t: "new" | "history" | "restore", label: string, icon: string) => (
    <button
      onClick={() => setActiveTab(t)}
      style={{
        background: activeTab === t ? "var(--primary)" : "#fff",
        color: activeTab === t ? "#fff" : "var(--text2)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius-sm)", padding: "9px 18px",
        fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
      }}
    >
      <i className={`ti ${icon}`} /> {label}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>پشتیبان‌گیری</h2>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>
            {lastBackup ? <span>آخرین پشتیبان: <strong>{fmtDate(lastBackup.createdAt)}</strong></span> : "هنوز پشتیبانی گرفته نشده"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {tabBtn("new", "پشتیبان جدید", "ti-plus")}
          {tabBtn("history", `تاریخچه (${history.length})`, "ti-history")}
          {tabBtn("restore", "بازیابی", "ti-restore")}
        </div>
      </div>

      {/* Stats */}
      {!loading && counts && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.5rem", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { icon: "ti-database", bg: "#dbeafe", color: "#2563eb", val: totalRecords.toLocaleString("fa-IR"), label: "کل رکورد" },
            { icon: "ti-table", bg: "#dcfce7", color: "#16a34a", val: ALL_KEYS.length.toLocaleString("fa-IR"), label: "جدول قابل بکاپ" },
            { icon: "ti-history", bg: "#fef9c3", color: "#ca8a04", val: String(history.length), label: "پشتیبان موجود" },
            { icon: "ti-file-zip", bg: "#fce7f3", color: "#be185d", val: fmtSize(history.reduce((s, h) => s + h.sizeByte, 0)), label: "حجم کل پشتیبان‌ها" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className={`ti ${s.icon}`} style={{ fontSize: 20, color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── NEW BACKUP TAB ── */}
      {activeTab === "new" && (
        <>
          {/* Format selector */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: 12 }}>فرمت پشتیبان</div>
            <div style={{ display: "flex", gap: 12 }}>
              {([
                { val: "sql", icon: "ti-database-export", label: "SQL (pg_dump)", desc: "فایل SQL کامل — قابل بازیابی مستقیم با psql" },
                { val: "json", icon: "ti-file-type-js", label: "JSON", desc: "داده‌های انتخابی به فرمت JSON — انتخاب جدول دارد" },
              ] as { val: "sql" | "json"; icon: string; label: string; desc: string }[]).map((f) => (
                <label
                  key={f.val}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px",
                    border: `2px solid ${format === f.val ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)", cursor: "pointer", flex: 1,
                    background: format === f.val ? "#eff6ff" : "#fff",
                  }}
                >
                  <input type="radio" name="format" value={f.val} checked={format === f.val} onChange={() => setFormat(f.val)} style={{ marginTop: 3 }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 900, fontSize: 14, color: "var(--primary)" }}>
                      <i className={`ti ${f.icon}`} /> {f.label}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{f.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Table selector (JSON only) */}
          {format === "json" && (
            <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>انتخاب جداول ({selected.size}/{ALL_KEYS.length})</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setSelected(new Set(ALL_KEYS))} style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>همه</button>
                  <button onClick={() => setSelected(new Set())} style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>هیچ‌کدام</button>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text3)" }}>در حال بارگذاری...</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                  {TABLE_GROUPS.map((group) => {
                    const groupKeys = group.tables.map((t) => t.key);
                    const allSel = groupKeys.every((k) => selected.has(k));
                    const someSel = groupKeys.some((k) => selected.has(k));
                    return (
                      <div key={group.label} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                        <div
                          onClick={() => toggleGroup(groupKeys)}
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: allSel ? "#eff6ff" : someSel ? "#f8fafc" : "var(--bg)", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                        >
                          <input
                            type="checkbox" checked={allSel}
                            ref={(el) => { if (el) el.indeterminate = someSel && !allSel; }}
                            onChange={() => toggleGroup(groupKeys)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <i className={`ti ${group.icon}`} style={{ color: "var(--accent)", fontSize: 16 }} />
                          <span style={{ fontWeight: 900, fontSize: 13, color: "var(--primary)" }}>{group.label}</span>
                        </div>
                        {group.tables.map((t) => {
                          const count = t.countKey && counts ? counts[t.countKey] : null;
                          return (
                            <label key={t.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: selected.has(t.key) ? "#f0f9ff" : "#fff" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input type="checkbox" checked={selected.has(t.key)} onChange={() => toggleTable(t.key)} />
                                <span style={{ fontSize: 13, color: "var(--text)", fontWeight: selected.has(t.key) ? 700 : 400 }}>{t.label}</span>
                              </div>
                              {count !== null && (
                                <span style={{ fontSize: 11, color: "var(--text3)", background: "var(--bg)", borderRadius: 10, padding: "1px 8px", border: "1px solid var(--border)" }}>
                                  {count.toLocaleString("fa-IR")}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Create button */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--text3)" }}>
              {format === "sql"
                ? "فایل SQL کامل از تمام جداول با استفاده از pg_dump"
                : `فایل JSON شامل ${selected.size} جدول`}
            </div>
            <button
              onClick={createBackup}
              disabled={creating}
              style={{ background: creating ? "#aaa" : "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "11px 28px", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 900, cursor: creating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              {creating ? <><i className="ti ti-loader-2" /> در حال تهیه پشتیبان...</> : <><i className="ti ti-database-export" /> ایجاد پشتیبان</>}
            </button>
          </div>

          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "var(--radius-sm)", padding: "12px 16px", fontSize: 12, color: "#1d4ed8", lineHeight: 1.8 }}>
            <i className="ti ti-info-circle" style={{ marginLeft: 6 }} />
            پشتیبان‌های SQL با pg_dump تهیه می‌شوند و با دستور <code>psql</code> قابل بازیابی هستند.
            رمزهای عبور در پشتیبان JSON شامل نمی‌شوند. پشتیبان‌های خودکار هر ۲۴ ساعت یک‌بار از طریق endpoint
            <code style={{ margin: "0 4px" }}>/api/admin/backup/cron</code> قابل تنظیم هستند.
          </div>
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === "history" && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem" }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1.25rem" }}>تاریخچه پشتیبان‌ها</h3>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
              <i className="ti ti-database-off" style={{ fontSize: 40, display: "block", marginBottom: 10 }} />
              هنوز پشتیبانی گرفته نشده
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--bg2)" }}>
                  {["نام فایل", "فرمت", "حجم", "جداول", "ایجادکننده", "تاریخ", "وضعیت", "عملیات"].map((h) => (
                    <th key={h} style={{ textAlign: "right", padding: "8px 10px", fontWeight: 900, color: "var(--text3)", fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--bg)" }}>
                    <td style={{ padding: 10, fontWeight: 700, fontSize: 12, color: "var(--text)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.filename}
                    </td>
                    <td style={{ padding: 10 }}>
                      <span style={{ background: b.format === "sql" ? "#dbeafe" : "#dcfce7", color: b.format === "sql" ? "#2563eb" : "#16a34a", fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 10 }}>
                        {b.format.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 10, color: "var(--text2)" }}>{fmtSize(b.sizeByte)}</td>
                    <td style={{ padding: 10, color: "var(--text3)" }}>{b.tableCount || "—"}</td>
                    <td style={{ padding: 10, color: "var(--text3)", fontSize: 12 }}>
                      {b.user ? `${b.user.firstName} ${b.user.lastName}` : "خودکار"}
                    </td>
                    <td style={{ padding: 10, color: "var(--text3)", fontSize: 12 }}>{fmtDate(b.createdAt)}</td>
                    <td style={{ padding: 10 }}>
                      <span style={{ background: b.status === "completed" ? "#dcfce7" : "#fee2e2", color: b.status === "completed" ? "#16a34a" : "#dc2626", fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 10 }}>
                        {b.status === "completed" ? "موفق" : "ناموفق"}
                      </span>
                    </td>
                    <td style={{ padding: 10 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {b.status === "completed" && (
                          <button
                            onClick={() => downloadBackup(b.id, b.filename)}
                            style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn", color: "var(--primary)", display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <i className="ti ti-download" /> دانلود
                          </button>
                        )}
                        <button
                          onClick={() => deleteBackup(b.id)}
                          style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn", color: "#dc2626", display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <i className="ti ti-trash" /> حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── RESTORE TAB ── */}
      {activeTab === "restore" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: 8 }}>بازیابی از فایل JSON</h3>
            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
              فایل JSON پشتیبان را انتخاب کنید. داده‌های قابل بازیابی: تنظیمات سایت، دسته‌های بلاگ، مقالات، خبرنامه.
              رکوردهای تکراری نادیده گرفته می‌شوند.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer" }}
              />
              <button
                onClick={restore}
                disabled={restoring}
                style={{ background: restoring ? "#aaa" : "#f59e0b", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "10px 22px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: restoring ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                {restoring ? <><i className="ti ti-loader-2" /> در حال بازیابی...</> : <><i className="ti ti-restore" /> بازیابی</>}
              </button>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: 8 }}>بازیابی از فایل SQL</h3>
            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
              برای بازیابی از فایل SQL (pg_dump)، دستور زیر را در ترمینال اجرا کنید:
            </p>
            <pre style={{ background: "#1e293b", color: "#e2e8f0", borderRadius: "var(--radius-sm)", padding: "1rem 1.25rem", fontSize: 12, overflowX: "auto", marginTop: 10, fontFamily: "monospace", direction: "ltr" }}>
{`psql -h localhost -p 5432 -U postgres -d marjan_db < backup-file.sql`}
            </pre>
          </div>

          <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "var(--radius-sm)", padding: "12px 16px", fontSize: 12, color: "#92400e", lineHeight: 1.8 }}>
            <i className="ti ti-alert-triangle" style={{ marginLeft: 6 }} />
            <strong>هشدار:</strong> بازیابی ممکن است داده‌های موجود را تغییر دهد. قبل از بازیابی یک پشتیبان جدید از وضعیت فعلی بگیرید.
          </div>
        </div>
      )}
    </div>
  );
}
