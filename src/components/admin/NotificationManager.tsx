"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminToolbar, AdminSelect, AdminBtn, AdminBadge,
  AdminEmptyState, AdminCard, AdminCardHeader, AdminPagination, AdminField, AdminInput, AdminTextarea,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

type NotifType = "ORDER_UPDATE" | "PAYMENT" | "SYSTEM" | "PROMOTION" | "STOCK_ALERT";

interface Notif {
  id: string; type: NotifType; title: string; body: string;
  isRead: boolean; link: string | null; createdAt: string;
  user: { firstName: string; lastName: string; email: string | null };
}

interface Summary { total: number; unread: number }

const TYPE_MAP: Record<NotifType, { label: string; icon: string; color: string }> = {
  ORDER_UPDATE: { label: "بروزرسانی سفارش", icon: "ti-truck-delivery", color: "#2563eb" },
  PAYMENT:      { label: "پرداخت",           icon: "ti-credit-card",    color: "#16a34a" },
  SYSTEM:       { label: "سیستمی",           icon: "ti-settings",       color: "#475569" },
  PROMOTION:    { label: "تبلیغاتی",         icon: "ti-speakerphone",   color: "#ea580c" },
  STOCK_ALERT:  { label: "هشدار موجودی",     icon: "ti-alert-triangle", color: "#ca8a04" },
};

const TARGET_OPTIONS = [
  { value: "all",            label: "همه کاربران فعال" },
  { value: "role:CUSTOMER",  label: "همه مشتریان" },
  { value: "role:ADMIN",     label: "همه ادمین‌ها" },
];

const PAGE_SIZE = 25;

