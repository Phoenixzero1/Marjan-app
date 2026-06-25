"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_NAV, isCategoryActive, isItemActive, itemBadgeCount, categoryBadgeCount,
  type AdminNavCategory, type AdminNavItem,
} from "@/components/admin/adminNav";
import { useAdminNotif } from "@/components/admin/AdminNotifProvider";
import { AdminHeaderActions } from "@/components/admin/AdminHeaderActions";

export function AdminTopNav() {
  const pathname = usePathname();
  const { counts, seen } = useAdminNotif();
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenId(id);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 120);
  };

  return (
    <header className="admin-topnav" style={{
      background: "var(--primary-dark)", flexShrink: 0, padding: "0 16px",
      height: 56, display: "flex", alignItems: "center", gap: 16,
      borderBottom: "1px solid rgba(255,255,255,0.08)", position: "relative", zIndex: 50,
    }}>
      {/* ── Brand ── */}
      <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, background: "var(--accent)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 10px rgba(232,146,10,0.40)" }}>
          <i className="ti ti-shield-lock" style={{ fontSize: 17, color: "#fff" }} />
        </div>
        <div className="admin-topnav__brand-text">
          <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>پنل مدیریت</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.42)" }}>مرجان شاپ</div>
        </div>
      </Link>

      {/* ── Desktop category nav ── */}
      <nav className="admin-topnav__desktop" style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
        {ADMIN_NAV.map((cat) => (
          <CategoryNav
            key={cat.id} cat={cat} pathname={pathname}
            isOpen={openId === cat.id} onOpen={() => open(cat.id)} onClose={scheduleClose}
            badge={categoryBadgeCount(cat, counts, seen)}
            renderItemBadge={(it) => itemBadgeCount(it, counts, seen)}
          />
        ))}
      </nav>

      {/* ── Right actions (search + bell + profile) ── */}
      <div className="admin-topnav__actions" style={{ flexShrink: 0 }}>
        <AdminHeaderActions />
      </div>

      {/* ── Mobile hamburger ── */}
      <button
        className="admin-topnav__hamburger"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="منو"
        style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", width: 38, height: 38, borderRadius: 9, cursor: "pointer", fontSize: 19, display: "none", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      >
        <i className={`ti ${mobileOpen ? "ti-x" : "ti-menu-2"}`} />
      </button>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="admin-topnav__drawer" style={{
          position: "fixed", top: 56, right: 0, left: 0, bottom: 0, background: "var(--primary-dark)",
          zIndex: 49, overflowY: "auto", padding: "10px 12px", animation: "adminDropIn .18s ease",
        }}>
          {ADMIN_NAV.map((cat) => {
            if (cat.href) {
              const active = isCategoryActive(cat, pathname);
              return (
                <Link key={cat.id} href={cat.href} onClick={() => setMobileOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, marginBottom: 4, textDecoration: "none", color: active ? "#fff" : "rgba(255,255,255,0.75)", background: active ? "rgba(232,146,10,0.20)" : "transparent", fontWeight: 900, fontSize: 14 }}>
                  <i className={`ti ${cat.icon}`} style={{ fontSize: 18, color: active ? "var(--accent)" : "rgba(255,255,255,0.55)" }} />
                  {cat.label}
                </Link>
              );
            }
            const expanded = expandedCat === cat.id;
            const catActive = isCategoryActive(cat, pathname);
            return (
              <div key={cat.id} style={{ marginBottom: 4 }}>
                <button onClick={() => setExpandedCat(expanded ? null : cat.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: catActive ? "rgba(255,255,255,0.06)" : "transparent", border: "none", cursor: "pointer", color: "#fff", fontFamily: "Vazirmatn", fontWeight: 900, fontSize: 14 }}>
                  <i className={`ti ${cat.icon}`} style={{ fontSize: 18, color: catActive ? "var(--accent)" : "rgba(255,255,255,0.55)" }} />
                  <span style={{ flex: 1, textAlign: "right" }}>{cat.label}</span>
                  <i className={`ti ti-chevron-${expanded ? "up" : "down"}`} style={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }} />
                </button>
                {expanded && (
                  <div style={{ padding: "2px 8px 8px" }}>
                    {(cat.items ?? []).map((it) => {
                      const active = isItemActive(it, pathname);
                      const b = itemBadgeCount(it, counts, seen);
                      return (
                        <Link key={it.href} href={it.href} onClick={() => setMobileOpen(false)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, textDecoration: "none", color: active ? "#fff" : "rgba(255,255,255,0.65)", background: active ? "rgba(232,146,10,0.16)" : "transparent", fontWeight: active ? 900 : 700, fontSize: 13 }}>
                          <i className={`ti ${it.icon}`} style={{ fontSize: 16, color: active ? "var(--accent)" : "rgba(255,255,255,0.45)" }} />
                          <span style={{ flex: 1, textAlign: "right" }}>{it.label}</span>
                          {b > 0 && <span style={{ background: it.badgeColor ?? "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 900, borderRadius: 8, padding: "1px 6px" }}>{b}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}

// ─── One desktop category (button + hover dropdown) ──────────────────────────
function CategoryNav({ cat, pathname, isOpen, onOpen, onClose, badge, renderItemBadge }: {
  cat: AdminNavCategory; pathname: string; isOpen: boolean;
  onOpen: () => void; onClose: () => void;
  badge: number; renderItemBadge: (it: AdminNavItem) => number;
}) {
  const active = isCategoryActive(cat, pathname);

  const btnStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8,
    background: active || isOpen ? "rgba(255,255,255,0.10)" : "transparent",
    border: "none", cursor: "pointer", color: active ? "#fff" : "rgba(255,255,255,0.78)",
    fontFamily: "Vazirmatn", fontSize: 13, fontWeight: active ? 900 : 700, whiteSpace: "nowrap",
    textDecoration: "none", position: "relative", transition: "background .15s, color .15s",
  };

  // Single-link category (dashboard) — no dropdown
  if (cat.href) {
    return (
      <Link href={cat.href} style={btnStyle}>
        <i className={`ti ${cat.icon}`} style={{ fontSize: 16, color: active ? "var(--accent)" : "rgba(255,255,255,0.6)" }} />
        {cat.label}
        {active && <span style={{ position: "absolute", bottom: -2, right: 12, left: 12, height: 2.5, background: "var(--accent)", borderRadius: 2 }} />}
      </Link>
    );
  }

  return (
    <div style={{ position: "relative" }} onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button style={btnStyle}>
        <i className={`ti ${cat.icon}`} style={{ fontSize: 16, color: active ? "var(--accent)" : "rgba(255,255,255,0.6)" }} />
        {cat.label}
        <i className="ti ti-chevron-down" style={{ fontSize: 12, opacity: 0.5, transition: "transform .15s", transform: isOpen ? "rotate(180deg)" : "none" }} />
        {badge > 0 && <span style={{ position: "absolute", top: 3, left: 4, minWidth: 8, height: 8, background: "#c0392b", borderRadius: 5, border: "1.5px solid var(--primary-dark)" }} />}
        {active && <span style={{ position: "absolute", bottom: -2, right: 12, left: 12, height: 2.5, background: "var(--accent)", borderRadius: 2 }} />}
      </button>

      {isOpen && (
        <div className="admin-dropdown" style={{
          position: "absolute", top: "100%", right: 0, minWidth: 234, paddingTop: 8, zIndex: 60,
        }}>
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 32px rgba(7,29,66,0.18)", overflow: "hidden", padding: 6 }}>
            {(cat.items ?? []).map((it) => {
              const itActive = isItemActive(it, pathname);
              const b = renderItemBadge(it);
              return (
                <Link key={it.href} href={it.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 8,
                    textDecoration: "none", fontFamily: "Vazirmatn", fontSize: 13,
                    fontWeight: itActive ? 900 : 700, color: itActive ? "var(--primary)" : "var(--text2)",
                    background: itActive ? "rgba(232,146,10,0.10)" : "transparent",
                    borderRight: itActive ? "3px solid var(--accent)" : "3px solid transparent",
                    transition: "background .12s",
                  }}
                  onMouseEnter={(e) => { if (!itActive) e.currentTarget.style.background = "var(--bg)"; }}
                  onMouseLeave={(e) => { if (!itActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <i className={`ti ${it.icon}`} style={{ fontSize: 16, color: itActive ? "var(--accent)" : "var(--text3)", flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {b > 0 && <span style={{ background: it.badgeColor ?? "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 900, borderRadius: 8, padding: "1px 6px" }}>{b}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
