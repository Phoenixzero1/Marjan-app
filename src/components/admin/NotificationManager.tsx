"use client";

import { useState, useEffect, useCallback } from "react";

type NotifType = "ORDER_UPDATE" | "PAYMENT" | "SYSTEM" | "PROMOTION" | "STOCK_ALERT";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string | null };
}

interface Summary { total: number; unread: number }
type Toast = { msg: string; ok: boolean };

const TYPE_MAP: Record<NotifType, { label: string; icon: string; color: string }> = {
  ORDER_UPDATE: { label: "بروزرسانی سفارش", icon: "ti-truck-delivery", color: "#2563eb" },
  PAYMENT:      { label: "پرداخت",           icon: "ti-credit-card",    color: "#16a34a" },
  SYSTEM:       { label: "سیستمی",           icon: "ti-settings",       color: "#475569" },
  PROMOTION:    { label: "تبلیغاتی",         icon: "ti-speakerphone",   color: "#ea580c" },
  STOCK_ALERT:  { label: "هشدار موجودی",     icon: "ti-alert-triangle", color: "#ca8a04" },
};

const TARGET_OPTIONS = [
  { value: "all",              label: "همه کاربران فعال" },
  { value: "role:CUSTOMER",   label: "همه مشتریان" },
  { value: "role:ADMIN",      label: "همه ادمین‌ها" },
];

const inp: React.CSSProperties = {
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13,
  color: "var(--text)", outline: "none", background: "#fff", boxSizing: "border-box", width: "100%",
};
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 };

