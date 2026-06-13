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
  const { items, totalItems, totalPrice, updateQty, removeItem } = useCart();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [catResults, setCatResults] = useState<CategoryResult[]>([]);
  const [dropOpen, setDropOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartMenuOpen, setCartMenuOpen] = useState(false);
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
  const cartMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openCartMenu() {
    if (cartMenuTimeout.current) clearTimeout(cartMenuTimeout.current);
    setCartMenuOpen(true);
  }
  function closeCartMenu() {
    cartMenuTimeout.current = setTimeout(() => setCartMenuOpen(false), 180);
  }

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
        <div style={{ width: "100%", padding: "0 2rem", display: "flex", alignItems: "center", height: 84 }}>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="منو"
            style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, padding: "0 4px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 44, minHeight: 44, flexShrink: 0 }}
          >
            <i className="ti ti-menu-2" />
          </button>

          {/* Logo — right corner */}
          <Link href="/" style={{ fontSize: 24, fontWeight: 900, color: "#fff", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 8, marginLeft: "2rem" }}>
            {siteLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={siteLogo} alt={siteName} style={{ height: 46, maxWidth: 140, objectFit: "contain" }} />
            ) : (
              <>{siteName}<span style={{ color: "var(--accent)" }}>.</span></>
            )}
          </Link>

          {/* Search — desktop only, fixed width, stays right next to logo */}
          <div ref={searchRef} className="hidden md:block search-wrap" style={{ width: "min(520px, 42vw)", flexShrink: 0, position: "relative", marginLeft: "1.5rem" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", background: "rgba(255,255,255,.15)", borderRadius: 28, overflow: "hidden", border: "1.5px solid rgba(255,255,255,.28)" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setDropOpen(true)}
                onBlur={() => setTimeout(() => setDropOpen(false), 200)}
                placeholder="محصول، برند یا دسته مورد نظرتان را جستجو کنید"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "13px 20px", color: "#fff", fontFamily: "Vazirmatn", fontSize: 14 }}
              />
              <button type="submit" style={{ background: "var(--accent)", border: "none", padding: "0 22px", color: "#fff", fontSize: 19, borderRadius: "0 28px 28px 0", flexShrink: 0 }}>
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

          {/* Spacer — pushes actions to the far left on all screen sizes */}
          <div style={{ flex: 1 }} />

          {/* Actions — left edge (search flex:1 pushes them there) */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>

            {/* Cart — hover mini-cart, click goes to /cart */}
            <div
              style={{ position: "relative" }}
              onMouseEnter={openCartMenu}
              onMouseLeave={closeCartMenu}
            >
              <button
                onClick={() => router.push("/cart")}
                className="nav-icon-btn"
                aria-label="سبد خرید"
              >
                <i className="ti ti-shopping-cart" />
                {count > 0 && (
                  <span style={{ position: "absolute", top: 2, right: 2, background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    {count}
                  </span>
                )}
              </button>

              {/* Mini-cart dropdown */}
              {cartMenuOpen && mounted && (
                <div
                  onMouseEnter={openCartMenu}
                  onMouseLeave={closeCartMenu}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 8px 40px rgba(0,0,0,.16)",
                    width: 340,
                    zIndex: 200,
                    border: "1px solid var(--border)",
                    animation: "fadeIn .15s ease",
                    overflow: "hidden",
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                      سبد خرید شما
                      {items.length > 0 && (
                        <span style={{ color: "var(--text3)", fontWeight: 700, fontSize: 12 }}>
                          | {totalItems()} عدد کالا
                        </span>
                      )}
                    </span>
                    <Link
                      href="/cart"
                      onClick={() => setCartMenuOpen(false)}
                      style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}
                    >
                      مشاهده سبد خرید <i className="ti ti-chevron-left" style={{ fontSize: 11 }} />
                    </Link>
                  </div>

                  {items.length === 0 ? (
                    <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text3)" }}>
                      <i className="ti ti-shopping-cart-off" style={{ fontSize: 44, display: "block", marginBottom: 10 }} />
                      <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>سبد خرید شما خالی است</p>
                    </div>
                  ) : (
                    <>
                      {/* Items list */}
                      <div style={{ maxHeight: 300, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}>
                        {items.slice(0, 5).map((item) => (
                          <div
                            key={`${item.id}-${item.sizeLabel ?? ""}`}
                            style={{ display: "flex", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--bg2)", alignItems: "flex-start" }}
                          >
                            {/* Image */}
                            <div style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden", background: "var(--bg)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <i className="ti ti-package" style={{ fontSize: 24, color: "var(--border)" }} />
                              )}
                            </div>

                            {/* Details */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 900, color: "var(--text)", lineHeight: 1.4, marginBottom: 5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                {item.name}
                              </div>
                              {item.sizeLabel && (
                                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>سایز: {item.sizeLabel}</div>
                              )}
                              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 8 }}>
                                {new Intl.NumberFormat("fa-IR").format(item.price * item.quantity)} تومان
                              </div>

                              {/* Qty control */}
                              <div style={{ display: "flex", alignItems: "center", background: "var(--bg)", borderRadius: 8, width: "fit-content", overflow: "hidden" }}>
                                <button
                                  onClick={() => updateQty(item.id, item.sizeLabel, item.quantity + 1)}
                                  style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: "var(--primary)", fontSize: 15, cursor: "pointer" }}
                                >
                                  <i className="ti ti-plus" />
                                </button>
                                <span style={{ width: 28, textAlign: "center", fontSize: 13, fontWeight: 900, color: "var(--text)" }}>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => item.quantity === 1
                                    ? removeItem(item.id, item.sizeLabel)
                                    : updateQty(item.id, item.sizeLabel, item.quantity - 1)}
                                  style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: item.quantity === 1 ? "#e53935" : "var(--primary)", fontSize: item.quantity === 1 ? 14 : 15, cursor: "pointer" }}
                                >
                                  <i className={item.quantity === 1 ? "ti ti-trash" : "ti ti-minus"} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {items.length > 5 && (
                          <div style={{ padding: "8px 16px", fontSize: 12, color: "var(--text3)", textAlign: "center" }}>
                            و {items.length - 5} کالای دیگر...
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div style={{ borderTop: "1px solid var(--border)", display: "flex", alignItems: "stretch" }}>
                        <Link
                          href="/checkout"
                          onClick={() => setCartMenuOpen(false)}
                          style={{ flex: 1, background: "var(--primary)", color: "#fff", padding: "13px 16px", fontSize: 13, fontWeight: 900, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          ثبت سفارش
                        </Link>
                        <div style={{ width: 1, background: "rgba(255,255,255,.3)", flexShrink: 0 }} />
                        <div style={{ flex: 1, padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1 }}>
                          <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700 }}>مبلغ کل</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)" }}>
                            {new Intl.NumberFormat("fa-IR").format(totalPrice())} تومان
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* User menu */}
            {session?.user ? (
              <div
                ref={menuRef}
                style={{ position: "relative" }}
                onMouseEnter={openProfileMenu}
                onMouseLeave={closeProfileMenu}
              >
                {/* Trigger — plain icon button like cart/wishlist */}
                <button
                  onClick={() => router.push("/dashboard")}
                  className="nav-icon-btn"
                  aria-label="حساب کاربری"
                >
                  <i className="ti ti-user-circle" style={{ fontSize: 24 }} />
                </button>

                {/* Dropdown — Digikala-style clean list */}
                {userMenuOpen && (
                  <div
                    onMouseEnter={openProfileMenu}
                    onMouseLeave={closeProfileMenu}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: 0,
                      background: "#fff",
                      borderRadius: 12,
                      boxShadow: "0 8px 40px rgba(0,0,0,.16)",
                      minWidth: 280,
                      zIndex: 200,
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      animation: "fadeIn .15s ease",
                    }}
                  >
                    {/* Row: account + username */}
                    <Link href="/dashboard" className="dk-menu-row" onClick={() => setUserMenuOpen(false)}>
                      <div className="dk-row-main">
                        <i className="ti ti-user-circle" style={{ fontSize: 16, color: "var(--primary)" }} />
                        حساب کاربری
                      </div>
                      <div className="dk-row-end">
                        <span className="dk-row-secondary">{session.user.name?.split(" ")[0]}</span>
                        <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
                      </div>
                    </Link>

                    {/* Row: edit profile */}
                    <Link href="/dashboard" className="dk-menu-row" onClick={() => setUserMenuOpen(false)}>
                      <div className="dk-row-main">
                        <i className="ti ti-user-edit" style={{ fontSize: 16, color: "var(--text3)" }} />
                        ویرایش مشخصات فردی
                      </div>
                      <i className="ti ti-chevron-left" style={{ fontSize: 12, color: "var(--text3)" }} />
                    </Link>

                    <div className="dk-menu-divider" />

                    {/* Row: wallet + balance */}
                    <Link href="/dashboard?tab=wallet" className="dk-menu-row" onClick={() => setUserMenuOpen(false)}>
                      <div className="dk-row-main">
                        <i className="ti ti-wallet" style={{ fontSize: 16, color: "var(--accent)" }} />
                        کیف پول
                      </div>
                      <span className="dk-row-balance">
                        {walletLoading
                          ? "..."
                          : walletBalance !== null
                          ? `${walletBalance.toLocaleString("fa-IR")} تومان`
                          : "—"}
                      </span>
                    </Link>

                    <div className="dk-menu-divider" />

                    {/* Row: wishlist */}
                    <Link href="/wishlist" className="dk-menu-row" onClick={() => setUserMenuOpen(false)}>
                      <div className="dk-row-main">
                        <i className="ti ti-heart" style={{ fontSize: 16, color: "#e74c3c" }} />
                        لیست علاقه‌مندی
                      </div>
                      <i className="ti ti-chevron-left" style={{ fontSize: 12, color: "var(--text3)" }} />
                    </Link>

                    {/* Row: orders */}
                    <Link href="/dashboard/orders" className="dk-menu-row" onClick={() => setUserMenuOpen(false)}>
                      <div className="dk-row-main">
                        <i className="ti ti-package" style={{ fontSize: 16, color: "#1a7a4a" }} />
                        سفارش های من
                      </div>
                      <i className="ti ti-chevron-left" style={{ fontSize: 12, color: "var(--text3)" }} />
                    </Link>

                    {/* Admin */}
                    {isAdmin && (
                      <>
                        <div className="dk-menu-divider" />
                        <Link href="/admin" className="dk-menu-row" onClick={() => setUserMenuOpen(false)}>
                          <div className="dk-row-main">
                            <i className="ti ti-shield-lock" style={{ fontSize: 16, color: "var(--accent)" }} />
                            پنل ادمین
                          </div>
                          <i className="ti ti-chevron-left" style={{ fontSize: 12, color: "var(--text3)" }} />
                        </Link>
                      </>
                    )}

                    <div className="dk-menu-divider" />

                    {/* Row: logout */}
                    <button
                      onClick={() => { signOut({ callbackUrl: "/" }); setUserMenuOpen(false); }}
                      className="dk-menu-row dk-menu-logout"
                    >
                      <div className="dk-row-main">
                        <i className="ti ti-logout" style={{ fontSize: 16 }} />
                        خروج از حساب کاربری
                      </div>
                    </button>
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
