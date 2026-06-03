"use client";

import { useState, useEffect } from "react";

interface Counts {
  users: number; products: number; categories: number; orders: number;
  payments: number; coupons: number; blogPosts: number; blogCategories: number;
  reviews: number; blogComments: number; media: number; newsletter: number;
  siteSettings: number;
}

type Toast = { msg: string; ok: boolean };

const TABLE_GROUPS = [
  {
    label: "محتوا و کاربران",
    icon: "ti-users",
    tables: [
      { key: "users",          label: "کاربران",           countKey: "users" as keyof Counts },
      { key: "addresses",      label: "آدرس‌ها",           countKey: null },
      { key: "reviews",        label: "نظرات محصولات",      countKey: "reviews" as keyof Counts },
    ],
  },
  {
    label: "فروشگاه",
    icon: "ti-package",
    tables: [
      { key: "products",       label: "محصولات",            countKey: "products" as keyof Counts },
      { key: "categories",     label: "دسته‌بندی‌ها",       countKey: "categories" as keyof Counts },
      { key: "brands",         label: "برندها",             countKey: null },
      { key: "orders",         label: "سفارشات",            countKey: "orders" as keyof Counts },
      { key: "payments",       label: "پرداخت‌ها",          countKey: "payments" as keyof Counts },
      { key: "coupons",        label: "کوپن‌ها",            countKey: "coupons" as keyof Counts },
    ],
  },
  {
    label: "بلاگ",
    icon: "ti-news",
    tables: [
      { key: "blogPosts",      label: "مقالات",             countKey: "blogPosts" as keyof Counts },
      { key: "blogCategories", label: "دسته‌بندی بلاگ",     countKey: "blogCategories" as keyof Counts },
      { key: "blogComments",   label: "کامنت‌های بلاگ",    countKey: "blogComments" as keyof Counts },
    ],
  },
  {
    label: "سیستم",
    icon: "ti-settings",
    tables: [
      { key: "media",          label: "رسانه‌ها",            countKey: "media" as keyof Counts },
      { key: "newsletter",     label: "خبرنامه",            countKey: "newsletter" as keyof Counts },
      { key: "siteSettings",   label: "تنظیمات سایت",       countKey: "siteSettings" as keyof Counts },
      { key: "faqs",           label: "سوالات متداول",       countKey: null },
    ],
  },
];

const ALL_KEYS = TABLE_GROUPS.flatMap(g => g.tables.map(t => t.key));

export default function BackupManager() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set(ALL_KEYS));
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch("/api/admin/backup")
      .then(r => r.json())
      .then(d => {
        setCounts(d.counts);
        setLastBackupAt(d.lastBackupAt);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleTable(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleGroup(keys: string[]) {
    const allSelected = keys.every(k => selected.has(k));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) keys.forEach(k => next.delete(k));
      else keys.forEach(k => next.add(k));
      return next;
    });
  }

  function selectAll() { setSelected(new Set(ALL_KEYS)); }
  function selectNone() { setSelected(new Set()); }

  async function handleDownload() {
    if (selected.size === 0) { showToast("حداقل یک جدول انتخاب کنید", false); return; }
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables: Array.from(selected) }),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error ?? "خطا در تهیه پشتیبان", false);
        return;
      }
      const blob = await res.blob();
      const filename = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1]
        ?? `marjan-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      const now = new Date().toISOString();
      setLastBackupAt(now);
      showToast(`پشتیبان با موفقیت دانلود شد (${selected.size} جدول)`);
    } finally {
      setDownloading(false);
    }
  }

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const totalRecords = counts
    ? Object.values(counts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>پشتیبان‌گیری</h2>
        <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>
          {lastBackupAt
            ? <span>آخرین پشتیبان: <strong>{fmtDate(lastBackupAt)}</strong></span>
            : "هنوز پشتیبانی گرفته نشده"}
        </p>
      </div>

      {/* Summary bar */}
      {!loading && counts && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.5rem", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-database" style={{ fontSize: 20, color: "#2563eb" }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)" }}>{totalRecords.toLocaleString("fa-IR")}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>کل رکورد در پایگاه داده</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-table" style={{ fontSize: 20, color: "#16a34a" }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)" }}>{ALL_KEYS.length.toLocaleString("fa-IR")}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>جدول قابل پشتیبان‌گیری</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-check" style={{ fontSize: 20, color: "#ca8a04" }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)" }}>{selected.size.toLocaleString("fa-IR")}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>جدول انتخاب‌شده</div>
            </div>
          </div>
        </div>
      )}

      {/* Table selector */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>انتخاب جداول</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={selectAll} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>انتخاب همه</button>
            <button onClick={selectNone} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>لغو همه</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text3)" }}>
            <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />در حال بارگذاری...
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {TABLE_GROUPS.map(group => {
              const groupKeys = group.tables.map(t => t.key);
              const allSelected = groupKeys.every(k => selected.has(k));
              const someSelected = groupKeys.some(k => selected.has(k));

              return (
                <div key={group.label} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  {/* Group header */}
                  <div
                    onClick={() => toggleGroup(groupKeys)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: allSelected ? "#eff6ff" : someSelected ? "#f8fafc" : "var(--surface)", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={() => toggleGroup(groupKeys)}
                      onClick={e => e.stopPropagation()}
                      style={{ cursor: "pointer" }}
                    />
                    <i className={`ti ${group.icon}`} style={{ color: "var(--accent)", fontSize: 16 }} />
                    <span style={{ fontWeight: 900, fontSize: 13, color: "var(--primary)" }}>{group.label}</span>
                  </div>

                  {/* Tables in group */}
                  {group.tables.map(t => {
                    const count = t.countKey && counts ? counts[t.countKey] : null;
                    return (
                      <label
                        key={t.key}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: selected.has(t.key) ? "#f0f9ff" : "#fff" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="checkbox" checked={selected.has(t.key)} onChange={() => toggleTable(t.key)} style={{ cursor: "pointer" }} />
                          <span style={{ fontSize: 13, color: "var(--text)", fontWeight: selected.has(t.key) ? 700 : 400 }}>{t.label}</span>
                        </div>
                        {count !== null && (
                          <span style={{ fontSize: 11, color: "var(--text3)", background: "var(--surface)", borderRadius: 10, padding: "1px 8px", border: "1px solid var(--border)" }}>
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

      {/* Download button */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 13, color: "var(--text3)" }}>
          فایل JSON شامل <strong style={{ color: "var(--primary)" }}>{selected.size}</strong> جدول دانلود خواهد شد
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading || selected.size === 0}
          style={{
            background: downloading || selected.size === 0 ? "#aaa" : "var(--accent)",
            color: "#fff", border: "none", borderRadius: "var(--radius-sm)",
            padding: "11px 28px", fontFamily: "Vazirmatn", fontSize: 14,
            fontWeight: 900, cursor: downloading || selected.size === 0 ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {downloading
            ? <><i className="ti ti-loader-2" /> در حال تهیه پشتیبان...</>
            : <><i className="ti ti-download" /> دانلود پشتیبان</>}
        </button>
      </div>

      {/* Info box */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "var(--radius-sm)", padding: "12px 16px", fontSize: 12, color: "#1d4ed8", lineHeight: 1.8 }}>
        <i className="ti ti-info-circle" style={{ marginLeft: 6 }} />
        فایل پشتیبان به فرمت JSON است و شامل تمام داده‌های انتخابی از پایگاه داده می‌باشد.
        رمزهای عبور کاربران در فایل پشتیبان <strong>شامل نمی‌شود</strong>.
        برای بازیابی، از تیم فنی کمک بگیرید.
      </div>
    </div>
  );
}
