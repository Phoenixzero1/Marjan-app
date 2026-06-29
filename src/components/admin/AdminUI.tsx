"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";

// ─── Tokens ───────────────────────────────────────────────────────────────────
export const T = {
  th: { background: "var(--bg)", padding: "10px 14px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right" as const, borderBottom: "2px solid var(--border)", letterSpacing: "0.03em", whiteSpace: "nowrap" as const },
  td: { padding: "11px 14px", fontSize: 13, color: "var(--text)", verticalAlign: "middle" as const, borderBottom: "1px solid rgba(10,42,94,0.06)" },
  row: { transition: "background 0.1s", cursor: "default" as const },
} as const;

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "orange" | "purple";
const BADGE_STYLES: Record<BadgeVariant, CSSProperties> = {
  success: { background: "rgba(26,127,55,0.12)", color: "#1a7f37", border: "1px solid rgba(26,127,55,0.25)" },
  warning: { background: "rgba(154,103,0,0.12)", color: "#9a6700", border: "1px solid rgba(154,103,0,0.25)" },
  danger:  { background: "rgba(207,34,46,0.12)",  color: "#cf222e", border: "1px solid rgba(207,34,46,0.25)" },
  info:    { background: "rgba(10,42,94,0.10)",   color: "var(--primary)", border: "1px solid rgba(10,42,94,0.18)" },
  neutral: { background: "rgba(74,85,120,0.09)",  color: "var(--text2)", border: "1px solid var(--border)" },
  orange:  { background: "rgba(232,146,10,0.12)", color: "var(--accent)", border: "1px solid rgba(232,146,10,0.25)" },
  purple:  { background: "rgba(88,28,135,0.10)",  color: "#6d28d9", border: "1px solid rgba(88,28,135,0.20)" },
};

