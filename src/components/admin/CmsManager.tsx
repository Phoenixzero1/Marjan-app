"use client";

import { useState, useEffect, useCallback } from "react";

type CmsTab = "pages" | "banners" | "menus" | "status" | "topbar";

interface Page { id: string; slug: string; title: string; content: string; metaTitle: string | null; metaDesc: string | null; isActive: boolean; }
interface Banner { id: string; title: string; subtitle: string | null; imageUrl: string | null; buttonText: string | null; buttonLink: string | null; type: string; targetPage: string | null; sortOrder: number; isActive: boolean; startDate: string | null; endDate: string | null; }
interface MenuItem { id: string; menu: string; label: string; url: string; newTab: boolean; sortOrder: number; isActive: boolean; }
interface SiteStatus { registrationClosed: boolean; ordersClosed: boolean; ordersClosedMessage: string; emergencyBanner: boolean; emergencyBannerMessage: string; }

type Toast = { msg: string; ok: boolean };

export default function CmsManager() {
  const [tab, setTab] = useState<CmsTab>("pages");
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = useCallback((msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); }, []);

  // ── Pages ──
  const [pages, setPages] = useState<Page[]>([]);
  const [editPage, setEditPage] = useState<Page | null>(null);
  const [savingPage, setSavingPage] = useState(false);

  // ── Banners ──
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerType, setBannerType] = useState<"hero" | "promo" | "category">("hero");
  const [editBanner, setEditBanner] = useState<Partial<Banner> | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);

  // ── Menus ──
  const [menuType, setMenuType] = useState<"header" | "footer">("header");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editItem, setEditItem] = useState<Partial<MenuItem> | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // ── Status ──
  const [status, setStatus] = useState<SiteStatus>({ registrationClosed: false, ordersClosed: false, ordersClosedMessage: "", emergencyBanner: false, emergencyBannerMessage: "" });
  const [savingStatus, setSavingStatus] = useState(false);

  // ── Topbar ──
  const [topbar, setTopbar] = useState({ site_phone: "", site_hours: "", site_free_shipping_text: "" });
  const [savingTopbar, setSavingTopbar] = useState(false);

  // Load data per tab
  useEffect(() => {
    if (tab === "pages") fetch("/api/admin/cms/pages").then(r => r.json()).then(d => setPages(d.pages ?? []));
    if (tab === "banners") fetch(`/api/admin/cms/banners?type=${bannerType}`).then(r => r.json()).then(d => setBanners(d.banners ?? []));
    if (tab === "menus") fetch(`/api/admin/cms/menus?menu=${menuType}`).then(r => r.json()).then(d => setMenuItems(d.items ?? []));
    if (tab === "status") fetch("/api/admin/cms/status").then(r => r.json()).then(d => setStatus(d));
    if (tab === "topbar") {
      fetch("/api/admin/settings?group=contact").then(r => r.json()).then(d => {
        const m = d.map ?? {};
        setTopbar({
          site_phone: m.site_phone ?? "۰۲۱-۴۴۵۵۶۶۷۷",
          site_hours: m.site_hours ?? "شنبه تا پنجشنبه ۸ تا ۱۷",
          site_free_shipping_text: m.site_free_shipping_text ?? "ارسال رایگان بالای ۵ میلیون تومان",
        });
      });
    }
  }, [tab, bannerType, menuType]);

  // ── Page handlers ──
  async function savePage() {
    if (!editPage) return;
    setSavingPage(true);
    try {
      const res = await fetch("/api/admin/cms/pages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editPage) });
      if (!res.ok) throw new Error((await res.json()).error);
      const d = await res.json();
      setPages(prev => prev.some(p => p.slug === d.page.slug) ? prev.map(p => p.slug === d.page.slug ? d.page : p) : [...prev, d.page]);
      setEditPage(null);
      showToast("صفحه ذخیره شد");
    } catch (e) { showToast(String(e), false); }
    finally { setSavingPage(false); }
  }

  // ── Banner handlers ──
  async function saveBanner() {
    if (!editBanner?.title) return;
    setSavingBanner(true);
    try {
      const method = editBanner.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/cms/banners", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editBanner, type: bannerType }) });
      if (!res.ok) throw new Error((await res.json()).error);
      const d = await res.json();
      if (method === "POST") setBanners(prev => [...prev, d.banner]);
      else setBanners(prev => prev.map(b => b.id === d.banner.id ? d.banner : b));
      setEditBanner(null);
      showToast("بنر ذخیره شد");
    } catch (e) { showToast(String(e), false); }
    finally { setSavingBanner(false); }
  }

  async function deleteBanner(id: string) {
    if (!window.confirm("بنر حذف شود؟")) return;
    const res = await fetch(`/api/admin/cms/banners?id=${id}`, { method: "DELETE" });
    if (res.ok) { setBanners(prev => prev.filter(b => b.id !== id)); showToast("حذف شد"); }
    else showToast("خطا در حذف", false);
  }

  async function toggleBanner(b: Banner) {
    const res = await fetch("/api/admin/cms/banners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, isActive: !b.isActive }) });
    if (res.ok) setBanners(prev => prev.map(x => x.id === b.id ? { ...x, isActive: !b.isActive } : x));
  }

  // ── Menu handlers ──
  async function saveMenuItem() {
    if (!editItem?.label || !editItem.url) return;
    setSavingItem(true);
    try {
      const method = editItem.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/cms/menus", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editItem, menu: menuType }) });
      if (!res.ok) throw new Error((await res.json()).error);
      const d = await res.json();
      if (method === "POST") setMenuItems(prev => [...prev, d.item].sort((a, b) => a.sortOrder - b.sortOrder));
      else setMenuItems(prev => prev.map(x => x.id === d.item.id ? d.item : x));
      setEditItem(null);
      showToast("آیتم منو ذخیره شد");
    } catch (e) { showToast(String(e), false); }
    finally { setSavingItem(false); }
  }

  async function deleteMenuItem(id: string) {
    if (!window.confirm("آیتم منو حذف شود؟")) return;
    const res = await fetch(`/api/admin/cms/menus?id=${id}`, { method: "DELETE" });
    if (res.ok) { setMenuItems(prev => prev.filter(x => x.id !== id)); showToast("حذف شد"); }
    else showToast("خطا در حذف", false);
  }

  // ── Status handler ──
  async function saveStatus() {
    setSavingStatus(true);
    try {
      const res = await fetch("/api/admin/cms/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registration_closed: status.registrationClosed, orders_closed: status.ordersClosed, orders_closed_message: status.ordersClosedMessage, emergency_banner: status.emergencyBanner, emergency_banner_message: status.emergencyBannerMessage }) });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("تنظیمات وضعیت ذخیره شد");
    } catch (e) { showToast(String(e), false); }
    finally { setSavingStatus(false); }
  }

  // ── Topbar handler ──
  async function saveTopbar() {
    setSavingTopbar(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: topbar, group: "contact" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("نوار بالا ذخیره شد");
    } catch (e) { showToast(String(e), false); }
    finally { setSavingTopbar(false); }
  }

  const inp = { border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" as const };
  const lbl = { fontSize: 12, fontWeight: 700, color: "var(--text)", display: "block" as const, marginBottom: 5 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>{toast.msg}</div>}

      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>مدیریت محتوا (CMS)</h2>
        <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>صفحات، بنرها، منوها و وضعیت سایت را مدیریت کنید</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border)", flexWrap: "wrap" }}>
        {([["pages", "صفحات"], ["banners", "بنرها"], ["menus", "منوها"], ["status", "وضعیت سایت"], ["topbar", "نوار بالا"]] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", borderBottom: tab === t ? "2px solid var(--primary)" : "2px solid transparent", marginBottom: -2, padding: "10px 20px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, color: tab === t ? "var(--primary)" : "var(--text3)", cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {/* ── PAGES TAB ── */}
      {tab === "pages" && (
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {pages.map(p => (
              <button key={p.slug} onClick={() => setEditPage({ ...p })} style={{ background: editPage?.slug === p.slug ? "var(--primary)" : "#fff", color: editPage?.slug === p.slug ? "#fff" : "var(--text)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "right" }}>
                {p.title}
              </button>
            ))}
            <button onClick={() => setEditPage({ id: "", slug: "", title: "", content: "", metaTitle: null, metaDesc: null, isActive: true })} style={{ background: "var(--bg)", border: "1.5px dashed var(--border)", borderRadius: 8, padding: "10px 14px", fontFamily: "Vazirmatn", fontSize: 12, cursor: "pointer", color: "var(--text3)" }}>+ صفحه جدید</button>
          </div>

          {editPage ? (
            <div style={{ flex: 1, background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={lbl}>عنوان صفحه</label><input style={inp} value={editPage.title} onChange={e => setEditPage(p => p ? { ...p, title: e.target.value } : p)} /></div>
                <div><label style={lbl}>اسلاگ (URL)</label><input style={{ ...inp, direction: "ltr" }} value={editPage.slug} onChange={e => setEditPage(p => p ? { ...p, slug: e.target.value } : p)} placeholder="about, terms, privacy..." /></div>
                <div><label style={lbl}>عنوان SEO (meta title)</label><input style={inp} value={editPage.metaTitle ?? ""} onChange={e => setEditPage(p => p ? { ...p, metaTitle: e.target.value || null } : p)} placeholder="عنوان برای موتور جستجو" /></div>
                <div><label style={lbl}>توضیح SEO (meta desc)</label><input style={inp} value={editPage.metaDesc ?? ""} onChange={e => setEditPage(p => p ? { ...p, metaDesc: e.target.value || null } : p)} placeholder="توضیح کوتاه برای گوگل" /></div>
              </div>
              <div>
                <label style={lbl}>محتوا (HTML)</label>
                <textarea style={{ ...inp, height: 320, resize: "vertical", fontFamily: "monospace", direction: "ltr" }} value={editPage.content} onChange={e => setEditPage(p => p ? { ...p, content: e.target.value } : p)} />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={savePage} disabled={savingPage} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>{savingPage ? "در حال ذخیره..." : "ذخیره"}</button>
                <button onClick={() => setEditPage(null)} style={{ background: "var(--bg)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 16px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer" }}>انصراف</button>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginRight: "auto", cursor: "pointer" }}>
                  <input type="checkbox" checked={editPage.isActive} onChange={e => setEditPage(p => p ? { ...p, isActive: e.target.checked } : p)} />
                  فعال
                </label>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 13 }}>یک صفحه را انتخاب کنید یا صفحه جدید بسازید</div>
          )}
        </div>
      )}

      {/* ── BANNERS TAB ── */}
      {tab === "banners" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {([["hero", "بنر اصلی (Hero)"], ["promo", "بنر تبلیغاتی"], ["category", "بنر دسته‌بندی"]] as const).map(([t, l]) => (
              <button key={t} onClick={() => setBannerType(t as "hero" | "promo")} style={{ background: bannerType === t ? "var(--primary)" : "var(--bg)", color: bannerType === t ? "#fff" : "var(--text2)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "7px 16px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{l}</button>
            ))}
            <button onClick={() => setEditBanner({ title: "", sortOrder: banners.length, isActive: true, targetPage: null, startDate: null, endDate: null })} style={{ marginRight: "auto", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ بنر جدید</button>
          </div>

          {banners.length === 0 && !editBanner && <div style={{ textAlign: "center", padding: "2rem", color: "var(--text3)" }}>بنری وجود ندارد</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {banners.map((b, idx) => (
              <div key={b.id} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                {/* Up/Down reorder */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button disabled={idx === 0} onClick={async () => {
                    const updated = [...banners];
                    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                    const items = updated.map((x, i) => ({ id: x.id, sortOrder: i }));
                    await fetch("/api/admin/cms/banners", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
                    setBanners(updated.map((x, i) => ({ ...x, sortOrder: i })));
                  }} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 5px", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1, fontSize: 11 }}>▲</button>
                  <button disabled={idx === banners.length - 1} onClick={async () => {
                    const updated = [...banners];
                    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
                    const items = updated.map((x, i) => ({ id: x.id, sortOrder: i }));
                    await fetch("/api/admin/cms/banners", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
                    setBanners(updated.map((x, i) => ({ ...x, sortOrder: i })));
                  }} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 5px", cursor: idx === banners.length - 1 ? "default" : "pointer", opacity: idx === banners.length - 1 ? 0.3 : 1, fontSize: 11 }}>▼</button>
                </div>
                {b.imageUrl && <img src={b.imageUrl} alt="" style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 13 }}>{b.title}</div>
                  {b.subtitle && <div style={{ fontSize: 11, color: "var(--text3)" }}>{b.subtitle}</div>}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                    {b.buttonLink && <span style={{ fontSize: 10, color: "var(--accent)", direction: "ltr" }}>{b.buttonLink}</span>}
                    {b.startDate && <span style={{ fontSize: 10, color: "var(--text3)" }}>از {b.startDate.slice(0,10)}</span>}
                    {b.endDate && <span style={{ fontSize: 10, color: "var(--text3)" }}>تا {b.endDate.slice(0,10)}</span>}
                    {b.targetPage && <span style={{ fontSize: 10, background: "var(--bg)", padding: "1px 6px", borderRadius: 10 }}>{b.targetPage}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 11, background: b.isActive ? "#dcfce7" : "#f1f5f9", color: b.isActive ? "#16a34a" : "#64748b", padding: "2px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap" }}>{b.isActive ? "فعال" : "غیرفعال"}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setEditBanner({ ...b })} style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 6, padding: "5px 10px", fontFamily: "Vazirmatn", fontSize: 11, cursor: "pointer" }}>ویرایش</button>
                  <button onClick={() => toggleBanner(b)} style={{ background: b.isActive ? "#fef3c7" : "#dcfce7", color: b.isActive ? "#92400e" : "#166534", border: "none", borderRadius: 6, padding: "5px 10px", fontFamily: "Vazirmatn", fontSize: 11, cursor: "pointer" }}>{b.isActive ? "غیرفعال" : "فعال"}</button>
                  <button onClick={() => deleteBanner(b.id)} style={{ background: "#fdecea", color: "#c0392b", border: "none", borderRadius: 6, padding: "5px 10px", fontFamily: "Vazirmatn", fontSize: 11, cursor: "pointer" }}>حذف</button>
                </div>
              </div>
            ))}
          </div>

          {editBanner && (
            <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>{editBanner.id ? "ویرایش بنر" : "بنر جدید"}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={lbl}>عنوان <span style={{ color: "red" }}>*</span></label><input style={inp} value={editBanner.title ?? ""} onChange={e => setEditBanner(p => ({ ...p, title: e.target.value }))} /></div>
                <div><label style={lbl}>زیرعنوان</label><input style={inp} value={editBanner.subtitle ?? ""} onChange={e => setEditBanner(p => ({ ...p, subtitle: e.target.value }))} /></div>
                <div><label style={lbl}>آدرس تصویر</label><input style={{ ...inp, direction: "ltr" }} value={editBanner.imageUrl ?? ""} onChange={e => setEditBanner(p => ({ ...p, imageUrl: e.target.value }))} placeholder="/uploads/..." /></div>
                <div><label style={lbl}>صفحه هدف</label>
                  <select style={inp} value={editBanner.targetPage ?? ""} onChange={e => setEditBanner(p => ({ ...p, targetPage: e.target.value || null }))}>
                    <option value="">همه صفحات</option>
                    <option value="home">صفحه اصلی</option>
                    <option value="all">همه</option>
                  </select>
                </div>
                <div><label style={lbl}>متن دکمه</label><input style={inp} value={editBanner.buttonText ?? ""} onChange={e => setEditBanner(p => ({ ...p, buttonText: e.target.value }))} /></div>
                <div><label style={lbl}>لینک دکمه</label><input style={{ ...inp, direction: "ltr" }} value={editBanner.buttonLink ?? ""} onChange={e => setEditBanner(p => ({ ...p, buttonLink: e.target.value }))} placeholder="/products" /></div>
                <div><label style={lbl}>تاریخ شروع</label><input type="date" style={{ ...inp, direction: "ltr" }} value={editBanner.startDate?.slice(0, 10) ?? ""} onChange={e => setEditBanner(p => ({ ...p, startDate: e.target.value || null }))} /></div>
                <div><label style={lbl}>تاریخ پایان</label><input type="date" style={{ ...inp, direction: "ltr" }} value={editBanner.endDate?.slice(0, 10) ?? ""} onChange={e => setEditBanner(p => ({ ...p, endDate: e.target.value || null }))} /></div>
                <div><label style={lbl}>ترتیب</label><input type="number" style={inp} value={editBanner.sortOrder ?? 0} onChange={e => setEditBanner(p => ({ ...p, sortOrder: parseInt(e.target.value) }))} /></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveBanner} disabled={savingBanner} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>{savingBanner ? "..." : "ذخیره"}</button>
                <button onClick={() => setEditBanner(null)} style={{ background: "var(--bg)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer" }}>انصراف</button>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginRight: "auto", cursor: "pointer" }}>
                  <input type="checkbox" checked={editBanner.isActive ?? true} onChange={e => setEditBanner(p => ({ ...p, isActive: e.target.checked }))} /> فعال
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MENUS TAB ── */}
      {tab === "menus" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {(["header", "footer"] as const).map(m => (
              <button key={m} onClick={() => setMenuType(m)} style={{ background: menuType === m ? "var(--primary)" : "var(--bg)", color: menuType === m ? "#fff" : "var(--text2)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "7px 16px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {m === "header" ? "منوی هدر" : "منوی فوتر"}
              </button>
            ))}
            <button onClick={() => setEditItem({ label: "", url: "", newTab: false, sortOrder: menuItems.length, isActive: true })} style={{ marginRight: "auto", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ آیتم جدید</button>
          </div>

          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>{["ترتیب", "عنوان", "لینک", "جدید تب", "وضعیت", "عملیات"].map(h => <th key={h} style={{ background: "var(--bg)", padding: "9px 12px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {menuItems.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: i < menuItems.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "9px 12px" }}>{item.sortOrder}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 700 }}>{item.label}</td>
                    <td style={{ padding: "9px 12px", direction: "ltr", color: "var(--accent)" }}>{item.url}</td>
                    <td style={{ padding: "9px 12px" }}>{item.newTab ? "✓" : "—"}</td>
                    <td style={{ padding: "9px 12px" }}><span style={{ background: item.isActive ? "#dcfce7" : "#f1f5f9", color: item.isActive ? "#16a34a" : "#64748b", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{item.isActive ? "فعال" : "غیرفعال"}</span></td>
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => setEditItem({ ...item })} style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 5, padding: "4px 8px", fontFamily: "Vazirmatn", fontSize: 11, cursor: "pointer" }}>ویرایش</button>
                        <button onClick={() => deleteMenuItem(item.id)} style={{ background: "#fdecea", color: "#c0392b", border: "none", borderRadius: 5, padding: "4px 8px", fontFamily: "Vazirmatn", fontSize: 11, cursor: "pointer" }}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {menuItems.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text3)" }}>آیتمی وجود ندارد</td></tr>}
              </tbody>
            </table>
          </div>

          {editItem && (
            <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900 }}>{editItem.id ? "ویرایش آیتم" : "آیتم جدید"}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 12 }}>
                <div><label style={lbl}>عنوان</label><input style={inp} value={editItem.label ?? ""} onChange={e => setEditItem(p => ({ ...p, label: e.target.value }))} /></div>
                <div><label style={lbl}>لینک</label><input style={{ ...inp, direction: "ltr" }} value={editItem.url ?? ""} onChange={e => setEditItem(p => ({ ...p, url: e.target.value }))} placeholder="/products" /></div>
                <div><label style={lbl}>ترتیب</label><input type="number" style={inp} value={editItem.sortOrder ?? 0} onChange={e => setEditItem(p => ({ ...p, sortOrder: parseInt(e.target.value) }))} /></div>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={editItem.newTab ?? false} onChange={e => setEditItem(p => ({ ...p, newTab: e.target.checked }))} /> باز شدن در تب جدید</label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={editItem.isActive ?? true} onChange={e => setEditItem(p => ({ ...p, isActive: e.target.checked }))} /> فعال</label>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveMenuItem} disabled={savingItem} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>{savingItem ? "..." : "ذخیره"}</button>
                <button onClick={() => setEditItem(null)} style={{ background: "var(--bg)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer" }}>انصراف</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TOPBAR TAB ── */}
      {tab === "topbar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
              <i className="ti ti-layout-navbar" style={{ fontSize: 18 }} /> محتوای نوار بالای سایت
            </div>
            <p style={{ fontSize: 12, color: "var(--text3)", margin: 0 }}>
              این متن‌ها در نوار آبی تیره بالای هر صفحه نمایش داده می‌شوند.
            </p>

            {/* Live preview */}
            <div style={{ background: "#071d42", color: "#b8c8e8", fontSize: 12, padding: "7px 16px", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><i className="ti ti-phone" /> {topbar.site_phone || "—"}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><i className="ti ti-clock" /> {topbar.site_hours || "—"}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><i className="ti ti-truck-delivery" /> {topbar.site_free_shipping_text || "—"}</span>
            </div>

            <div>
              <label style={lbl}>شماره تلفن</label>
              <input
                style={inp}
                value={topbar.site_phone}
                onChange={e => setTopbar(p => ({ ...p, site_phone: e.target.value }))}
                placeholder="۰۲۱-۴۴۵۵۶۶۷۷"
              />
            </div>
            <div>
              <label style={lbl}>ساعات کاری</label>
              <input
                style={inp}
                value={topbar.site_hours}
                onChange={e => setTopbar(p => ({ ...p, site_hours: e.target.value }))}
                placeholder="شنبه تا پنجشنبه ۸ تا ۱۷"
              />
            </div>
            <div>
              <label style={lbl}>متن ارسال (راست صفحه)</label>
              <input
                style={inp}
                value={topbar.site_free_shipping_text}
                onChange={e => setTopbar(p => ({ ...p, site_free_shipping_text: e.target.value }))}
                placeholder="ارسال رایگان بالای ۵ میلیون تومان"
              />
            </div>

            <button
              onClick={saveTopbar}
              disabled={savingTopbar}
              style={{ alignSelf: "flex-start", background: savingTopbar ? "#aaa" : "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: savingTopbar ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              {savingTopbar ? <><i className="ti ti-loader-2" /> در حال ذخیره...</> : <><i className="ti ti-device-floppy" /> ذخیره نوار بالا</>}
            </button>
          </div>
        </div>
      )}

      {/* ── STATUS TAB ── */}
      {tab === "status" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { key: "registrationClosed" as const, label: "بستن ثبت‌نام", desc: "کاربران جدید نمی‌توانند ثبت‌نام کنند", color: "#dc2626" },
            { key: "ordersClosed" as const, label: "بستن سفارش‌ها", desc: "کاربران نمی‌توانند سفارش جدید ثبت کنند", color: "#d97706" },
            { key: "emergencyBanner" as const, label: "پیام اضطراری در سایت", desc: "یک نوار اطلاع‌رسانی در بالای همه صفحات نمایش داده می‌شود", color: "#2563eb" },
          ].map(item => (
            <div key={item.key} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: status[item.key] ? 12 : 0 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 14, color: "var(--primary)" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{item.desc}</div>
                </div>
                <button
                  onClick={() => setStatus(s => ({ ...s, [item.key]: !s[item.key] }))}
                  style={{ background: status[item.key] ? item.color : "var(--bg)", color: status[item.key] ? "#fff" : "var(--text2)", border: "1.5px solid var(--border)", borderRadius: 20, padding: "6px 18px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  {status[item.key] ? "فعال — کلیک برای غیرفعال" : "غیرفعال — کلیک برای فعال"}
                </button>
              </div>
              {item.key === "ordersClosed" && status.ordersClosed && (
                <div><label style={lbl}>پیام نمایش داده‌شده به کاربر</label><input style={inp} value={status.ordersClosedMessage} onChange={e => setStatus(s => ({ ...s, ordersClosedMessage: e.target.value }))} placeholder="سفارش‌گیری موقتاً متوقف شده است..." /></div>
              )}
              {item.key === "emergencyBanner" && status.emergencyBanner && (
                <div><label style={lbl}>متن پیام</label><input style={inp} value={status.emergencyBannerMessage} onChange={e => setStatus(s => ({ ...s, emergencyBannerMessage: e.target.value }))} placeholder="پیام مهم برای کاربران..." /></div>
              )}
            </div>
          ))}
          <button onClick={saveStatus} disabled={savingStatus} style={{ alignSelf: "flex-start", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 900, cursor: "pointer", opacity: savingStatus ? .7 : 1 }}>
            {savingStatus ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </button>
        </div>
      )}
    </div>
  );
}
