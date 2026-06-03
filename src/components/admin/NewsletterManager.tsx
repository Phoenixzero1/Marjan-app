"use client";

import { useState, useEffect, useCallback } from "react";

interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

interface Summary { total: number; active: number; inactive: number }
type Toast = { msg: string; ok: boolean };

export default function NewsletterManager() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, active: 0, inactive: 0 });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (q.trim()) params.set("q", q.trim());
      if (activeFilter) params.set("active", activeFilter);
      const res = await fetch(`/api/admin/newsletter?${params}`);
      const data = await res.json();
      setSubscribers(data.subscribers ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(pg);
      if (data.summary) setSummary(data.summary);
    } finally {
      setLoading(false);
    }
  }, [q, activeFilter]);

  useEffect(() => { load(1); }, [load]);

  async function handleAdd() {
    if (!newEmail.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "خطا در افزودن", false); return; }
      showToast("ایمیل اضافه شد");
      setNewEmail("");
      load(1);
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(s: Subscriber) {
    setActing(s.id);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, isActive: !s.isActive }),
      });
      if (res.ok) {
        showToast(s.isActive ? "اشتراک غیرفعال شد" : "اشتراک فعال شد");
        setSubscribers(prev => prev.map(x => x.id === s.id ? { ...x, isActive: !s.isActive } : x));
        setSummary(prev => ({
          ...prev,
          active: s.isActive ? prev.active - 1 : prev.active + 1,
          inactive: s.isActive ? prev.inactive + 1 : prev.inactive - 1,
        }));
      }
    } finally {
      setActing(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("این اشتراک حذف شود؟")) return;
    setActing(id);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { showToast("حذف شد"); load(page); }
      else showToast("خطا در حذف", false);
    } finally {
      setActing(null);
    }
  }

  async function handleDeleteInactive() {
    if (!confirm(`${summary.inactive.toLocaleString("fa-IR")} اشتراک غیرفعال حذف شود؟`)) return;
    const res = await fetch("/api/admin/newsletter", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteInactive: true }),
    });
    const data = await res.json();
    if (res.ok) { showToast(`${data.deleted} اشتراک حذف شد`); load(1); }
    else showToast("خطا در حذف", false);
  }

  function handleExport() {
    const active = subscribers.filter(s => s.isActive).map(s => s.email);
    const all = subscribers.map(s => s.email);
    const list = activeFilter === "false" ? subscribers.filter(s => !s.isActive).map(s => s.email) : activeFilter === "true" ? active : all;
    const blob = new Blob([list.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "newsletter-emails.txt"; a.click();
    URL.revokeObjectURL(url);
    showToast(`${list.length} ایمیل exported شد`);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === subscribers.length) setSelected(new Set());
    else setSelected(new Set(subscribers.map(s => s.id)));
  }

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>مدیریت خبرنامه</h2>
        <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>مشترکین ایمیل خبرنامه فروشگاه</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { label: "کل مشترکین", value: summary.total, icon: "ti-mail", color: "#2563eb" },
          { label: "فعال",       value: summary.active,   icon: "ti-circle-check", color: "#16a34a" },
          { label: "غیرفعال",   value: summary.inactive, icon: "ti-circle-x",    color: "#94a3b8" },
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

      {/* Add email */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "16px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 10 }}>افزودن ایمیل دستی</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="example@email.com"
            style={{ flex: 1, border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", direction: "ltr", textAlign: "left" }}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newEmail.trim()}
            style={{ background: adding ? "#aaa" : "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "9px 18px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <i className="ti ti-plus" /> افزودن
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(1)}
          placeholder="جستجو ایمیل..."
          style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", minWidth: 220, direction: "ltr", textAlign: "left" }}
        />
        <select
          value={activeFilter}
          onChange={e => setActiveFilter(e.target.value)}
          style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontFamily: "Vazirmatn", fontSize: 13, background: "#fff" }}
        >
          <option value="">همه</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>
        <button onClick={() => load(1)} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 14px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>جستجو</button>

        <div style={{ marginRight: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={handleExport}
            style={{ background: "var(--surface)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
          >
            <i className="ti ti-download" /> Export
          </button>
          {summary.inactive > 0 && (
            <button
              onClick={handleDeleteInactive}
              style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
            >
              <i className="ti ti-trash" /> حذف غیرفعال‌ها
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--surface)", borderBottom: "2px solid var(--border)" }}>
              <th style={{ padding: "10px 14px", width: 36 }}>
                <input type="checkbox" checked={selected.size === subscribers.length && subscribers.length > 0} onChange={toggleSelectAll} style={{ cursor: "pointer" }} />
              </th>
              {["ایمیل", "وضعیت", "تاریخ عضویت", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 900, color: "var(--text2)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
                <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />در حال بارگذاری...
              </td></tr>
            ) : subscribers.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
                <i className="ti ti-mail-off" style={{ fontSize: 40, display: "block", marginBottom: 8 }} />مشترکی یافت نشد
              </td></tr>
            ) : subscribers.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--border)", background: selected.has(s.id) ? "#f0f9ff" : i % 2 === 0 ? "#fff" : "var(--surface)" }}>
                <td style={{ padding: "10px 14px" }}>
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} style={{ cursor: "pointer" }} />
                </td>
                <td style={{ padding: "10px 14px", fontWeight: 700, direction: "ltr", textAlign: "right" }}>{s.email}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{
                    background: s.isActive ? "#dcfce7" : "#f1f5f9",
                    color: s.isActive ? "#16a34a" : "#64748b",
                    borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
                  }}>
                    {s.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", color: "var(--text3)", fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(s.createdAt)}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleToggle(s)}
                      disabled={acting === s.id}
                      title={s.isActive ? "غیرفعال کن" : "فعال کن"}
                      style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: s.isActive ? "#ea580c" : "#16a34a" }}
                    >
                      <i className={`ti ${s.isActive ? "ti-toggle-right" : "ti-toggle-left"}`} style={{ fontSize: 14 }} />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={acting === s.id}
                      title="حذف"
                      style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: "#ef4444" }}
                    >
                      <i className="ti ti-trash" style={{ fontSize: 14 }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected count bar */}
      {selected.size > 0 && (
        <div style={{ background: "#dbeafe", borderRadius: "var(--radius-sm)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
          <span style={{ fontWeight: 700, color: "#2563eb" }}>{selected.size.toLocaleString("fa-IR")} مورد انتخاب شده</span>
          <button
            onClick={() => {
              const emails = subscribers.filter(s => selected.has(s.id)).map(s => s.email).join("\n");
              navigator.clipboard.writeText(emails).then(() => showToast(`${selected.size} ایمیل کپی شد`));
            }}
            style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, padding: "5px 12px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            <i className="ti ti-copy" /> کپی ایمیل‌ها
          </button>
          <button onClick={() => setSelected(new Set())} style={{ background: "none", border: "none", color: "#64748b", fontFamily: "Vazirmatn", fontSize: 12, cursor: "pointer" }}>لغو انتخاب</button>
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