export function AdminBadge({ children, variant = "neutral", size = "sm", dot }: { children: ReactNode; variant?: BadgeVariant; size?: "xs" | "sm" | "md"; dot?: boolean }) {
  const sizes = { xs: { fontSize: 9, padding: "1px 6px", borderRadius: 6 }, sm: { fontSize: 11, padding: "2px 8px", borderRadius: 20 }, md: { fontSize: 12, padding: "3px 10px", borderRadius: 20 } };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 900, lineHeight: 1.4, fontFamily: "Vazirmatn", ...BADGE_STYLES[variant], ...sizes[size] }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />}
      {children}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function AdminAvatar({ name, email, size = 32 }: { name?: string | null; email?: string | null; size?: number }) {
  const initials = (name || email || "?").trim().charAt(0).toUpperCase();
  const hue = ((name || email || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 47) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},45%,88%)`, color: `hsl(${hue},55%,35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 900, flexShrink: 0, border: `1.5px solid hsl(${hue},35%,78%)` }}>
      {initials}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function AdminPageHeader({ title, subtitle, icon, actions, count }: { title: string; subtitle?: string; icon?: string; actions?: ReactNode; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icon && (
          <div style={{ width: 40, height: 40, background: "rgba(10,42,94,0.08)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className={`ti ${icon}`} style={{ fontSize: 20, color: "var(--primary)" }} />
          </div>
        )}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--primary)", margin: 0, lineHeight: 1.2 }}>{title}</h2>
            {count != null && <AdminBadge variant="info" size="sm">{count.toLocaleString("fa-IR")}</AdminBadge>}
          </div>
          {subtitle && <p style={{ fontSize: 12, color: "var(--text3)", margin: "2px 0 0", fontWeight: 500 }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
export function AdminToolbar({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", flexWrap: "wrap" as const }}>
      {children}
    </div>
  );
}

export function AdminSearch({ value, onChange, placeholder = "جستجو..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <i className="ti ti-search" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text3)", pointerEvents: "none" }} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ paddingRight: 32, paddingLeft: 10, height: 36, border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", fontFamily: "Vazirmatn", fontSize: 13, color: "var(--text)", outline: "none", width: 230, background: "#fff" }} />
    </div>
  );
}

export function AdminSelect({ value, onChange, children, style }: { value: string; onChange: (v: string) => void; children: ReactNode; style?: CSSProperties }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ height: 36, border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", fontFamily: "Vazirmatn", fontSize: 12, color: "var(--text2)", background: "#fff", padding: "0 10px", outline: "none", cursor: "pointer", ...style }}>
      {children}
    </select>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
const BTN_STYLES: Record<BtnVariant, CSSProperties> = {
  primary:   { background: "var(--primary)", color: "#fff", border: "1.5px solid var(--primary)" },
  secondary: { background: "#fff", color: "var(--text2)", border: "1.5px solid var(--border)" },
  ghost:     { background: "transparent", color: "var(--text2)", border: "1.5px solid transparent" },
  danger:    { background: "#fdecea", color: "#cf222e", border: "1.5px solid #f5c6cb" },
};

export function AdminBtn({ children, onClick, variant = "secondary", icon, disabled, loading, size = "md", style, title }: {
  children?: ReactNode; onClick?: () => void; variant?: BtnVariant; icon?: string; disabled?: boolean; loading?: boolean; size?: "sm" | "md" | "lg"; style?: CSSProperties; title?: string;
}) {
  const sizes = { sm: { fontSize: 11, padding: "4px 10px", height: 28 }, md: { fontSize: 12, padding: "0 14px", height: 36 }, lg: { fontSize: 13, padding: "0 18px", height: 40 } };
  return (
    <button onClick={onClick} disabled={disabled || loading} title={title}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: "var(--radius-sm)", fontFamily: "Vazirmatn", fontWeight: 900, cursor: disabled || loading ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, transition: "opacity .15s, background .15s", whiteSpace: "nowrap" as const, ...BTN_STYLES[variant], ...sizes[size], ...style }}>
      {loading ? <i className="ti ti-loader" style={{ fontSize: 13 }} /> : icon && <i className={`ti ${icon}`} style={{ fontSize: 14 }} />}
      {children}
    </button>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function AdminTable({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="admin-card" style={{ overflow: "auto", padding: 0, ...style }}>
      <table className="admin-tbl" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        {children}
      </table>
    </div>
  );
}

export function AdminTh({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <th style={{ ...T.th, ...style }}>{children}</th>;
}

export function AdminTd({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <td style={{ ...T.td, ...style }}>{children}</td>;
}

export function AdminTr({ children, onClick, style }: { children: ReactNode; onClick?: () => void; style?: CSSProperties }) {
  return (
    <tr onClick={onClick} style={{ ...T.row, cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </tr>
  );
}

export function AdminEmptyState({ icon = "ti-inbox", title = "موردی یافت نشد", subtitle }: { icon?: string; title?: string; subtitle?: string }) {
  return (
    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>
      <i className={`ti ${icon}`} style={{ fontSize: 42, display: "block", marginBottom: 10, opacity: 0.3 }} />
      <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text2)", marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12 }}>{subtitle}</div>}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function AdminPagination({ page, total, pageSize = 20, onChange }: { page: number; total: number; pageSize?: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
      <span style={{ fontSize: 12, color: "var(--text3)" }}>نمایش {from.toLocaleString("fa-IR")}–{to.toLocaleString("fa-IR")} از {total.toLocaleString("fa-IR")}</span>
      <div style={{ display: "flex", gap: 4 }}>
        <AdminBtn icon="ti-chevron-right" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1} />
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, pages - 4));
          const p = start + i;
          return p <= pages ? (
            <button key={p} onClick={() => onChange(p)}
              style={{ minWidth: 28, height: 28, borderRadius: 6, fontSize: 12, fontWeight: p === page ? 900 : 700, background: p === page ? "var(--primary)" : "#fff", color: p === page ? "#fff" : "var(--text2)", border: "1.5px solid var(--border)", cursor: "pointer", fontFamily: "Vazirmatn" }}>
              {p.toLocaleString("fa-IR")}
            </button>
          ) : null;
        })}
        <AdminBtn icon="ti-chevron-left" size="sm" onClick={() => onChange(page + 1)} disabled={page >= pages} />
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
export function AdminDrawer({ open, onClose, title, children, width = 520 }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,25,60,0.45)", zIndex: 1000, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }} />
      <div role="dialog" aria-modal="true" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width, maxWidth: "calc(100vw - 32px)", maxHeight: "88vh", background: "#fff", borderRadius: "var(--radius)", zIndex: 1001, boxShadow: "0 24px 70px rgba(10,42,94,0.28)", display: "flex", flexDirection: "column", overflow: "hidden", animation: "fadeScaleIn .2s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--primary-dark)", flexShrink: 0, borderRadius: "var(--radius) var(--radius) 0 0" }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>{title}</span>
          <button onClick={onClose} style={{ width: 30, height: 30, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 15 }}>
            <i className="ti ti-x" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function AdminModal({ open, onClose, title, children, width = 520 }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,42,94,0.22)", zIndex: 1000, backdropFilter: "blur(2px)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width, maxWidth: "calc(100vw - 32px)", background: "#fff", borderRadius: "var(--radius)", zIndex: 1001, boxShadow: "0 20px 60px rgba(10,42,94,0.22)", animation: "fadeScaleIn .2s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--primary-dark)", borderRadius: "var(--radius) var(--radius) 0 0" }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{title}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 14 }}>
            <i className="ti ti-x" />
          </button>
        </div>
        <div style={{ padding: "20px" }}>{children}</div>
      </div>
    </>,
    document.body,
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function AdminCard({ children, padding = "1.25rem", style }: { children: ReactNode; padding?: string | number; style?: CSSProperties }) {
  return <div className="admin-card" style={{ padding, ...style }}>{children}</div>;
}

