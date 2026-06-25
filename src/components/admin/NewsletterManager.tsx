"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminToolbar, AdminSearch, AdminSelect, AdminBtn, AdminTable, AdminTh, AdminTd, AdminTr,
  AdminBadge, AdminEmptyState, AdminPagination, AdminField, AdminInput, AdminCard, AdminCardHeader,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

interface Subscriber { id: string; email: string; isActive: boolean; createdAt: string; }
interface Summary { total: number; active: number; inactive: number }
const PAGE_SIZE = 25;

export default function NewsletterManager() {
  const { toast, showToast } = useAdminToast();
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
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (q.trim()) params.set("q", q.trim());
      if (activeFilter) params.set("active", activeFilter);
      const res = await fetch(`/api/admin/newsletter?${params}`);
      const data = await res.json();
      setSubscribers(data.subscribers ?? []); setTotal(data.total ?? 0); setPages(data.pages ?? 1); setPage(pg);
      if (data.summary) setSummary(data.summary);
    } finally { setLoading(false); }
  }, [q, activeFilter]);

  useEffect(() => { load(1); }, [load]);

  async function handleAdd() {
    if (!newEmail.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newEmail.trim().toLowerCase() }) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در افزودن"); return; }
      showToast("success", "ایمیل اضافه شد"); setNewEmail(""); load(1);
    } finally { setAdding(false); }
  }

  async function handleToggle(s: Subscriber) {
    setActing(s.id);
    try {
      const res = await fetch("/api/admin/newsletter", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, isActive: !s.isActive }) });
      if (res.ok) {
        showToast("success", s.isActive ? "اشتراک غیرفعال شد" : "اشتراک فعال شد");
        setSubscribers(prev => prev.map(x => x.id === s.id ? { ...x, isActive: !s.isActive } : x));
        setSummary(prev => ({ ...prev, active: s.isActive ? prev.active - 1 : prev.active + 1, inactive: s.isActive ? prev.inactive + 1 : prev.inactive - 1 }));
      }
    } finally { setActing(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm("این اشتراک حذف شود؟")) return;
    setActing(id);
    try {
      const res = await fetch("/api/admin/newsletter", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) { showToast("success", "حذف شد"); load(page); }
      else showToast("error", "خطا در حذف");
    } finally { setActing(null); }
  }

  async function handleDeleteInactive() {
    if (!confirm(`${summary.inactive.toLocaleString("fa-IR")} اشتراک غیرفعال حذف شود؟`)) return;
    const res = await fetch("/api/admin/newsletter", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deleteInactive: true }) });
    const data = await res.json();
    if (res.ok) { showToast("success", `${data.deleted} اشتراک حذف شد`); load(1); }
    else showToast("error", "خطا در حذف");
  }

  function handleExport() {
    const list = (activeFilter === "false" ? subscribers.filter(s => !s.isActive) : activeFilter === "true" ? subscribers.filter(s => s.isActive) : subscribers).map(s => s.email);
    const blob = new Blob([list.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "newsletter-emails.txt"; a.click(); URL.revokeObjectURL(url);
    showToast("success", `${list.length} ایمیل export شد`);
  }

  function toggleSelect(id: string) { setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleSelectAll() { setSelected(selected.size === subscribers.length ? new Set() : new Set(subscribers.map(s => s.id))); }

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="مدیریت خبرنامه" icon="ti-mail" count={summary.total}
        subtitle={`${summary.active} فعال — ${summary.inactive} غیرفعال`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn icon="ti-download" onClick={handleExport}>Export</AdminBtn>
            {summary.inactive > 0 && <AdminBtn icon="ti-trash" variant="danger" onClick={handleDeleteInactive}>حذف غیرفعال‌ها ({summary.inactive})</AdminBtn>}
          </div>
        }
      />

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
        {[{ label: "کل مشترکین", value: summary.total, icon: "ti-mail", color: "#2563eb" }, { label: "فعال", value: summary.active, icon: "ti-circle-check", color: "#16a34a" }, { label: "غیرفعال", value: summary.inactive, icon: "ti-circle-x", color: "#94a3b8" }].map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 10, border: "1.5px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: c.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className={`ti ${c.icon}`} style={{ fontSize: 18, color: c.color }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text1)", lineHeight: 1.1 }}>{c.value.toLocaleString("fa-IR")}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add email */}
      <AdminCard padding="12px 16px">
        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", marginBottom: 8 }}>افزودن ایمیل دستی</div>
        <div style={{ display: "flex", gap: 8 }}>
          <AdminInput value={newEmail} onChange={setNewEmail} placeholder="example@email.com" style={{ flex: 1, direction: "ltr" }} />
          <AdminBtn icon="ti-plus" variant="primary" loading={adding} disabled={!newEmail.trim()} onClick={handleAdd}>افزودن</AdminBtn>
        </div>
      </AdminCard>

      <AdminToolbar>
        <AdminSearch value={q} onChange={setQ} placeholder="جستجو ایمیل..." />
        <AdminSelect value={activeFilter} onChange={setActiveFilter}>
          <option value="">همه</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </AdminSelect>
        <AdminBtn icon="ti-search" onClick={() => { load(1); setPage(1); }}>جستجو</AdminBtn>
        {selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "auto" }}>
            <AdminBadge variant="info">{selected.size} انتخاب‌شده</AdminBadge>
            <AdminBtn icon="ti-copy" size="sm" onClick={() => { navigator.clipboard.writeText(subscribers.filter(s => selected.has(s.id)).map(s => s.email).join("\n")).then(() => showToast("success", `${selected.size} ایمیل کپی شد`)); }}>کپی</AdminBtn>
            <AdminBtn size="sm" variant="ghost" onClick={() => setSelected(new Set())}>لغو</AdminBtn>
          </div>
        )}
      </AdminToolbar>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh style={{ width: 36 }}><input type="checkbox" checked={selected.size === subscribers.length && subscribers.length > 0} onChange={toggleSelectAll} style={{ cursor: "pointer" }} /></AdminTh>
            <AdminTh>ایمیل</AdminTh>
            <AdminTh>وضعیت</AdminTh>
            <AdminTh>تاریخ عضویت</AdminTh>
            <AdminTh style={{ width: 100 }}>عملیات</AdminTh>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={5}><AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /></td></tr>}
          {!loading && subscribers.length === 0 && <tr><td colSpan={5}><AdminEmptyState icon="ti-mail-off" title="مشترکی یافت نشد" /></td></tr>}
          {subscribers.map(s => (
            <AdminTr key={s.id} style={{ background: selected.has(s.id) ? "#f0f9ff" : undefined }}>
              <AdminTd><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} style={{ cursor: "pointer" }} /></AdminTd>
              <AdminTd style={{ fontWeight: 700, direction: "ltr", textAlign: "right" }}>{s.email}</AdminTd>
              <AdminTd><AdminBadge variant={s.isActive ? "success" : "neutral"} dot>{s.isActive ? "فعال" : "غیرفعال"}</AdminBadge></AdminTd>
              <AdminTd style={{ color: "var(--text3)", fontSize: 12 }}>{new Date(s.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" })}</AdminTd>
              <AdminTd>
                <div style={{ display: "flex", gap: 4 }}>
                  <AdminBtn size="sm" icon={s.isActive ? "ti-toggle-right" : "ti-toggle-left"} loading={acting === s.id} onClick={() => handleToggle(s)} style={{ color: s.isActive ? "#ea580c" : "#16a34a" }} />
                  <AdminBtn size="sm" icon="ti-trash" variant="danger" loading={acting === s.id} onClick={() => handleDelete(s.id)} />
                </div>
              </AdminTd>
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>

      {pages > 1 && <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={p => load(p)} />}
    </div>
  );
}
