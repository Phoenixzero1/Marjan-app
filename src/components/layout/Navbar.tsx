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
  category?: string | null;
  images?: { url: string }[];
}

interface CategoryResult {
  id: string;
  name: string;
  slug: string;
}

const mobileCategories = [
  { href: "/category/valves",   icon: "ti-circle-dotted", label: "شیرآلات" },
  { href: "/category/pipes",    icon: "ti-minus",         label: "لوله‌ها" },
  { href: "/category/fittings", icon: "ti-git-merge",     label: "اتصالات" },
  { href: "/category/pumps",    icon: "ti-activity",      label: "پمپ و تجهیزات" },
  { href: "/category/sanitary", icon: "ti-droplet",       label: "لوازم بهداشتی" },
  { href: "/category/hardware", icon: "ti-tool",          label: "یراق‌آلات" },
];

interface NavbarProps {
  siteName: string;
  siteLogo: string;
}

export default function Navbar({ siteName, siteLogo }: NavbarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { totalItems } = useCart();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [catResults, setCatResults] = useState<CategoryResult[]>([]);
  const [dropOpen, setDropOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Hydration fix: don't render cart count until client has rehydrated the store
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setCatResults([]); setDropOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.suggestions ?? []);
        setCatResults(data.categories ?? []);
        setDropOpen(true);
      } catch {
        setDropOpen(false);
      }
    }, 250);
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
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const profileMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openProfileMenu() {
    if (profileMenuTimeout.current) clearTimeout(profileMenuTimeout.current);
    setUserMenuOpen(true);
  }
  function closeProfileMenu() {
    profileMenuTimeout.current = setTimeout(() => setUserMenuOpen(false), 180);
  }

  // Fetch wallet balance the first time the dropdown opens
  useEffect(() => {
    if (!userMenuOpen || !session?.user || walletBalance !== null) return;
    setWalletLoading(true);
    fetch("/api/user/wallet")
      .then((r) => r.json())
      .then((d) => { setWalletBalance(d.balance ?? 0); })
      .catch(() => { setWalletBalance(0); })
      .finally(() => setWalletLoading(false));
  }, [userMenuOpen, session?.user, walletBalance]);

  return (
    <>
      <nav className={`site-nav${scrolled ? " site-nav--scrolled" : ""}`} style={{ position: "sticky", top: 0, zIndex: 50 }}>
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
          <Link href="/" style={{ fontSize: 22, fontWeight: 900, color: "#fff", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center" }}>
            {siteLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={siteLogo} alt={siteName} style={{ height: 36, maxWidth: 120, objectFit: "contain" }} />
            ) : (
              <>{siteName}<span style={{ color: "var(--accent)" }}>.</span></>
            )}
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

            {dropOpen && (results.length > 0 || catResults.length > 0) && (
              <div className="search-dropdown open">
                {results.length > 0 && (
                  <>
                    <div className="search-section-title">محصولات</div>
                    {results.map((r) => (
                      <div
                        key={r.id}
                        onMouseDown={() => { router.push(`/product/${r.slug}`); setDropOpen(false); }}
                        className="search-result-item"
                      >
                        <div className="search-result-icon">
                          <i className="ti ti-package" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="search-result-name">{r.name}</div>
                          {r.category && <div className="search-result-meta">{r.category}</div>}
                        </div>
                        <div className="search-result-price">{formatPrice(r.price)}</div>
                      </div>
                    ))}
                  </>
                )}
                {catResults.length > 0 && (
                  <>
                    <div className="search-section-title">دسته‌بندی‌ها</div>
                    {catResults.map((c) => (
                      <div
                        key={c.id}
                        onMouseDown={() => { router.push(`/category/${c.slug}`); setDropOpen(false); }}
                        className="search-result-item"
                      >
                        <div className="search-result-icon">
                          <i className="ti ti-category" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="search-result-name">{c.name}</div>
                        </div>
                        <i className="ti ti-chevron-left" style={{ fontSize: 13, color: "var(--text3)" }} />
                      </div>
                    ))}
                  </>
                )}
                <div
                  onMouseDown={() => { router.push(`/products?q=${encodeURIComponent(query)}`); setDropOpen(false); }}
                  className="search-footer"
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
              className="nav-icon-btn nav-icon-desktop"
            >
              <i className="ti ti-heart" />
            </Link>

            {/* Cart — click navigates to cart page */}
            <button
              onClick={() => router.push("/cart")}
              className="nav-icon-btn"
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
              <div
                ref={menuRef}
                style={{ position: "relative" }}
                onMouseEnter={openProfileMenu}
                onMouseLeave={closeProfileMenu}
              >
                {/* Trigger button — click goes to dashboard, hover opens dropdown */}
                <button
                  onClick={() => router.push("/dashboard")}
                  className="nav-pill-btn nav-profile-btn"
                  data-open={userMenuOpen ? "true" : "false"}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {(session.user.name ?? "U")[0].toUpperCase()}
                  </div>
                  <span className="hidden md:inline" style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {session.user.name?.split(" ")[0]}
                  </span>
                  <i className={`ti ti-chevron-${userMenuOpen ? "up" : "down"} hidden md:inline`} style={{ fontSize: 12, opacity: 0.7 }} />
                </button>

                {/* Dropdown panel — shown on hover */}
                {userMenuOpen && (
                  <div
                    onMouseEnter={openProfileMenu}
                    onMouseLeave={closeProfileMenu}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      background: "#fff",
                      borderRadius: "var(--radius)",
                      boxShadow: "0 8px 40px rgba(0,0,0,.18)",
                      minWidth: 265,
                      zIndex: 200,
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      animation: "fadeIn .15s ease",
                    }}
                  >
                    {/* User header */}
                    <div
                      style={{
                        padding: "16px 18px",
                        background: "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-mid) 100%)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: "50%",
                          background: "var(--accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          fontWeight: 900,
                          color: "#fff",
                          flexShrink: 0,
                          border: "2px solid rgba(255,255,255,.3)",
                        }}
                      >
                        {(session.user.name ?? "U")[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: "#fff",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {session.user.name}
                        </div>
                        {session.user.email && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,.6)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginTop: 2,
                              direction: "ltr",
                            }}
                          >
                            {session.user.email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Main links */}
                    <div style={{ padding: "6px 0" }}>
                      {[
                        { href: "/dashboard",          icon: "ti-user-circle",    label: "ویرایش مشخصات",   iconColor: "var(--primary)" },
                        { href: "/dashboard/orders",   icon: "ti-package",        label: "سفارش‌های من",    iconColor: "#1a7a4a" },
                        { href: "/wishlist",           icon: "ti-heart",          label: "علاقه‌مندی‌ها",  iconColor: "#e74c3c" },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="dropdown-link"
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              background: `${item.iconColor}18`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <i className={`ti ${item.icon}`} style={{ fontSize: 16, color: item.iconColor }} />
                          </div>
                          {item.label}
                          <i className="ti ti-arrow-left" style={{ marginRight: "auto", fontSize: 12, color: "var(--text3)" }} />
                        </Link>
                      ))}

                      {/* Wallet row — shows balance */}
                      <Link
                        href="/dashboard?tab=wallet"
                        onClick={() => setUserMenuOpen(false)}
                        className="dropdown-link"
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: "rgba(232,146,10,.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <i className="ti ti-wallet" style={{ fontSize: 16, color: "var(--accent)" }} />
                        </div>
                        <span style={{ flex: 1 }}>کیف پول</span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: walletLoading ? "var(--text3)" : "var(--accent)",
                            background: "var(--accent-light)",
                            padding: "2px 8px",
                            borderRadius: 20,
                          }}
                        >
                          {walletLoading
                            ? "..."
                            : walletBalance !== null
                            ? `${walletBalance.toLocaleString("fa-IR")} ت`
                            : "—"}
                        </span>
                      </Link>
                    </div>

                    {/* Admin link */}
                    {isAdmin && (
                      <>
                        <div style={{ height: 1, background: "var(--border)", margin: "0 12px" }} />
                        <div style={{ padding: "6px 0" }}>
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="dropdown-link"
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: "rgba(232,146,10,.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <i className="ti ti-shield-lock" style={{ fontSize: 16, color: "var(--accent)" }} />
                            </div>
                            پنل ادمین
                            <i className="ti ti-arrow-left" style={{ marginRight: "auto", fontSize: 12, color: "var(--text3)" }} />
                          </Link>
                        </div>
                      </>
                    )}

                    {/* Logout */}
                    <div style={{ height: 1, background: "var(--border)", margin: "0 12px" }} />
                    <div style={{ padding: "6px 0 8px" }}>
                      <button
                        onClick={() => { signOut({ callbackUrl: "/" }); setUserMenuOpen(false); }}
                        className="dropdown-link dropdown-link-danger"
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: "rgba(192,57,43,.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <i className="ti ti-logout" style={{ fontSize: 16, color: "#c0392b" }} />
                        </div>
                        خروج از حساب
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="nav-pill-btn nav-login-btn"
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
          {siteLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={siteLogo} alt={siteName} style={{ height: 30, maxWidth: 100, objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{siteName}<span style={{ color: "var(--accent)" }}>.</span></span>
          )}
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
                { href: "/dashboard",           icon: "ti-user-circle",  label: "ویرایش مشخصات" },
                { href: "/dashboard/orders",    icon: "ti-package",      label: "سفارش‌های من" },
                { href: "/dashboard?tab=wallet",icon: "ti-wallet",       label: "کیف پول" },
                { href: "/wishlist",            icon: "ti-heart",        label: "علاقه‌مندی‌ها" },
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
            {/* Organizational — highlighted orange */}
            <Link href="/organizational" onClick={() => setMobileMenuOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 1.25rem", color: "#e8920a", fontSize: 14, fontWeight: 900, minHeight: 48, borderBottom: "1px solid rgba(255,255,255,.1)" }}
            >
              <i className="ti ti-building-skyscraper" style={{ fontSize: 18, flexShrink: 0 }} />
              خرید سازمانی
            </Link>
            {[
              { href: "/blog",    icon: "ti-news",         label: "وبلاگ" },
              { href: "/invoice", icon: "ti-file-invoice", label: "فاکتورساز" },
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
    </>
  );
}