export default function NotificationManager() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, unread: 0 });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  // Send form
  const [sendTitle, setSendTitle] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendType, setSendType] = useState<NotifType>("SYSTEM");
  const [sendTarget, setSendTarget] = useState("all");
  const [sendLink, setSendLink] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (typeFilter) params.set("type", typeFilter);
      if (readFilter) params.set("isRead", readFilter);
      const res = await fetch(`/api/admin/notifications?${params}`);
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(pg);
      if (data.summary) setSummary(data.summary);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, readFilter]);

  useEffect(() => { load(1); }, [load]);

  async function handleSend() {
    if (!sendTitle.trim()) { showToast("عنوان الزامی است", false); return; }
    if (!sendBody.trim()) { showToast("متن اطلاعیه الزامی است", false); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sendTitle.trim(),
          body: sendBody.trim(),
          type: sendType,
          target: sendTarget,
          link: sendLink.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "خطا در ارسال", false); return; }
      showToast(`اطلاعیه با موفقیت برای ${data.sent} کاربر ارسال شد`);
      setSendTitle(""); setSendBody(""); setSendLink("");
      setSendType("SYSTEM"); setSendTarget("all");
      load(1);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("این اطلاعیه حذف شود؟")) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { showToast("اطلاعیه حذف شد"); load(page); }
      else showToast("خطا در حذف", false);
    } finally {
      setDeleting(null);
    }
  }

  async function handleDeleteAll() {
    if (!confirm(`آیا از حذف تمام ${summary.total.toLocaleString("fa-IR")} اطلاعیه مطمئن هستید؟`)) return;
    const res = await fetch("/api/admin/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteAll: true }),
    });
    const data = await res.json();
    if (res.ok) { showToast(`${data.deleted} اطلاعیه حذف شد`); load(1); }
    else showToast("خطا در حذف", false);
  }

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const NotifList = () => (
    <>
      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 9px", fontFamily: "Vazirmatn", fontSize: 12, background: "#fff" }}>
          <option value="">همه انواع</option>
          {(Object.entries(TYPE_MAP) as [NotifType, { label: string }][]).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select value={readFilter} onChange={e => setReadFilter(e.target.value)} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 9px", fontFamily: "Vazirmatn", fontSize: 12, background: "#fff" }}>
          <option value="">همه وضعیت‌ها</option>
          <option value="false">خوانده‌نشده</option>
          <option value="true">خوانده‌شده</option>
        </select>
        {summary.total > 0 && (
          <button onClick={handleDeleteAll} style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "var(--radius-sm)", padding: "5px 10px", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 700, cursor: "pointer", marginRight: "auto" }}>
            <i className="ti ti-trash" /> حذف همه
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden", flex: 1, minHeight: 0 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
            <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />در حال بارگذاری...
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
            <i className="ti ti-bell-off" style={{ fontSize: 40, display: "block", marginBottom: 8 }} />اطلاعیه‌ای یافت نشد
          </div>
        ) : notifs.map((n, i) => {
          const t = TYPE_MAP[n.type] ?? TYPE_MAP.SYSTEM;
          return (
            <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderBottom: i < notifs.length - 1 ? "1px solid var(--border)" : "none", background: n.isRead ? "#fff" : "#f0f9ff" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: t.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className={`ti ${t.icon}`} style={{ color: t.color, fontSize: 15 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, flexWrap: "wrap" }}>
                  <div>
                    <span style={{ fontWeight: 900, fontSize: 12, color: "var(--primary)" }}>{n.title}</span>
                    {!n.isRead && <span style={{ marginRight: 4, background: "#dbeafe", color: "#2563eb", borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>جدید</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{fmtDate(n.createdAt)}</span>
                    <button onClick={() => handleDelete(n.id)} disabled={deleting === n.id} style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 4, padding: "2px 5px", cursor: "pointer", color: "#ef4444" }}>
                      <i className="ti ti-trash" style={{ fontSize: 11 }} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3, lineHeight: 1.5 }}>{n.body}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 5, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "var(--text2)" }}><i className="ti ti-user" style={{ fontSize: 10 }} /> {n.user.firstName} {n.user.lastName}</span>
                  <span style={{ background: t.color + "18", color: t.color, borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>{t.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          <button onClick={() => load(page - 1)} disabled={page <= 1} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontFamily: "Vazirmatn", fontSize: 12, cursor: "pointer", opacity: page <= 1 ? .5 : 1 }}>قبلی</button>
          <span style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--text2)", padding: "0 6px" }}>{page} از {pages}</span>
          <button onClick={() => load(page + 1)} disabled={page >= pages} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontFamily: "Vazirmatn", fontSize: 12, cursor: "pointer", opacity: page >= pages ? .5 : 1 }}>بعدی</button>
        </div>
      )}
    </>
  );

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
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>اطلاع‌رسانی</h2>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>
            {summary.total.toLocaleString("fa-IR")} اطلاعیه ·{" "}
            <span style={{ color: "#ea580c", fontWeight: 700 }}>{summary.unread.toLocaleString("fa-IR")} خوانده‌نشده</span>
          </p>
        </div>
      </div>

      {/* 2-column layout: send form left + history right */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

        {/* Left: Send form */}
        <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
            <i className="ti ti-send" style={{ fontSize: 17 }} />ارسال اطلاعیه جدید
          </div>

          <div>
            <label style={lbl}>مخاطبان *</label>
            <select value={sendTarget} onChange={e => setSendTarget(e.target.value)} style={inp}>
              {TARGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>نوع اطلاعیه *</label>
              <select value={sendType} onChange={e => setSendType(e.target.value as NotifType)} style={inp}>
                {(Object.entries(TYPE_MAP) as [NotifType, { label: string }][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>لینک (اختیاری)</label>
              <input value={sendLink} onChange={e => setSendLink(e.target.value)} placeholder="/products/..." style={{ ...inp, direction: "ltr", textAlign: "left" }} />
            </div>
          </div>

          <div>
            <label style={lbl}>عنوان *</label>
            <input value={sendTitle} onChange={e => setSendTitle(e.target.value)} placeholder="عنوان اطلاعیه..." style={inp} />
          </div>

          <div>
            <label style={lbl}>متن اطلاعیه *</label>
            <textarea value={sendBody} onChange={e => setSendBody(e.target.value)} rows={4} placeholder="متن کامل اطلاعیه..." style={{ ...inp, resize: "vertical", lineHeight: 1.7 }} />
          </div>

          {/* Preview */}
          {(sendTitle || sendBody) && (
            <div style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", marginBottom: 6 }}>پیش‌نمایش</div>
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
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

          <button onClick={handleSend} disabled={sending} style={{ background: sending ? "#aaa" : "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "12px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {sending ? <><i className="ti ti-loader-2" /> در حال ارسال...</> : <><i className="ti ti-send" /> ارسال اطلاعیه</>}
          </button>
        </div>

        {/* Right: Notification history */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-bell" style={{ fontSize: 17, color: "var(--primary)" }} />
            <span style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>تاریخچه اطلاعیه‌ها</span>
            <span style={{ marginRight: "auto", fontSize: 12, color: "var(--text3)" }}>{total.toLocaleString("fa-IR")} مورد</span>
          </div>
          <NotifList />
        </div>
      </div>
    </div>
  );
}