export function AdminCardHeader({ title, icon, actions, subtitle }: { title: string; icon?: string; actions?: ReactNode; subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(10,42,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className={`ti ${icon}`} style={{ fontSize: 16, color: "var(--primary)" }} />
        </div>}
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {actions && <div style={{ display: "flex", gap: 6 }}>{actions}</div>}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function AdminStatCard({ icon, label, value, sub, color = "var(--primary)", onClick }: { icon: string; label: string; value: string | number; sub?: string; color?: string; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="admin-card"
      style={{ padding: "1rem 1.25rem", cursor: onClick ? "pointer" : "default", transition: "box-shadow .15s, transform .15s", boxShadow: hov && onClick ? "0 4px 20px rgba(10,42,94,0.14)" : undefined, transform: hov && onClick ? "translateY(-1px)" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className={`ti ${icon}`} style={{ fontSize: 17, color }} />
        </div>
        <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "var(--primary)", lineHeight: 1, marginBottom: 6 }}>{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text3)" }}>{sub}</div>}
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────
export function AdminField({ label, required, children, hint, error, style }: { label: string; required?: boolean; children: ReactNode; hint?: string; error?: string; style?: CSSProperties }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--text2)", marginBottom: 5 }}>
        {label}{required && <span style={{ color: "#cf222e", marginRight: 3 }}>*</span>}
      </label>
      {children}
      {hint && !error && <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{hint}</p>}
      {error && <p style={{ fontSize: 11, color: "#cf222e", marginTop: 4 }}>{error}</p>}
    </div>
  );
}

const INPUT_BASE: CSSProperties = { width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, color: "var(--text)", outline: "none", background: "#fff", boxSizing: "border-box" as const };

export function AdminInput({ value, onChange, placeholder, type = "text", disabled, style }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; style?: CSSProperties }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={{ ...INPUT_BASE, opacity: disabled ? 0.7 : 1, ...style }} />;
}

export function AdminTextarea({ value, onChange, placeholder, rows = 4, style }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; style?: CSSProperties }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...INPUT_BASE, resize: "vertical" as const, ...style }} />;
}

