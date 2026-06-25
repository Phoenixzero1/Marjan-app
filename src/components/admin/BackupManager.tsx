"use client";

import { useState, useEffect, useRef } from "react";
import {
  AdminPageHeader, AdminToolbar, AdminBtn, AdminTable, AdminTh, AdminTd, AdminTr,
  AdminBadge, AdminEmptyState, AdminCard, AdminCardHeader, AdminTabs,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

interface Counts { users: number; products: number; categories: number; orders: number; payments: number; coupons: number; blogPosts: number; blogCategories: number; reviews: number; blogComments: number; media: number; newsletter: number; siteSettings: number; }
interface BackupRecord { id: string; filename: string; format: string; sizeByte: number; tableCount: number; status: string; createdAt: string; user?: { firstName: string; lastName: string } | null; }

const TABLE_GROUPS = [
  { label: "محتوا و کاربران", icon: "ti-users", tables: [{ key: "users", label: "کاربران", countKey: "users" as keyof Counts }, { key: "addresses", label: "آدرس‌ها", countKey: null }, { key: "reviews", label: "نظرات محصولات", countKey: "reviews" as keyof Counts }, { key: "sessions", label: "نشست‌ها", countKey: null }, { key: "notifications", label: "اطلاع‌رسانی‌ها", countKey: null }] },
  { label: "فروشگاه", icon: "ti-package", tables: [{ key: "products", label: "محصولات", countKey: "products" as keyof Counts }, { key: "categories", label: "دسته‌بندی‌ها", countKey: "categories" as keyof Counts }, { key: "brands", label: "برندها", countKey: null }, { key: "orders", label: "سفارشات", countKey: "orders" as keyof Counts }, { key: "payments", label: "پرداخت‌ها", countKey: "payments" as keyof Counts }, { key: "coupons", label: "کوپن‌ها", countKey: "coupons" as keyof Counts }] },
  { label: "بلاگ", icon: "ti-news", tables: [{ key: "blogPosts", label: "مقالات", countKey: "blogPosts" as keyof Counts }, { key: "blogCategories", label: "دسته‌بندی بلاگ", countKey: "blogCategories" as keyof Counts }, { key: "blogComments", label: "کامنت‌های بلاگ", countKey: "blogComments" as keyof Counts }] },
  { label: "سیستم", icon: "ti-settings", tables: [{ key: "media", label: "رسانه‌ها", countKey: "media" as keyof Counts }, { key: "newsletter", label: "خبرنامه", countKey: "newsletter" as keyof Counts }, { key: "siteSettings", label: "تنظیمات سایت", countKey: "siteSettings" as keyof Counts }, { key: "faqs", label: "سوالات متداول", countKey: null }] },
];
const ALL_KEYS = TABLE_GROUPS.flatMap(g => g.tables.map(t => t.key));

function fmtSize(b: number) { if (b < 1024) return `${b} B`; if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`; return `${(b / 1048576).toFixed(2)} MB`; }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }); }

export default function BackupManager() {
  const { toast, showToast } = useAdminToast();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [history, setHistory] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set(ALL_KEYS));
  const [format, setFormat] = useState<"sql" | "json">("sql");
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [activeTab, setActiveTab] = useState("new");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/backup").then(r => r.json()).then(d => { setCounts(d.counts); setHistory(d.history ?? []); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  function toggleTable(key: string) { setSelected(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; }); }
  function toggleGroup(keys: string[]) { const allSel = keys.every(k => selected.has(k)); setSelected(prev => { const n = new Set(prev); if (allSel) keys.forEach(k => n.delete(k)); else keys.forEach(k => n.add(k)); return n; }); }

  async function createBackup() {
    if (format === "json" && selected.size === 0) { showToast("error", "حداقل یک جدول انتخاب کنید"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ format, tables: Array.from(selected) }) });
      const d = await res.json();
      if (!res.ok) { showToast("error", d.error ?? "خطا در تهیه پشتیبان"); return; }
      showToast("success", `پشتیبان ${d.record.filename} ایجاد شد`); load(); setActiveTab("history");
    } finally { setCreating(false); }
  }

  async function downloadBackup(id: string, filename: string) {
    const res = await fetch(`/api/admin/backup/${id}`);
    if (!res.ok) { showToast("error", "خطا در دانلود فایل"); return; }
    const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }

  async function deleteBackup(id: string) {
    if (!confirm("آیا مطمئن هستید؟ فایل پشتیبان از دیسک حذف می‌شود.")) return;
    const res = await fetch(`/api/admin/backup/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("success", "پشتیبان حذف شد"); setHistory(h => h.filter(b => b.id !== id)); }
    else showToast("error", "خطا در حذف پشتیبان");
  }

  async function restore() {
    const file = fileRef.current?.files?.[0];
    if (!file) { showToast("error", "فایل پشتیبان را انتخاب کنید"); return; }
    if (!file.name.endsWith(".json")) { showToast("error", "فقط فایل‌های JSON پشتیبانی می‌شوند"); return; }
    if (!confirm("این عملیات داده‌های موجود را با فایل پشتیبان جایگزین می‌کند. ادامه می‌دهید؟")) return;
    setRestoring(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/admin/backup/restore", { method: "POST", body: fd });
      const d = await res.json();
      if (res.ok) showToast("success", d.message ?? "بازیابی انجام شد");
      else showToast("error", d.error ?? "خطا در بازیابی");
    } finally { setRestoring(false); }
  }

  const totalRecords = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const lastBackup = history.find(h => h.status === "completed");

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="پشتیبان‌گیری" icon="ti-database-export" count={history.length}
        subtitle={lastBackup ? `آخرین پشتیبان: ${fmtDate(lastBackup.createdAt)}` : "هنوز پشتیبانی گرفته نشده"}
        actions={<AdminBtn icon="ti-refresh" onClick={load}>بروزرسانی</AdminBtn>}
      />

      {/* Stats */}
      {!loading && counts && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { icon: "ti-database", color: "#2563eb", val: totalRecords.toLocaleString("fa-IR"), label: "کل رکورد" },
            { icon: "ti-table", color: "#16a34a", val: String(ALL_KEYS.length), label: "جدول قابل بکاپ" },
            { icon: "ti-history", color: "#ca8a04", val: String(history.length), label: "پشتیبان موجود" },
            { icon: "ti-file-zip", color: "#be185d", val: fmtSize(history.reduce((s, h) => s + h.sizeByte, 0)), label: "حجم کل پشتیبان‌ها" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 20, color: s.color }} />
              <div><div style={{ fontSize: 18, fontWeight: 900, color: "var(--text1)", lineHeight: 1 }}>{s.val}</div><div style={{ fontSize: 11, color: "var(--text3)" }}>{s.label}</div></div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <AdminTabs active={activeTab} onChange={setActiveTab}
          tabs={[{ id: "new", label: "پشتیبان جدید", icon: "ti-plus" }, { id: "history", label: `تاریخچه (${history.length})`, icon: "ti-history" }, { id: "restore", label: "بازیابی", icon: "ti-restore" }]}
        />
      </div>

      {activeTab === "new" && (
        <>
          <AdminCard>
            <AdminCardHeader title="فرمت پشتیبان" icon="ti-file-type-sql" />
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              {([{ val: "sql", icon: "ti-database-export", label: "SQL (pg_dump)", desc: "فایل SQL کامل — قابل بازیابی با psql" }, { val: "json", icon: "ti-file-type-js", label: "JSON", desc: "داده‌های انتخابی به فرمت JSON — انتخاب جدول دارد" }] as { val: "sql" | "json"; icon: string; label: string; desc: string }[]).map(f => (
                <label key={f.val} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", border: `2px solid ${format === f.val ? "var(--primary)" : "var(--border)"}`, borderRadius: 8, cursor: "pointer", flex: 1, background: format === f.val ? "#eff6ff" : "#fff" }}>
                  <input type="radio" name="format" value={f.val} checked={format === f.val} onChange={() => setFormat(f.val)} style={{ marginTop: 3 }} />
                  <div><div style={{ fontWeight: 900, fontSize: 13, color: "var(--primary)", display: "flex", alignItems: "center", gap: 6 }}><i className={`ti ${f.icon}`} /> {f.label}</div><div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{f.desc}</div></div>
                </label>
              ))}
            </div>
          </AdminCard>

          {format === "json" && (
            <AdminCard>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontWeight: 900, color: "var(--primary)" }}>انتخاب جداول ({selected.size}/{ALL_KEYS.length})</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <AdminBtn size="sm" onClick={() => setSelected(new Set(ALL_KEYS))}>همه</AdminBtn>
                  <AdminBtn size="sm" onClick={() => setSelected(new Set())}>هیچ‌کدام</AdminBtn>
                </div>
              </div>
              {loading ? <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /> : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                  {TABLE_GROUPS.map(group => {
                    const groupKeys = group.tables.map(t => t.key);
                    const allSel = groupKeys.every(k => selected.has(k));
                    const someSel = groupKeys.some(k => selected.has(k));
                    return (
                      <div key={group.label} style={{ border: "1.5px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                        <div onClick={() => toggleGroup(groupKeys)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: allSel ? "#eff6ff" : someSel ? "#f8fafc" : "var(--bg)", cursor: "pointer", borderBottom: "1px solid var(--border)" }}>
                          <input type="checkbox" checked={allSel} ref={el => { if (el) el.indeterminate = someSel && !allSel; }} onChange={() => toggleGroup(groupKeys)} onClick={e => e.stopPropagation()} />
                          <i className={`ti ${group.icon}`} style={{ color: "var(--accent)", fontSize: 15 }} />
                          <span style={{ fontWeight: 900, fontSize: 12, color: "var(--primary)" }}>{group.label}</span>
                        </div>
                        {group.tables.map(t => {
                          const count = t.countKey && counts ? counts[t.countKey] : null;
                          return (
                            <label key={t.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: selected.has(t.key) ? "#f0f9ff" : "#fff" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input type="checkbox" checked={selected.has(t.key)} onChange={() => toggleTable(t.key)} />
                                <span style={{ fontSize: 12, fontWeight: selected.has(t.key) ? 700 : 400 }}>{t.label}</span>
                              </div>
                              {count !== null && <span style={{ fontSize: 10, color: "var(--text3)", background: "var(--bg)", borderRadius: 10, padding: "1px 6px", border: "1px solid var(--border)" }}>{count.toLocaleString("fa-IR")}</span>}
                            </label>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </AdminCard>
          )}

          <AdminCard>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--text3)" }}>{format === "sql" ? "فایل SQL کامل از تمام جداول" : `فایل JSON شامل ${selected.size} جدول`}</span>
              <AdminBtn icon="ti-database-export" variant="primary" loading={creating} onClick={createBackup}>
                {creating ? "در حال تهیه پشتیبان..." : "ایجاد پشتیبان"}
              </AdminBtn>
            </div>
          </AdminCard>

          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#1d4ed8", lineHeight: 1.8 }}>
            <i className="ti ti-info-circle" style={{ marginLeft: 6 }} />
            پشتیبان‌های SQL با pg_dump تهیه می‌شوند و با دستور <code>psql</code> قابل بازیابی هستند.
          </div>
        </>
      )}

      {activeTab === "history" && (
        <AdminTable>
          <thead>
            <tr><AdminTh>نام فایل</AdminTh><AdminTh>فرمت</AdminTh><AdminTh>حجم</AdminTh><AdminTh>جداول</AdminTh><AdminTh>ایجادکننده</AdminTh><AdminTh>تاریخ</AdminTh><AdminTh>وضعیت</AdminTh><AdminTh style={{ width: 130 }}>عملیات</AdminTh></tr>
          </thead>
          <tbody>
            {history.length === 0 && <tr><td colSpan={8}><AdminEmptyState icon="ti-database-off" title="هنوز پشتیبانی گرفته نشده" /></td></tr>}
            {history.map(b => (
              <AdminTr key={b.id}>
                <AdminTd style={{ fontSize: 11, fontFamily: "monospace", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.filename}</AdminTd>
                <AdminTd><AdminBadge variant={b.format === "sql" ? "info" : "success"} size="xs">{b.format.toUpperCase()}</AdminBadge></AdminTd>
                <AdminTd style={{ color: "var(--text2)" }}>{fmtSize(b.sizeByte)}</AdminTd>
                <AdminTd style={{ color: "var(--text3)" }}>{b.tableCount || "—"}</AdminTd>
                <AdminTd style={{ fontSize: 12, color: "var(--text3)" }}>{b.user ? `${b.user.firstName} ${b.user.lastName}` : "خودکار"}</AdminTd>
                <AdminTd style={{ fontSize: 12, color: "var(--text3)" }}>{fmtDate(b.createdAt)}</AdminTd>
                <AdminTd><AdminBadge variant={b.status === "completed" ? "success" : "danger"} dot>{b.status === "completed" ? "موفق" : "ناموفق"}</AdminBadge></AdminTd>
                <AdminTd>
                  <div style={{ display: "flex", gap: 4 }}>
                    {b.status === "completed" && <AdminBtn size="sm" icon="ti-download" onClick={() => downloadBackup(b.id, b.filename)}>دانلود</AdminBtn>}
                    <AdminBtn size="sm" icon="ti-trash" variant="danger" onClick={() => deleteBackup(b.id)} />
                  </div>
                </AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      )}

      {activeTab === "restore" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AdminCard>
            <AdminCardHeader title="بازیابی از فایل JSON" icon="ti-restore" />
            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, margin: "12px 0" }}>فایل JSON پشتیبان را انتخاب کنید. رکوردهای تکراری نادیده گرفته می‌شوند.</p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input ref={fileRef} type="file" accept=".json" style={{ border: "1.5px solid var(--border)", borderRadius: 7, padding: "7px 10px", fontSize: 12 }} />
              <AdminBtn icon="ti-restore" loading={restoring} style={{ background: "#f59e0b", border: "none" }} onClick={restore}>{restoring ? "در حال بازیابی..." : "بازیابی"}</AdminBtn>
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="بازیابی از فایل SQL" icon="ti-terminal" />
            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, margin: "12px 0" }}>برای بازیابی از فایل SQL، دستور زیر را در ترمینال اجرا کنید:</p>
            <pre style={{ background: "#1e293b", color: "#e2e8f0", borderRadius: 8, padding: "1rem", fontSize: 12, overflowX: "auto", fontFamily: "monospace", direction: "ltr" }}>{`psql -h localhost -p 5432 -U postgres -d marjan_db < backup-file.sql`}</pre>
          </AdminCard>

          <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#92400e" }}>
            <i className="ti ti-alert-triangle" style={{ marginLeft: 6 }} />
            <strong>هشدار:</strong> بازیابی ممکن است داده‌های موجود را تغییر دهد. قبل از بازیابی یک پشتیبان جدید بگیرید.
          </div>
        </div>
      )}
    </div>
  );
}
