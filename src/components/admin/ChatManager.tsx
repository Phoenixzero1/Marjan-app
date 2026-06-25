"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { AdminBtn, AutoTextarea } from "@/components/admin/AdminUI";

// ─── Types ────────────────────────────────────────────────────────────────
interface ContactMsg {
  id: string; name: string; phone?: string; email?: string;
  subject?: string; message: string; isRead: boolean; createdAt: string;
}
interface BlogComment {
  id: string; authorName: string; authorEmail: string | null;
  content: string; isApproved: boolean; createdAt: string;
  post: { id: string; title: string; slug: string };
}
interface Review {
  id: string; rating: number; title?: string; content?: string;
  isApproved: boolean; createdAt: string; reviewerName?: string;
  product: { name: string };
  user?: { firstName?: string; lastName?: string } | null;
}
interface Question {
  id: string; question: string; answer?: string;
  isApproved: boolean; createdAt: string; answeredAt?: string;
  product: { name: string; slug: string };
  user: { firstName?: string; lastName?: string } | null;
}

type ChatTab = "support" | "blog-comments" | "reviews" | "questions";

const TABS: { id: ChatTab; label: string; icon: string }[] = [
  { id: "support",       label: "پیام‌های تماس",   icon: "ti-headset" },
  { id: "blog-comments", label: "نظرات بلاگ",      icon: "ti-message-circle" },
  { id: "reviews",       label: "نظرات محصولات",   icon: "ti-star" },
  { id: "questions",     label: "سوالات محصولات",  icon: "ti-help-circle" },
];

// ─── Shared helpers ────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map(n => n[0] ?? "").join("").slice(0, 2) || "؟";
}

function ConvItem({ selected, unread, avatarBg, avatar, name, preview, time, onClick }: {
  selected: boolean; unread: boolean; avatarBg?: string; avatar: React.ReactNode;
  name: string; preview: string; time: string; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: selected ? "rgba(10,42,94,0.07)" : unread ? "rgba(232,146,10,0.04)" : "transparent", transition: "background .12s" }}
    >
      <div style={{ position: "relative", flexShrink: 0, width: 44, height: 44, borderRadius: "50%", background: avatarBg ?? "linear-gradient(135deg,var(--primary) 0%,#1a5fa0 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff", boxShadow: selected ? "0 0 0 2px var(--primary)" : "none" }}>
        {avatar}
        {unread && <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: "var(--accent)", border: "2px solid #fff" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontWeight: 900, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{name}</span>
          <span style={{ fontSize: 10, color: "var(--text3)", whiteSpace: "nowrap", flexShrink: 0 }}>{time}</span>
        </div>
        <p style={{ fontSize: 11, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{preview}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--text3)" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(10,42,94,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <i className={`ti ${icon}`} style={{ fontSize: 32, color: "var(--primary)" }} />
      </div>
      <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{title}</p>
      <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>{sub}</p>
    </div>
  );
}

function FilterBar({ options, active, onChange }: { options: [string, string][]; active: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(([val, label]) => (
        <button key={val} onClick={() => onChange(val)} style={{ padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", whiteSpace: "nowrap", background: active === val ? "var(--primary)" : "var(--bg)", color: active === val ? "#fff" : "var(--text2)", transition: "background .15s" }}>
          {label}
        </button>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: "relative" }}>
      <i className="ti ti-search" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 14, pointerEvents: "none" }} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", paddingRight: 34, paddingLeft: 12, paddingTop: 8, paddingBottom: 8, border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", fontFamily: "Vazirmatn", fontSize: 12, color: "var(--text)", outline: "none", background: "var(--bg)", boxSizing: "border-box" }} />
    </div>
  );
}

function ListPane({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 300, flexShrink: 0, borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {children}
    </div>
  );
}

function DetailPane({ children }: { children: React.ReactNode }) {
  return <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>{children}</div>;
}

function DetailHeader({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "#fff", flexShrink: 0 }}>{children}</div>;
}