// Auto-growing textarea: starts at minHeight (40px), grows with content up to
// maxHeight (160px), then scrolls. Manual corner-resize stays enabled.
export function AutoTextarea({ value, onChange, placeholder, onKeyDown, minHeight = 40, maxHeight = 160, style }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  onKeyDown?: (e: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  minHeight?: number; maxHeight?: number; style?: CSSProperties;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight) + "px";
  }, [minHeight, maxHeight]);
  useEffect(() => { resize(); }, [value, resize]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      onInput={resize}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={1}
      style={{ ...INPUT_BASE, minHeight, maxHeight, height: minHeight, resize: "vertical" as const, overflowY: "auto" as const, ...style }}
    />
  );
}

export function AdminInputSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: ReactNode }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={{ ...INPUT_BASE, cursor: "pointer" }}>{children}</select>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function AdminToast({ toast }: { toast: { type: "success" | "error" | "info"; msg: string } | null }) {
  if (!toast) return null;
  const colors = { success: "#1a7a4a", error: "#cf222e", info: "var(--primary)" };
  const icons = { success: "ti-circle-check", error: "ti-circle-x", info: "ti-info-circle" };
  return (
    <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: colors[toast.type], color: "#fff", padding: "12px 24px", borderRadius: 10, fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, zIndex: 9999, boxShadow: "0 6px 24px rgba(0,0,0,.25)", display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" as const, animation: "fadeScaleIn .2s" }}>
      <i className={`ti ${icons[toast.type]}`} style={{ fontSize: 18 }} />
      {toast.msg}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function AdminConfirm({ open, onClose, onConfirm, title, message, confirmLabel = "تایید", danger = false }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message?: ReactNode; confirmLabel?: string; danger?: boolean }) {
  return (
    <AdminModal open={open} onClose={onClose} title={title} width={400}>
      {message && <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.7 }}>{message}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-start" }}>
        <AdminBtn variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</AdminBtn>
        <AdminBtn variant="secondary" onClick={onClose}>انصراف</AdminBtn>
      </div>
    </AdminModal>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
export function AdminTabs({ tabs, active, onChange }: { tabs: { id: string; label: string; icon?: string; badge?: number }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 2, background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: 4, marginBottom: "1rem" }}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 6, border: "none", background: isActive ? "#fff" : "transparent", color: isActive ? "var(--primary)" : "var(--text2)", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: isActive ? 900 : 700, cursor: "pointer", boxShadow: isActive ? "0 1px 4px rgba(10,42,94,0.12)" : "none", transition: "all .15s" }}>
            {tab.icon && <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />}
            {tab.label}
            {tab.badge != null && tab.badge > 0 && <span style={{ background: "var(--accent)", color: "#fff", fontSize: 9, fontWeight: 900, padding: "1px 5px", borderRadius: 8, minWidth: 16, textAlign: "center" }}>{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function AdminDivider({ label }: { label?: string }) {
  if (!label) return <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
export function AdminToggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <div onClick={() => onChange(!checked)} style={{ width: 36, height: 20, borderRadius: 10, background: checked ? "var(--primary)" : "var(--border)", position: "relative", transition: "background .2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 2, right: checked ? 2 : 18, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "right .2s" }} />
      </div>
      {label && <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 700 }}>{label}</span>}
    </label>
  );
}

// ─── Inline hook for toast ────────────────────────────────────────────────────
export function useAdminToast() {
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable identity — callers put showToast in useCallback/useEffect deps; a fresh
  // function each render would retrigger those effects and cause fetch loops.
  const showToast = useCallback((type: "success" | "error" | "info", msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ type, msg });
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);
  return { toast, showToast };
}
