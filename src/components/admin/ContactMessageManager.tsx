"use client";
import { useState, useEffect } from "react";
import { AdminBtn, AdminBadge } from "@/components/admin/AdminUI";

interface ContactMsg {
  id: string; name: string; phone?: string; email?: string;
  subject?: string; message: string; isRead: boolean; createdAt: string;
}

export default function ContactMessageManager() {
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMsg | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    fetch("/api/admin/contact-messages")
      .then(r => r.json()).then(setMessages).finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/admin/contact-messages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isRead: true }) });
    setMessages(m => m.map(x => x.id === id ? { ...x, isRead: true } : x));
    setSelected(s => s?.id === id ? { ...s, isRead: true } : s);
  };

  const del = async (id: string) => {
    if (!confirm("حذف این پیام؟")) return;
    await fetch(`/api/admin/contact-messages/${id}`, { method: "DELETE" });
    setMessages(m => m.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = messages.filter(m => filter === "all" ? true : filter === "unread" ? !m.isRead : m.isRead);
  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div style={{ display: "flex", gap: "1rem", height: "calc(100vh - 160px)" }}>
      {/* List pane */}
      <div style={{ width: 340, flexShrink: 0, background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-mail" />
            پیام‌های تماس
            {unreadCount > 0 && <AdminBadge variant="orange" dot>{unreadCount}</AdminBadge>}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "unread", "read"] as const).map(f => (
              <AdminBtn key={f} size="sm" variant={filter === f ? "primary" : "ghost"} onClick={() => setFilter(f)} style={{ flex: 1, justifyContent: "center" }}>
                {f === "all" ? "همه" : f === "unread" ? "خوانده‌نشده" : "خوانده‌شده"}
              </AdminBtn>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)" }}>در حال بارگذاری...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)" }}>پیامی یافت نشد</div>
          ) : filtered.map(m => (
            <div
              key={m.id}
              onClick={() => { setSelected(m); if (!m.isRead) markRead(m.id); }}
              style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: selected?.id === m.id ? "rgba(10,42,94,0.06)" : m.isRead ? "transparent" : "rgba(232,146,10,0.05)", transition: "background .1s" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                {!m.isRead && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
                <span style={{ fontWeight: 900, fontSize: 13, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                <span style={{ fontSize: 10, color: "var(--text3)", whiteSpace: "nowrap" }}>{new Date(m.createdAt).toLocaleDateString("fa-IR")}</span>
              </div>
              {m.subject && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", marginBottom: 2 }}>{m.subject}</div>}
              <div style={{ fontSize: 11, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.message}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail pane */}
      <div style={{ flex: 1, background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--text3)" }}>
            <i className="ti ti-mail-opened" style={{ fontSize: 52 }} />
            <p style={{ fontWeight: 700 }}>یک پیام انتخاب کنید</p>
          </div>
        ) : (
          <>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)", marginBottom: 6 }}>{selected.subject || "(بدون موضوع)"}</div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text3)", flexWrap: "wrap" }}>
                  <span><i className="ti ti-user" style={{ marginLeft: 4 }} />{selected.name}</span>
                  {selected.email && <span><i className="ti ti-mail" style={{ marginLeft: 4 }} />{selected.email}</span>}
                  {selected.phone && <span><i className="ti ti-phone" style={{ marginLeft: 4 }} />{selected.phone}</span>}
                  <span><i className="ti ti-clock" style={{ marginLeft: 4 }} />{new Date(selected.createdAt).toLocaleString("fa-IR")}</span>
                </div>
              </div>
              <AdminBtn icon="ti-trash" variant="danger" size="sm" onClick={() => del(selected.id)}>حذف</AdminBtn>
            </div>
            <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
              <div style={{ background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: "1.25rem", fontSize: 14, lineHeight: 1.9, color: "var(--text)", whiteSpace: "pre-wrap" }}>
                {selected.message}
              </div>
              {selected.email && (
                <div style={{ marginTop: "1rem" }}>
                  <a
                    href={`mailto:${selected.email}?subject=پاسخ: ${selected.subject || ""}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--primary)", color: "#fff", padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}
                  >
                    <i className="ti ti-send" /> پاسخ از طریق ایمیل
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