// ─── Shared: admin reply thread (persisted) ────────────────────────────────
interface ReplyItem { id: string; content: string; authorName: string | null; sentVia?: string; createdAt: string }

function ReplyThread({ endpoint }: { endpoint: string }) {
  const [replies, setReplies] = useState<ReplyItem[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true); setReplies([]); setText(""); setErr("");
    fetch(endpoint).then(r => r.json()).then(d => { if (alive) setReplies(d.replies ?? []); }).catch(() => {}).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [endpoint]);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setSaving(true); setErr("");
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error ?? "خطا در ثبت پاسخ"); return; }
      setReplies(p => [...p, d.reply]);
      setText("");
    } catch { setErr("خطای سرور"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {!loading && replies.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          {replies.map(r => (
            <div key={r.id} style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ maxWidth: "72%", background: "var(--primary)", color: "#fff", borderRadius: "4px 16px 16px 16px", padding: "9px 13px", fontSize: 13, lineHeight: 1.7, boxShadow: "0 1px 4px rgba(10,42,94,.18)" }}>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r.content}</p>
                <div style={{ fontSize: 10, marginTop: 5, opacity: 0.78, textAlign: "left" }}>
                  {r.authorName ?? "مدیر"} · {new Date(r.createdAt).toLocaleString("fa-IR")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {err && <div style={{ fontSize: 11, color: "#c0392b", marginBottom: 6, fontWeight: 700 }}>{err}</div>}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <AutoTextarea value={text} onChange={setText} placeholder="پاسخ مدیر... (Enter برای ارسال)"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          style={{ flex: 1 }} />
        <button onClick={send} disabled={saving || !text.trim()} title="ارسال پاسخ"
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, width: 44, height: 40, cursor: (saving || !text.trim()) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: (!text.trim() || saving) ? 0.55 : 1 }}>
          <i className={`ti ${saving ? "ti-loader-2" : "ti-send"}`} style={{ fontSize: 16 }} />
        </button>
      </div>
    </div>
  );
}

