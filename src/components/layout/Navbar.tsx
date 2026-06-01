"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/store/cart";
import { useSession, signOut } from "next-auth/react";
import AuthModal from "@/components/auth/AuthModal";
import CartPanel from "@/components/layout/CartPanel";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  category?: { name: string };
  images: { url: string }[];
}

const mobileCategories = [
  { href: "/category/valves",   icon: "ti-circle-dotted", label: "شیرآلات" },
  { href: "/category/pipes",    icon: "ti-minus",         label: "لوله‌ها" },
  { href: "/category/fittings", icon: "ti-git-merge",     label: "اتصالات" },
  { href: "/category/pumps",    icon: "ti-activity",      label: "پمپ و تجهیزات" },
  { href: "/category/sanitary", icon: "ti-droplet",       label: "لوازم بهداشتی" },
  { href: "/category/hardware", icon: "ti-tool",          label: "یراق‌آلات" },
];

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { totalItems, toggleCart } = useCart();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [dropOpen, setDropOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Hydration fix: don't render cart count until client has rehydrated the store
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setDropOpen(false); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/products?q=${encodeURIComponent(query)}&limit=6`);
      const data = await res.json();
      setResults(data.products ?? []);
      setDropOpen(true);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      setDropOpen(false);
    }
  }

  function handleMobileSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      setMobileMenuOpen(false);
      setDropOpen(false);
    }
  }

  function formatPrice(n: number) {
    return new Intl.NumberFormat("fa-IR").format(n) + " ت";
  }

  const count = mounted ? totalItems() : 0;
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes((session?.user as { role?: string })?.role ?? "");

  return (
    <>
      <nav style={{ background: "var(--primary)", position: "sticky", top: 0, zIndex: 700, boxShadow: "var(--shadow-lg)" }}>
        <div style={{ maxWidth: 1280, margin: "auto", padding: "0 1rem", display: "flex", alignItems: "center", gap: "0.75rem", height: 64 }}>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="منو"
            style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, padding: "0 4px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 44, minHeight: 44, flexShrink: 0 }}
          >
            <i className="ti ti-menu-2" />
          </button>

          {/* Logo */}
          <Link href="/" style={{ fontSize: 22, fontWeight: 900, color: "#fff", whiteSpace: "nowrap", flexShrink: 0 }}>
            Marjan<span style={{ color: "var(--accent)" }}>.</span>
          </Link>

          {/* Search — desktop only */}
          <div ref={searchRef} className="hidden md:block search-wrap" style={{ flex: 1, position: "relative" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", background: "rgba(255,255,255,.12)", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid rgba(255,255,255,.18)" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setDropOpen(true)}
                onBlur={() => setTimeout(() => setDropOpen(false), 200)}
                placeholder="جستجو... (لوله، شیرآلات، اتصالات)"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "10px 14px", color: "#fff", fontFamily: "Vazirmatn", fontSize: 14 }}
              />
              <button type="submit" style={{ background: "var(--accent)", border: "none", padding: "0 18px", color: "#fff", fontSize: 18 }}>
                <i className="ti ti-search" />
              </button>
            </form>

            {dropOpen && results.length > 0 && (
              <div className="search-dropdown open">
                <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text3)", letterSpacing: ".08em", textTransform: "uppercase", padding: "10px 14px 4px" }}>محصولات</div>
                {results.map((r) => (
                  <div
                    key={r.id}
                    onMouseDown={() => { router.push(`/product/${r.slug}`); setDropOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer" }}
                    className="search-result-item"
                  >
                    <div style={{ width: 36, height: 36, background: "var(--bg2)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {r.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.images[0].url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <i className="ti ti-package" style={{ fontSize: 18, color: "var(--primary)" }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{r.category?.name}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", whiteSpace: "nowrap" }}>{formatPrice(r.price)}</div>
                  </div>
                ))}
                <div
                  onMouseDown={() => { router.push(`/products?q=${encodeURIComponent(query)}`); setDropOpen(false); }}
                  style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", textAlign: "center", fontSize: 12, fontWeight: 900, color: "var(--primary)", cursor: "pointer" }}
                >
                  مشاهده همه نتایج <i className="ti ti-arrow-left" />
                </div>
              </div>
            )}
          </div>

          {/* Spacer on mobile to push actions to the left */}
          <div className="flex-1 md:hidden" />

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            {/* Wishlist — desktop only */}
            <Link
              href="/wishlist"
              className="hidden md:flex"
              style={{ color: "rgba(255,255,255,.8)", fontSize: 22, position: "relative", padding: 8, alignItems: "center", justifyContent: "center", minWidth: 44, minHeight: 44 }}
            >
              <i className="ti ti-heart" />
            </Link>

            {/* Cart */}
            <button
              onClick={toggleCart}
              style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.8)", fontSize: 22, position: "relative", padding: 8, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 44, minHeight: 44 }}
            >
              <i className="ti ti-shopping-cart" />
              {count > 0 && (
                <span style={{ position: "absolute", top: 2, right: 2, background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  {count}
                </span>
              )}
            </button>

            {/* User menu */}
            {session?.user ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", padding: "8px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, minHeight: 44 }}
                >
                  <i className="ti ti-user" />
                  <span className="hidden md:inline">{session.user.name?.split(" ")[0]}</span>
                </button>
                {userMenuOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow-lg)", minWidth: 180, zIndex: 600, overflow: "hidden" }}>
                    <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--text2)", minHeight: 44 }}>
                      <i className="ti ti-layout-dashboard" style={{ color: "var(--primary)" }} /> داشبورد
                    </Link>
                    <Link href="/dashboard/orders" onClick={() => setUserMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--text2)", minHeight: 44 }}>
                      <i className="ti ti-package" style={{ color: "var(--primary)" }} /> سفارش‌ها
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--accent)", minHeight: 44 }}>
                        <i className="ti ti-shield-lock" /> پنل ادمین
                      </Link>
                    )}
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      <button
                        onClick={() => { signOut({ callbackUrl: "/" }); setUserMenuOpen(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#c0392b", background: "none", border: "none", width: "100%", textAlign: "right", minHeight: 44 }}
                      >
                        <i className="ti ti-logout" /> خروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", padding: "8px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, minHeight: 44 }}
              >
                <i className="ti ti-user" />
                <span className="hidden md:inline">ورود / ثبت‌نام</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile nav overlay ── */}
      <div className={`mobile-nav-overlay ${mobileMenuOpen ? "open" : ""}`} onClick={() => setMobileMenuOpen(false)} />

      {/* ── Mobile nav panel ── */}
      <div className={`mobile-nav-panel ${mobileMenuOpen ? "open" : ""}`}>
        {/* Panel header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,.1)", flexShrink: 0 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>Marjan<span style={{ color: "var(--accent)" }}>.</span></span>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Mobile search */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,.1)", flexShrink: 0 }}>
          <form onSubmit={handleMobileSearch} style={{ display: "flex", background: "rgba(255,255,255,.1)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "10px 14px", color: "#fff", fontFamily: "Vazirmatn", fontSize: 14 }}
            />
            <button type="submit" style={{ background: "var(--accent)", border: "none", padding: "0 16px", color: "#fff", fontSize: 18, minHeight: 44 }}>
              <i className="ti ti-search" />
            </button>
          </form>
        </div>

        {/* Auth info (if logged in) */}
        {session?.user && (
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="ti ti-user" style={{ color: "#fff", fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{session.user.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>{session.user.email}</div>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav style={{ flex: 1, overflowY: "auto" }}>
          {/* Dashboard links when logged in */}
          {session?.user && (
            <div style={{ borderBottom: "1px solid rgba(255,255,255,.1)" }}>
              {[
                { href: "/dashboard",        icon: "ti-layout-dashboard", label: "داشبورد" },
                { href: "/dashboard/orders", icon: "ti-package",          label: "سفارش‌ها" },
                ...(isAdmin ? [{ href: "/admin", icon: "ti-shield-lock", label: "پنل ادمین" }] : []),
              ].map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 1.25rem", color: "#fff", fontSize: 14, fontWeight: 700, minHeight: 48 }}
                >
                  <i className={`ti ${item.icon}`} style={{ fontSize: 18, color: "var(--accent)", flexShrink: 0 }} />
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* Categories */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,.35)", letterSpacing: ".1em", textTransform: "uppercase", padding: ".75rem 1.25rem .25rem" }}>دسته‌بندی</div>
            {mobileCategories.map((cat) => (
              <Link key={cat.href} href={cat.href} onClick={() => setMobileMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 1.25rem", color: "rgba(255,255,255,.8)", fontSize: 13, fontWeight: 700, minHeight: 48 }}
              >
                <i className={`ti ${cat.icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
                {cat.label}
              </Link>
            ))}
          </div>

          {/* Secondary links */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}>
            {[
              { href: "/blog",    icon: "ti-news",         label: "وبلاگ" },
              { href: "/about",   icon: "ti-info-circle",  label: "درباره ما" },
              { href: "/contact", icon: "ti-phone",        label: "تماس با ما" },
              { href: "/faq",     icon: "ti-help",         label: "سوالات متداول" },
            ].map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 1.25rem", color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 700, minHeight: 48 }}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer action */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid rgba(255,255,255,.1)", flexShrink: 0 }}>
          {session?.user ? (
            <button
              onClick={() => { signOut({ callbackUrl: "/" }); setMobileMenuOpen(false); }}
              style={{ width: "100%", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", padding: 13, borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 700, fontFamily: "Vazirmatn", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <i className="ti ti-logout" /> خروج از حساب
            </button>
          ) : (
            <button
              onClick={() => { setAuthOpen(true); setMobileMenuOpen(false); }}
              style={{ width: "100%", background: "var(--accent)", color: "#fff", border: "none", padding: 13, borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 900, fontFamily: "Vazirmatn" }}
            >
              ورود / ثبت‌نام
            </button>
          )}
        </div>
      </div>

      <CartPanel />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* Click-outside for user menu */}
      {userMenuOpen && (
        <div onClick={() => setUserMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 599 }} />
      )}
    </>
  );
}