export default function NotificationManager() {
  const { toast, showToast } = useAdminToast();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, unread: 0 });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const [sendTitle, setSendTitle] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendType, setSendType] = useState<NotifType>("SYSTEM");
  const [sendTarget, setSendTarget] = useState("all");
  const [sendLink, setSendLink] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (typeFilter) params.set("type", typeFilter);
      if (readFilter) params.set("isRead", readFilter);
      const res = await fetch(`/api/admin/notifications?${params}`);
      const data = await res.json();
      setNotifs(data.notifications ?? []); setTotal(data.total ?? 0); setPages(data.pages ?? 1); setPage(pg);
      if (data.summary) setSummary(data.summary);
    } finally { setLoading(false); }
  }, [typeFilter, readFilter]);

  useEffect(() => { load(1); }, [load]);

  async function handleSend() {
    if (!sendTitle.trim()) { showToast("error", "عنوان الزامی است"); return; }
    if (!sendBody.trim()) { showToast("error", "متن اطلاعیه الزامی است"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: sendTitle.trim(), body: sendBody.trim(), type: sendType, target: sendTarget, link: sendLink.trim() || null }) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در ارسال"); return; }
      showToast("success", `اطلاعیه برای ${data.sent} کاربر ارسال شد`);
      setSendTitle(""); setSendBody(""); setSendLink(""); setSendType("SYSTEM"); setSendTarget("all");
      load(1);
    } finally { setSending(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("این اطلاعیه حذف شود؟")) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/admin/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) { showToast("success", "اطلاعیه حذف شد"); load(page); }
      else showToast("error", "خطا در حذف");
    } finally { setDeleting(null); }
  }

  async function handleDeleteAll() {
    if (!confirm(`آیا از حذف تمام ${summary.total.toLocaleString("fa-IR")} اطلاعیه مطمئن هستید؟`)) return;
    const res = await fetch("/api/admin/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deleteAll: true }) });
    const data = await res.json();
    if (res.ok) { showToast("success", `${data.deleted} اطلاعیه حذف شد`); load(1); }
    else showToast("error", "خطا در حذف");
  }

  const fmtDate = (s: string) => new Date(s).toLocaleString("fa-IR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="اطلاع‌رسانی" icon="ti-bell" count={summary.total}
        subtitle={summary.unread > 0 ? `${summary.unread} پیام خوانده‌نشده` : "همه پیام‌ها خوانده شده‌اند"}
        actions={summary.total > 0 ? <AdminBtn icon="ti-trash" variant="danger" onClick={handleDeleteAll}>حذف همه</AdminBtn> : undefined}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

        {/* Send form */}
        <AdminCard>
          <AdminCardHeader title="ارسال اطلاعیه جدید" icon="ti-send" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            <AdminField label="مخاطبان">
              <select value={sendTarget} onChange={e => setSendTarget(e.target.value)} style={{ height: 36, padding: "0 10px", borderRadius: 7, border: "1.5px solid var(--border)", fontSize: 13, background: "#fff", fontFamily: "Vazirmatn", width: "100%" }}>
                {TARGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </AdminField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <AdminField label="نوع اطلاعیه">
                <select value={sendType} onChange={e => setSendType(e.target.value as NotifType)} style={{ height: 36, padding: "0 10px", borderRadius: 7, border: "1.5px solid var(--border)", fontSize: 12, background: "#fff", fontFamily: "Vazirmatn", width: "100%" }}>
                  {(Object.entries(TYPE_MAP) as [NotifType, { label: string }][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </AdminField>
              <AdminField label="لینک (اختیاری)">
                <AdminInput value={sendLink} onChange={setSendLink} placeholder="/products/..." style={{ direction: "ltr" }} />
              </AdminField>
            </div>
            <AdminField label="عنوان" required>
              <AdminInput value={sendTitle} onChange={setSendTitle} placeholder="عنوان اطلاعیه..." />
            </AdminField>
            <AdminField label="متن اطلاعیه" required>
              <AdminTextarea value={sendBody} onChange={setSendBody} rows={4} placeholder="متن کامل اطلاعیه..." />
            </AdminField>

            {(sendTitle || sendBody) && (
              <div style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", marginBottom: 6 }}>پیش‌نمایش</div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: TYPE_MAP[sendType].color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className={`ti ${TYPE_MAP[sendType].icon}`} style={{ color: TYPE_MAP[sendType].color, fontSize: 14 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 12, color: "var(--primary)" }}>{sendTitle || "عنوان..."}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2, lineHeight: 1.5 }}>{sendBody || "متن..."}</div>
                  </div>
                </div>
              </div>
            )}

            <AdminBtn icon="ti-send" variant="primary" loading={sending} onClick={handleSend} style={{ justifyContent: "center" }}>
              {sending ? "در حال ارسال..." : "ارسال اطلاعیه"}
            </AdminBtn>
          </div>
        </AdminCard>

        {/* History */}
        <div>
          <AdminToolbar>
            <AdminSelect value={typeFilter} onChange={setTypeFilter}>
              <option value="">همه انواع</option>
              {(Object.entries(TYPE_MAP) as [NotifType, { label: string }][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </AdminSelect>
            <AdminSelect value={readFilter} onChange={setReadFilter}>
              <option value="">همه وضعیت‌ها</option>
              <option value="false">خوانده‌نشده</option>
              <option value="true">خوانده‌شده</option>
            </AdminSelect>
            {summary.unread > 0 && <AdminBadge variant="info">{summary.unread} جدید</AdminBadge>}
          </AdminToolbar>

          <AdminCard padding={0}>
            {loading && <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />}
            {!loading && notifs.length === 0 && <AdminEmptyState icon="ti-bell-off" title="اطلاعیه‌ای یافت نشد" />}
            {notifs.map((n, i) => {
              const t = TYPE_MAP[n.type] ?? TYPE_MAP.SYSTEM;
              return (
                <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderBottom: i < notifs.length - 1 ? "1px solid var(--border)" : "none", background: n.isRead ? "#fff" : "#f0f9ff" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: t.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className={`ti ${t.icon}`} style={{ color: t.color, fontSize: 14 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 900, fontSize: 12, color: "var(--primary)" }}>{n.title}</span>
                      {!n.isRead && <AdminBadge variant="info" size="xs">جدید</AdminBadge>}
                      <span style={{ fontSize: 10, color: "var(--text3)", marginRight: "auto" }}>{fmtDate(n.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3, lineHeight: 1.5 }}>{n.body}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "var(--text2)" }}><i className="ti ti-user" style={{ fontSize: 10 }} /> {n.user.firstName} {n.user.lastName}</span>
                      <AdminBadge variant="neutral" size="xs">{t.label}</AdminBadge>
                    </div>
                  </div>
                  <AdminBtn size="sm" icon="ti-trash" variant="danger" loading={deleting === n.id} onClick={() => handleDelete(n.id)} />
                </div>
              );
            })}
          </AdminCard>

          {pages > 1 && <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={p => load(p)} />}
        </div>
      </div>
    </div>
  );
}