// ─── Tab 1: پیام‌های تماس ─────────────────────────────────────────────────
function SupportTab() {
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMsg | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/contact-messages").then(r => r.json()).then(setMessages).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; }, [selected]);

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

  const unreadCount = messages.filter(m => !m.isRead).length;
  const filtered = messages
    .filter(m => (filter === "all" ? true : filter === "unread" ? !m.isRead : m.isRead) && (!search || m.name.includes(search) || (m.subject ?? "").includes(search)))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <ListPane>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          <SearchBox value={search} onChange={setSearch} placeholder="جستجو در پیام‌ها..." />
          <FilterBar
            options={[["all", "همه"], ["unread", `خوانده‌نشده${unreadCount > 0 ? ` (${unreadCount})` : ""}`], ["read", "خوانده‌شده"]]}
            active={filter} onChange={setFilter}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>در حال بارگذاری...</div>
            : filtered.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
                <i className="ti ti-inbox" style={{ fontSize: 36, display: "block", marginBottom: 8 }} />پیامی یافت نشد
              </div>
            ) : filtered.map(m => (
              <ConvItem key={m.id} selected={selected?.id === m.id} unread={!m.isRead}
                avatar={initials(m.name)} name={m.name}
                preview={m.subject || m.message}
                time={new Date(m.createdAt).toLocaleDateString("fa-IR")}
                onClick={() => { setSelected(m); if (!m.isRead) markRead(m.id); }} />
            ))}
        </div>
      </ListPane>

      <DetailPane>
        {!selected ? (
          <EmptyState icon="ti-message-circle" title="یک پیام انتخاب کنید" sub="پیام‌های تماس کاربران را اینجا مشاهده کنید" />
        ) : (
          <>
            <DetailHeader>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,var(--primary) 0%,#1a5fa0 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{initials(selected.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 14, color: "var(--text)" }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {selected.email && <span><i className="ti ti-mail" style={{ marginLeft: 3 }} />{selected.email}</span>}
                  {selected.phone && <span><i className="ti ti-phone" style={{ marginLeft: 3 }} />{selected.phone}</span>}
                </div>
              </div>
              <button onClick={() => del(selected.id)} style={{ background: "#fdecea", border: "1px solid #f5c6cb", color: "#c0392b", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <i className="ti ti-trash" /> حذف
              </button>
            </DetailHeader>
            <div ref={threadRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {selected.subject && (
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <span style={{ fontSize: 11, color: "var(--text3)", background: "var(--bg)", border: "1px solid var(--border)", padding: "4px 14px", borderRadius: 20 }}>موضوع: {selected.subject}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <div style={{ maxWidth: "72%", background: "var(--bg)", color: "var(--text)", borderRadius: "16px 4px 16px 16px", padding: "10px 14px", fontSize: 13, lineHeight: 1.7, boxShadow: "0 1px 4px rgba(0,0,0,.08)", border: "1px solid var(--border)" }}>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{selected.message}</p>
                  <div style={{ fontSize: 10, marginTop: 6, opacity: 0.65, textAlign: "left" }}>{new Date(selected.createdAt).toLocaleString("fa-IR")}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", background: "#fff", flexShrink: 0 }}>
              <ReplyThread endpoint={`/api/admin/contact-messages/${selected.id}/reply`} />
              {selected.email && (
                <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                  <a href={`mailto:${selected.email}?subject=پاسخ: ${selected.subject || ""}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text3)", textDecoration: "none" }}>
                    <i className="ti ti-mail" /> پاسخ از طریق ایمیل به‌جای پنل
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </DetailPane>
    </div>
  );
}

// ─── Tab 2: نظرات بلاگ ────────────────────────────────────────────────────
function BlogCommentsTab() {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<{ id: string; title: string } | null>(null);
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [openReplies, setOpenReplies] = useState<Set<string>>(new Set());
  const toggleReply = (id: string) => setOpenReplies(p => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/comments?tab=blog&page=1").then(r => r.json())
      .then(d => setComments(Array.isArray(d) ? d : (d.items ?? [])))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; }, [selectedPost]);

  const approve = async (id: string) => {
    setActing(id);
    await fetch("/api/admin/comments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isApproved: true, tab: "blog" }) });
    setComments(c => c.map(x => x.id === id ? { ...x, isApproved: true } : x));
    setActing(null);
  };
  const reject = async (id: string) => {
    setActing(id);
    await fetch("/api/admin/comments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isApproved: false, tab: "blog" }) });
    setComments(c => c.map(x => x.id === id ? { ...x, isApproved: false } : x));
    setActing(null);
  };
  const del = async (id: string) => {
    if (!confirm("حذف این نظر؟")) return;
    await fetch("/api/admin/comments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, tab: "blog" }) });
    setComments(c => c.filter(x => x.id !== id));
  };

  const posts = Object.values(
    comments.reduce<Record<string, { id: string; title: string; count: number; pending: number }>>((acc, c) => {
      if (!acc[c.post.id]) acc[c.post.id] = { id: c.post.id, title: c.post.title, count: 0, pending: 0 };
      acc[c.post.id].count++;
      if (!c.isApproved) acc[c.post.id].pending++;
      return acc;
    }, {})
  ).filter(p => !search || p.title.includes(search));

  const threadComments = selectedPost
    ? comments.filter(c => c.post.id === selectedPost.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <ListPane>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <SearchBox value={search} onChange={setSearch} placeholder="جستجو در مقالات..." />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>در حال بارگذاری...</div>
            : posts.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
                <i className="ti ti-message-off" style={{ fontSize: 36, display: "block", marginBottom: 8 }} />نظری یافت نشد
              </div>
            ) : posts.map(p => (
              <ConvItem key={p.id} selected={selectedPost?.id === p.id} unread={p.pending > 0}
                avatarBg="linear-gradient(135deg,#1a7a4a 0%,#27ae60 100%)"
                avatar={<i className="ti ti-news" style={{ color: "#fff", fontSize: 18 }} />}
                name={p.title}
                preview={`${p.count} نظر${p.pending > 0 ? ` · ${p.pending} در انتظار` : ""}`}
                time={`${p.count}`}
                onClick={() => setSelectedPost({ id: p.id, title: p.title })} />
            ))}
        </div>
      </ListPane>

      <DetailPane>
        {!selectedPost ? (
          <EmptyState icon="ti-messages" title="یک مقاله انتخاب کنید" sub="نظرات آن مقاله را مشاهده کنید" />
        ) : (
          <>
            <DetailHeader>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#1a7a4a 0%,#27ae60 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="ti ti-news" style={{ color: "#fff", fontSize: 17 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedPost.title}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{threadComments.length} نظر</div>
              </div>
            </DetailHeader>
            <div ref={threadRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {threadComments.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 13 }}>نظری برای این مقاله ثبت نشده</div>
              ) : threadComments.map(c => (
                <div key={c.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: c.isApproved ? "rgba(10,42,94,0.12)" : "rgba(192,57,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 900, color: c.isApproved ? "var(--primary)" : "#c0392b" }}>{c.authorName[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 900, fontSize: 12, color: "var(--text)" }}>{c.authorName}</span>
                      {c.authorEmail && <span style={{ fontSize: 11, color: "var(--text3)" }}>{c.authorEmail}</span>}
                      <span style={{ fontSize: 10, color: "var(--text3)", marginRight: "auto" }}>{new Date(c.createdAt).toLocaleString("fa-IR")}</span>
                      <span style={{ fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 10, background: c.isApproved ? "rgba(26,122,74,0.1)" : "rgba(232,146,10,0.1)", color: c.isApproved ? "#1a7a4a" : "#b7770a" }}>{c.isApproved ? "تأیید شده" : "در انتظار"}</span>
                    </div>
                    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px 14px 14px 14px", padding: "10px 14px", fontSize: 13, lineHeight: 1.7, color: "var(--text)", whiteSpace: "pre-wrap" }}>{c.content}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      {!c.isApproved ? (
                        <button onClick={() => approve(c.id)} disabled={acting === c.id} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #1a7a4a", background: "rgba(26,122,74,0.07)", color: "#1a7a4a", fontSize: 11, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <i className="ti ti-check" /> تأیید
                        </button>
                      ) : (
                        <button onClick={() => reject(c.id)} disabled={acting === c.id} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #b7770a", background: "rgba(183,119,10,0.07)", color: "#b7770a", fontSize: 11, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <i className="ti ti-x" /> رد
                        </button>
                      )}
                      <button onClick={() => toggleReply(c.id)} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)", background: openReplies.has(c.id) ? "var(--primary)" : "rgba(10,42,94,0.05)", color: openReplies.has(c.id) ? "#fff" : "var(--primary)", fontSize: 11, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <i className="ti ti-message-reply" /> پاسخ
                      </button>
                      <button onClick={() => del(c.id)} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #f5c6cb", background: "#fdecea", color: "#c0392b", fontSize: 11, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <i className="ti ti-trash" /> حذف
                      </button>
                    </div>
                    {openReplies.has(c.id) && (
                      <div style={{ marginTop: 10 }}>
                        <ReplyThread endpoint={`/api/admin/comments/${c.id}/reply`} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DetailPane>
    </div>
  );
}

// ─── Tab 3: نظرات محصولات ─────────────────────────────────────────────────
function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [openReplies, setOpenReplies] = useState<Set<string>>(new Set());
  const toggleReply = (id: string) => setOpenReplies(p => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  useEffect(() => {
    fetch("/api/admin/reviews").then(r => r.json()).then(setReviews).finally(() => setLoading(false));
  }, []);

  const approve = async (id: string) => {
    await fetch(`/api/admin/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isApproved: true }) });
    setReviews(r => r.map(x => x.id === id ? { ...x, isApproved: true } : x));
  };
  const del = async (id: string) => {
    if (!confirm("حذف این نظر؟")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setReviews(r => r.filter(x => x.id !== id));
  };

  const pendingCount = reviews.filter(r => !r.isApproved).length;
  const filtered = reviews.filter(r => filter === "all" ? true : filter === "pending" ? !r.isApproved : r.isApproved);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <FilterBar
          options={[["all", "همه"], ["pending", `در انتظار${pendingCount > 0 ? ` (${pendingCount})` : ""}`], ["approved", "تأیید‌شده"]]}
          active={filter} onChange={setFilter}
        />
      </div>
      {loading ? <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>در حال بارگذاری...</div>
        : filtered.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: "var(--radius)", padding: "3rem", textAlign: "center", color: "var(--text3)", border: "1px solid var(--border)" }}>
            <i className="ti ti-star-off" style={{ fontSize: 44, display: "block", marginBottom: 10 }} />
            <p style={{ fontWeight: 700, margin: 0 }}>نظری یافت نشد</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(r => {
              const name = r.reviewerName || (r.user ? `${r.user.firstName ?? ""} ${r.user.lastName ?? ""}`.trim() : "") || "کاربر ناشناس";
              return (
                <div key={r.id} style={{ background: "#fff", borderRadius: "var(--radius)", padding: "14px 18px", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent) 0%,#f39c12 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span>{[1,2,3,4,5].map(s => <i key={s} className={`ti ${s <= r.rating ? "ti-star-filled" : "ti-star"}`} style={{ fontSize: 13, color: s <= r.rating ? "#f59e0b" : "var(--border)" }} />)}</span>
                        <span style={{ fontWeight: 900, fontSize: 13, color: "var(--text)" }}>{name}</span>
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>روی <strong>{r.product.name}</strong></span>
                        <span style={{ fontSize: 10, color: "var(--text3)" }}>{new Date(r.createdAt).toLocaleDateString("fa-IR")}</span>
                        <span style={{ fontSize: 11, fontWeight: 900, padding: "2px 10px", borderRadius: 20, background: r.isApproved ? "rgba(26,122,74,0.1)" : "rgba(232,146,10,0.1)", color: r.isApproved ? "#1a7a4a" : "var(--accent)" }}>{r.isApproved ? "تأیید‌شده" : "در انتظار"}</span>
                      </div>
                      {r.title && <div style={{ fontWeight: 900, fontSize: 13, color: "var(--primary)", marginBottom: 4 }}>{r.title}</div>}
                      {r.content && <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{r.content}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {!r.isApproved && (
                        <button onClick={() => approve(r.id)} style={{ background: "rgba(26,122,74,0.1)", border: "none", color: "#1a7a4a", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                          <i className="ti ti-check" /> تأیید
                        </button>
                      )}
                      <button onClick={() => toggleReply(r.id)} style={{ background: openReplies.has(r.id) ? "var(--primary)" : "rgba(10,42,94,0.07)", border: "none", color: openReplies.has(r.id) ? "#fff" : "var(--primary)", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        <i className="ti ti-message-reply" /> پاسخ
                      </button>
                      <button onClick={() => del(r.id)} style={{ background: "#fdecea", border: "none", color: "#c0392b", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        <i className="ti ti-trash" /> حذف
                      </button>
                    </div>
                  </div>
                  {openReplies.has(r.id) && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                      <ReplyThread endpoint={`/api/admin/reviews/${r.id}/reply`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ─── Tab 4: سوالات محصولات ────────────────────────────────────────────────
function QuestionsTab() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unanswered");
  const [answering, setAnswering] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const qs = filter === "unanswered" ? "?unanswered=true" : "";
    fetch(`/api/admin/questions${qs}`).then(r => r.json()).then(d => setQuestions(d.questions ?? [])).finally(() => setLoading(false));
  }, [filter]);

  const submitAnswer = async (id: string) => {
    if (!answerText.trim()) return;
    setSaving(true);
    await fetch("/api/admin/questions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, answer: answerText, isApproved: true }) });
    setQuestions(q => q.map(x => x.id === id ? { ...x, answer: answerText, isApproved: true, answeredAt: new Date().toISOString() } : x));
    setAnswering(null); setAnswerText(""); setSaving(false);
  };
  const del = async (id: string) => {
    if (!confirm("حذف این سؤال؟")) return;
    await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
    setQuestions(q => q.filter(x => x.id !== id));
  };

  const unansweredCount = questions.filter(q => !q.answer).length;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
      <div style={{ marginBottom: 16 }}>
        <FilterBar
          options={[["unanswered", `بی‌پاسخ${unansweredCount > 0 ? ` (${unansweredCount})` : ""}`], ["all", "همه"]]}
          active={filter} onChange={setFilter}
        />
      </div>
      {loading ? <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>در حال بارگذاری...</div>
        : questions.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: "var(--radius)", padding: "3rem", textAlign: "center", color: "var(--text3)", border: "1px solid var(--border)" }}>
            <i className="ti ti-message-question" style={{ fontSize: 44, display: "block", marginBottom: 10 }} />
            <p style={{ fontWeight: 700, margin: 0 }}>سؤالی یافت نشد</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {questions.map(q => {
              const asker = q.user ? `${q.user.firstName ?? ""} ${q.user.lastName ?? ""}`.trim() || "کاربر" : "کاربر";
              return (
                <div key={q.id} style={{ background: "#fff", borderRadius: "var(--radius)", padding: "14px 18px", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#7b2ddb 0%,#a855f7 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{asker[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 900, fontSize: 12, color: "var(--primary)" }}>{q.product.name}</span>
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>از: {asker}</span>
                        <span style={{ fontSize: 10, color: "var(--text3)" }}>{new Date(q.createdAt).toLocaleDateString("fa-IR")}</span>
                        {!q.answer && <span style={{ fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 20, background: "rgba(192,57,43,0.1)", color: "#c0392b" }}>بی‌پاسخ</span>}
                        {q.isApproved && <span style={{ fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 20, background: "rgba(26,122,74,0.1)", color: "#1a7a4a" }}>تأیید‌شده</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: q.answer ? 8 : 0 }}>
                        <i className="ti ti-help-circle" style={{ marginLeft: 6, color: "var(--accent)" }} />{q.question}
                      </div>
                      {q.answer && (
                        <div style={{ background: "rgba(26,122,74,0.05)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "var(--text2)", borderRight: "3px solid #1a7a4a", marginBottom: 8 }}>
                          <i className="ti ti-arrow-back-up" style={{ marginLeft: 6, color: "#1a7a4a" }} />{q.answer}
                        </div>
                      )}
                      {answering === q.id && (
                        <div style={{ marginTop: 10 }}>
                          <AutoTextarea value={answerText} onChange={setAnswerText} placeholder="پاسخ را بنویسید..." />
                          <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                            <button onClick={() => { setAnswering(null); setAnswerText(""); }} style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text2)", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer" }}>انصراف</button>
                            <button onClick={() => submitAnswer(q.id)} disabled={saving} style={{ background: "var(--primary)", color: "#fff", border: "none", padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "ذخیره..." : "ثبت پاسخ"}</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {(!answering || answering !== q.id) && (
                        <button onClick={() => { setAnswering(q.id); setAnswerText(q.answer ?? ""); }} style={{ background: "rgba(26,122,74,0.1)", border: "none", color: "#1a7a4a", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                          <i className="ti ti-message-reply" /> {q.answer ? "ویرایش" : "پاسخ"}
                        </button>
                      )}
                      <button onClick={() => del(q.id)} style={{ background: "#fdecea", border: "none", color: "#c0392b", padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "Vazirmatn", cursor: "pointer" }}>
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ─── Column 1: Category sidebar ─────────────────────────────────────────────
interface CommStats { contact: number; blog: number; reviews: number; questions: number }

function CommSidebar({ active, onChange, stats, seeding, seedMsg, onSeed }: {
  active: ChatTab; onChange: (t: ChatTab) => void; stats: CommStats;
  seeding: boolean; seedMsg: string; onSeed: () => void;
}) {
  const countFor = (id: ChatTab) =>
    id === "support" ? stats.contact : id === "blog-comments" ? stats.blog : id === "reviews" ? stats.reviews : stats.questions;

  return (
    <div style={{ width: 248, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-messages" style={{ color: "var(--accent)" }} /> مرکز ارتباطات
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>پیام‌ها، نظرات و سوالات در یک‌جا</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {TABS.map(t => {
          const isActive = active === t.id;
          const count = countFor(t.id);
          return (
            <button key={t.id} onClick={() => onChange(t.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", marginBottom: 4, borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "Vazirmatn", textAlign: "right", background: isActive ? "#fff" : "transparent", boxShadow: isActive ? "0 1px 6px rgba(10,42,94,0.10)" : "none", borderRight: isActive ? "3px solid var(--accent)" : "3px solid transparent", transition: "all .15s" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: isActive ? "rgba(10,42,94,0.10)" : "rgba(10,42,94,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className={`ti ${t.icon}`} style={{ fontSize: 17, color: isActive ? "var(--primary)" : "var(--text3)" }} />
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 900 : 700, color: isActive ? "var(--primary)" : "var(--text2)" }}>{t.label}</span>
              {count > 0 && (
                <span style={{ background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 900, minWidth: 20, height: 20, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px", flexShrink: 0 }}>
                  {count > 99 ? "۹۹+" : count.toLocaleString("fa-IR")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)" }}>
        {seedMsg && <div style={{ fontSize: 11, color: "#1a7a4a", fontWeight: 700, marginBottom: 6, textAlign: "center" }}>{seedMsg}</div>}
        <AdminBtn size="sm" icon={seeding ? "ti-loader-2" : "ti-database-plus"} loading={seeding} onClick={onSeed} style={{ width: "100%", justifyContent: "center" }}>
          {seeding ? "..." : "داده تست"}
        </AdminBtn>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function ChatManager() {
  const [tab, setTab] = useState<ChatTab>("support");
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");
  const [key, setKey] = useState(0);
  const [stats, setStats] = useState<CommStats>({ contact: 0, blog: 0, reviews: 0, questions: 0 });

  const loadStats = useCallback(() => {
    fetch("/api/admin/communications/stats")
      .then(r => r.json())
      .then(d => { if (d && typeof d.contact === "number") setStats({ contact: d.contact, blog: d.blog, reviews: d.reviews, questions: d.questions }); })
      .catch(() => {});
  }, []);

  // Refresh badges on mount, after seeding, and every 30s
  useEffect(() => { loadStats(); }, [loadStats, key]);
  useEffect(() => { const i = setInterval(loadStats, 30_000); return () => clearInterval(i); }, [loadStats]);

  const runSeed = async () => {
    setSeeding(true); setSeedMsg("");
    try {
      const data = await fetch("/api/admin/dev-seed", { method: "POST" }).then(r => r.json());
      setSeedMsg(data.message ?? "داده تستی اضافه شد");
      setKey(k => k + 1);
    } catch { setSeedMsg("خطا"); }
    finally { setSeeding(false); setTimeout(() => setSeedMsg(""), 5000); }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 150px)", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", border: "1px solid var(--border)", overflow: "hidden" }}>
      {/* Column 1: category sidebar */}
      <CommSidebar active={tab} onChange={setTab} stats={stats} seeding={seeding} seedMsg={seedMsg} onSeed={runSeed} />

      {/* Columns 2 + 3: active category (list + detail) */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }} key={key}>
        {tab === "support"       && <SupportTab />}
        {tab === "blog-comments" && <BlogCommentsTab />}
        {tab === "reviews"       && <ReviewsTab />}
        {tab === "questions"     && <QuestionsTab />}
      </div>
    </div>
  );
}
