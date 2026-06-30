"use client";

import { useState, useEffect, useCallback } from "react";
import DatePicker from "@/components/ui/DatePicker";
import {
  AdminPageHeader, AdminCard, AdminCardHeader, AdminTabs,
  AdminBtn, AdminField, AdminInput, AdminTextarea,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";
import ImageUploader from "@/components/admin/ImageUploader";

type CmsTab = "pages" | "banners" | "slider" | "menus" | "status" | "topbar";

interface Page { id: string; slug: string; title: string; content: string; metaTitle: string | null; metaDesc: string | null; isActive: boolean; }
interface Banner { id: string; title: string; subtitle: string | null; imageUrl: string | null; buttonText: string | null; buttonLink: string | null; type: string; targetPage: string | null; sortOrder: number; isActive: boolean; startDate: string | null; endDate: string | null; }
interface MenuItem { id: string; menu: string; label: string; url: string; newTab: boolean; sortOrder: number; isActive: boolean; }
interface SiteStatus { registrationClosed: boolean; ordersClosed: boolean; ordersClosedMessage: string; emergencyBanner: boolean; emergencyBannerMessage: string; }
interface Slide { id: string; title: string | null; subtitle: string | null; imageUrl: string | null; buttonText: string | null; buttonLink: string | null; isActive: boolean; isDefault: boolean; startDate: string | null; endDate: string | null; sortOrder: number; }
interface SliderSettings { autoPlay: boolean; interval: number; showArrows: boolean; showDots: boolean; }

const EMPTY_SLIDE = { imageUrl: "", buttonLink: "", isActive: true, startDate: "", endDate: "" };

const CMS_TABS = [
  { id: "pages", label: "صفحات", icon: "ti-file-text" },
  { id: "banners", label: "بنرها", icon: "ti-photo" },
  { id: "slider", label: "اسلایدر", icon: "ti-slideshow" },
  { id: "menus", label: "منوها", icon: "ti-layout-navbar" },
  { id: "status", label: "وضعیت سایت", icon: "ti-alert-circle" },
  { id: "topbar", label: "نوار بالا", icon: "ti-layout-navbar-expand" },
];

export default function CmsManager() {
  const { toast, showToast } = useAdminToast();
  const [tab, setTab] = useState<CmsTab>("pages");

  // Pages
  const [pages, setPages] = useState<Page[]>([]);
  const [editPage, setEditPage] = useState<Page | null>(null);
  const [savingPage, setSavingPage] = useState(false);
  const [pagePreview, setPagePreview] = useState(false);

  // Banners
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerType, setBannerType] = useState<string>("hero");
  const [editBanner, setEditBanner] = useState<Partial<Banner> | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);

  // Menus
  const [menuType, setMenuType] = useState<"header" | "footer">("header");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editItem, setEditItem] = useState<Partial<MenuItem> | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // Status
  const [status, setStatus] = useState<SiteStatus>({ registrationClosed: false, ordersClosed: false, ordersClosedMessage: "", emergencyBanner: false, emergencyBannerMessage: "" });
  const [savingStatus, setSavingStatus] = useState(false);

  // Topbar
  const [topbar, setTopbar] = useState({ site_phone: "", site_hours: "", site_free_shipping_text: "" });
  const [savingTopbar, setSavingTopbar] = useState(false);

  // Slider
  const [slides, setSlides] = useState<Slide[]>([]);
  const [sliderSettings, setSliderSettings] = useState<SliderSettings>({ autoPlay: true, interval: 5000, showArrows: true, showDots: true });
  const [sliderLoading, setSliderLoading] = useState(false);
  const [savingSliderSettings, setSavingSliderSettings] = useState(false);
  const [showSlideForm, setShowSlideForm] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideForm, setSlideForm] = useState(EMPTY_SLIDE);
  const [savingSlide, setSavingSlide] = useState(false);
  const [deletingSlideId, setDeletingSlideId] = useState<string | null>(null);

  const loadSlider = useCallback(async () => {
    setSliderLoading(true);
    try {
      const [sr, st] = await Promise.all([fetch("/api/admin/slider").then(r => r.text()), fetch("/api/admin/slider/settings").then(r => r.text())]);
      try { const d = JSON.parse(sr); if (d.slides) setSlides(d.slides); } catch { }
      try { const d = JSON.parse(st); if (typeof d.autoPlay === "boolean") setSliderSettings(d); } catch { }
    } finally { setSliderLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "pages") fetch("/api/admin/cms/pages").then(r => r.json()).then(d => setPages(d.pages ?? []));
    if (tab === "banners") fetch(`/api/admin/cms/banners?type=${bannerType}`).then(r => r.json()).then(d => setBanners(d.banners ?? []));
    if (tab === "menus") fetch(`/api/admin/cms/menus?menu=${menuType}`).then(r => r.json()).then(d => setMenuItems(d.items ?? []));
    if (tab === "status") fetch("/api/admin/cms/status").then(r => r.json()).then(d => setStatus(d));
    if (tab === "topbar") (async () => {
      const [cr, gr] = await Promise.all([
        fetch("/api/admin/settings?group=contact").then(r => r.json()),
        fetch("/api/admin/settings?group=general").then(r => r.json()),
      ]);
      const cm = cr.map ?? {};
      const gm = gr.map ?? {};
      setTopbar({ site_phone: cm.site_phone || gm.site_phone || "", site_hours: cm.site_hours || "", site_free_shipping_text: cm.site_free_shipping_text || "" });
    })();
    if (tab === "slider") loadSlider();
  }, [tab, bannerType, menuType, loadSlider]);

  async function savePage() {
    if (!editPage) return;
    setSavingPage(true);
    try {
      const res = await fetch("/api/admin/cms/pages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editPage) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "خطا در ذخیره صفحه");
      setPages(prev => prev.some(p => p.slug === d.page.slug) ? prev.map(p => p.slug === d.page.slug ? d.page : p) : [...prev, d.page]);
      setEditPage(null); showToast("success", "صفحه ذخیره شد");
    } catch (e) { showToast("error", String(e)); } finally { setSavingPage(false); }
  }

  async function saveBanner() {
    if (!editBanner?.title) return;
    setSavingBanner(true);
    try {
      const method = editBanner.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/cms/banners", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editBanner, type: bannerType }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "خطا در ذخیره بنر");
      if (method === "POST") setBanners(prev => [...prev, d.banner]);
      else setBanners(prev => prev.map(b => b.id === d.banner.id ? d.banner : b));
      setEditBanner(null); showToast("success", "بنر ذخیره شد");
    } catch (e) { showToast("error", String(e)); } finally { setSavingBanner(false); }
  }

  async function deleteBanner(id: string) {
    if (!window.confirm("بنر حذف شود؟")) return;
    const res = await fetch(`/api/admin/cms/banners?id=${id}`, { method: "DELETE" });
    if (res.ok) { setBanners(prev => prev.filter(b => b.id !== id)); showToast("success", "حذف شد"); }
    else showToast("error", "خطا در حذف");
  }

  async function toggleBanner(b: Banner) {
    const res = await fetch("/api/admin/cms/banners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, isActive: !b.isActive }) });
    if (res.ok) setBanners(prev => prev.map(x => x.id === b.id ? { ...x, isActive: !b.isActive } : x));
  }

  async function saveMenuItem() {
    if (!editItem?.label || !editItem.url) return;
    setSavingItem(true);
    try {
      const method = editItem.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/cms/menus", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editItem, menu: menuType }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "خطا در ذخیره آیتم منو");
      if (method === "POST") setMenuItems(prev => [...prev, d.item].sort((a, b) => a.sortOrder - b.sortOrder));
      else setMenuItems(prev => prev.map(x => x.id === d.item.id ? d.item : x));
      setEditItem(null); showToast("success", "آیتم منو ذخیره شد");
    } catch (e) { showToast("error", String(e)); } finally { setSavingItem(false); }
  }

  async function deleteMenuItem(id: string) {
    if (!window.confirm("آیتم منو حذف شود؟")) return;
    const res = await fetch(`/api/admin/cms/menus?id=${id}`, { method: "DELETE" });
    if (res.ok) { setMenuItems(prev => prev.filter(x => x.id !== id)); showToast("success", "حذف شد"); }
    else showToast("error", "خطا در حذف");
  }

  async function saveStatus() {
    setSavingStatus(true);
    try {
      const res = await fetch("/api/admin/cms/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registration_closed: status.registrationClosed, orders_closed: status.ordersClosed, orders_closed_message: status.ordersClosedMessage, emergency_banner: status.emergencyBanner, emergency_banner_message: status.emergencyBannerMessage }) });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("success", "وضعیت ذخیره شد");
    } catch (e) { showToast("error", String(e)); } finally { setSavingStatus(false); }
  }

  async function saveTopbar() {
    setSavingTopbar(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: topbar, group: "contact" }) }),
        fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: { site_phone: topbar.site_phone }, group: "general" }) }),
      ]);
      if (!r1.ok) throw new Error((await r1.json()).error);
      if (!r2.ok) throw new Error((await r2.json()).error);
      showToast("success", "نوار بالا ذخیره شد");
    } catch (e) { showToast("error", String(e)); } finally { setSavingTopbar(false); }
  }

  async function saveSlide() {
    if (!slideForm.imageUrl.trim()) { showToast("error", "آدرس تصویر الزامی است"); return; }
    setSavingSlide(true);
    try {
      const payload = { title: "", imageUrl: slideForm.imageUrl || null, buttonLink: slideForm.buttonLink || null, isActive: slideForm.isActive, startDate: slideForm.startDate || null, endDate: slideForm.endDate || null };
      const res = editingSlideId
        ? await fetch(`/api/admin/slider/${editingSlideId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/admin/slider", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { showToast("error", "خطا در ذخیره"); return; }
      showToast("success", editingSlideId ? "اسلاید ویرایش شد" : "اسلاید اضافه شد");
      setShowSlideForm(false); setEditingSlideId(null); loadSlider();
    } catch { showToast("error", "خطای شبکه"); } finally { setSavingSlide(false); }
  }

  async function deleteSlide(id: string) {
    if (!confirm("حذف این اسلاید؟")) return;
    setDeletingSlideId(id);
    try {
      const res = await fetch(`/api/admin/slider/${id}`, { method: "DELETE" });
      if (res.ok) { setSlides(prev => prev.filter(s => s.id !== id)); showToast("success", "اسلاید حذف شد"); }
      else showToast("error", "خطا در حذف");
    } catch { showToast("error", "خطای شبکه"); } finally { setDeletingSlideId(null); }
  }

  async function toggleSlide(slide: Slide) {
    try {
      await fetch(`/api/admin/slider/${slide.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !slide.isActive }) });
      setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, isActive: !s.isActive } : s));
    } catch { }
  }

  async function moveSlide(index: number, dir: 1 | -1) {
    const ns = [...slides];
    const sw = index + dir;
    [ns[index], ns[sw]] = [ns[sw], ns[index]];
    const reordered = ns.map((s, i) => ({ ...s, sortOrder: i + 1 }));
    setSlides(reordered);
    await fetch("/api/admin/slider", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: reordered.map(({ id, sortOrder }) => ({ id, sortOrder })) }) });
  }

  async function saveSliderSettings() {
    setSavingSliderSettings(true);
    try {
      const res = await fetch("/api/admin/slider/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sliderSettings) });
      if (!res.ok) { showToast("error", "خطا"); return; }
      showToast("success", "تنظیمات اسلایدر ذخیره شد");
    } catch { showToast("error", "خطای شبکه"); } finally { setSavingSliderSettings(false); }
  }

  const inp: React.CSSProperties = { border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 5 };
  const tog = (on: boolean): React.CSSProperties => ({ width: 44, height: 24, borderRadius: 12, background: on ? "var(--accent)" : "var(--border)", position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 });
  const knob = (on: boolean): React.CSSProperties => ({ position: "absolute", top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" });
  const previewHeader = (label: string) => (
    <div style={{ fontSize: 11, color: "var(--text3)", padding: "6px 14px", display: "flex", alignItems: "center", gap: 5, borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
      <i className="ti ti-eye" style={{ fontSize: 12 }} /> {label}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <AdminToast toast={toast} />

      <AdminPageHeader title="مدیریت محتوا" icon="ti-layout-2" subtitle="صفحات، بنرها، اسلایدر، منوها و وضعیت سایت" />

      <AdminTabs tabs={CMS_TABS} active={tab} onChange={(t) => setTab(t as CmsTab)} />

      {/* ── PAGES ── */}
      {tab === "pages" && (
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {pages.map(p => (
              <button key={p.slug} onClick={() => { setEditPage({ ...p }); setPagePreview(false); }} style={{ background: editPage?.slug === p.slug ? "var(--primary)" : "#fff", color: editPage?.slug === p.slug ? "#fff" : "var(--text)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "right" }}>{p.title}</button>
            ))}
            <button onClick={() => { setEditPage({ id: "", slug: "", title: "", content: "", metaTitle: null, metaDesc: null, isActive: true }); setPagePreview(false); }} style={{ background: "var(--bg)", border: "1.5px dashed var(--border)", borderRadius: 8, padding: "10px 14px", fontFamily: "Vazirmatn", fontSize: 12, cursor: "pointer", color: "var(--text3)" }}>+ صفحه جدید</button>
          </div>

          {editPage ? (
            <div style={{ flex: 1, background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                <span style={{ flex: 1, fontWeight: 900, fontSize: 14, color: "var(--primary)" }}>{editPage.title || "صفحه جدید"}</span>
                {(["ویرایش", "پیش‌نمایش"] as const).map((lbl2, idx) => (
                  <button key={lbl2} onClick={() => setPagePreview(idx === 1)} style={{ background: pagePreview === (idx === 1) ? "var(--primary)" : "var(--bg)", color: pagePreview === (idx === 1) ? "#fff" : "var(--text2)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 12px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <i className={`ti ${idx === 0 ? "ti-code" : "ti-eye"}`} style={{ fontSize: 13 }} />{lbl2}
                  </button>
                ))}
              </div>
              {pagePreview ? (
                <div style={{ padding: "1.5rem" }}>
                  <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "1.5rem" }}>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                      <i className="ti ti-world" style={{ fontSize: 12 }} /> /{editPage.slug}
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 12 }}>{editPage.title || "بدون عنوان"}</h1>
                    <div style={{ fontSize: 14, lineHeight: 2, color: "var(--text2)" }} dangerouslySetInnerHTML={{ __html: editPage.content || "<p style='color:var(--text3)'>محتوایی وارد نشده است</p>" }} />
                  </div>
                </div>
              ) : (
                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div><label style={lbl}>عنوان صفحه</label><input style={inp} value={editPage.title} onChange={e => setEditPage(p => p ? { ...p, title: e.target.value } : p)} /></div>
                    <div><label style={lbl}>اسلاگ (URL)</label><input style={{ ...inp, direction: "ltr" }} value={editPage.slug} onChange={e => setEditPage(p => p ? { ...p, slug: e.target.value } : p)} placeholder="about, terms, privacy..." /></div>
                    <div><label style={lbl}>عنوان SEO</label><input style={inp} value={editPage.metaTitle ?? ""} onChange={e => setEditPage(p => p ? { ...p, metaTitle: e.target.value || null } : p)} /></div>
                    <div><label style={lbl}>توضیح SEO</label><input style={inp} value={editPage.metaDesc ?? ""} onChange={e => setEditPage(p => p ? { ...p, metaDesc: e.target.value || null } : p)} /></div>
                  </div>
                  <div><label style={lbl}>محتوا (HTML)</label><textarea style={{ ...inp, height: 280, resize: "vertical", fontFamily: "monospace", direction: "ltr" }} value={editPage.content} onChange={e => setEditPage(p => p ? { ...p, content: e.target.value } : p)} /></div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <AdminBtn variant="primary" icon="ti-device-floppy" loading={savingPage} onClick={savePage}>ذخیره</AdminBtn>
                    <AdminBtn onClick={() => setEditPage(null)}>انصراف</AdminBtn>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginRight: "auto", cursor: "pointer" }}>
                      <input type="checkbox" checked={editPage.isActive} onChange={e => setEditPage(p => p ? { ...p, isActive: e.target.checked } : p)} /> فعال
                    </label>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 13 }}>یک صفحه را انتخاب کنید یا صفحه جدید بسازید</div>
          )}
        </div>
      )}

      {/* ── BANNERS ── */}
      {tab === "banners" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {([
              ["hero",       "اسلایدر هدر"],
              ["hero_main",  "بنر میانی (تمام عرض)"],
              ["promo_3col", "بنر ۳ستونه"],
              ["promo_2col_a","بنر ۲ستونه (ردیف ۱)"],
              ["promo_2col_b","بنر ۲ستونه (ردیف ۲)"],
              ["promo_2col_c","بنر ۲ستونه (ردیف ۳)"],
              ["square",     "بنر مربعی"],
              ["promo",      "بنر تبلیغاتی (قدیمی)"],
            ] as [string, string][]).map(([t, l]) => (
              <button key={t} onClick={() => setBannerType(t)} style={{ background: bannerType === t ? "var(--primary)" : "var(--bg)", color: bannerType === t ? "#fff" : "var(--text2)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "7px 16px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{l}</button>
            ))}
            <AdminBtn variant="primary" icon="ti-plus" style={{ marginRight: "auto" }} onClick={() => setEditBanner({ title: "", sortOrder: banners.length, isActive: true, targetPage: null, startDate: null, endDate: null })}>بنر جدید</AdminBtn>
          </div>

          {(() => {
            const b = editBanner?.title ? editBanner : banners.find(x => x.isActive);
            if (!b) return null;
            return (
              <div style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
                {previewHeader(editBanner?.title ? "پیش‌نمایش بنر در حال ویرایش" : "پیش‌نمایش اولین بنر فعال")}
                <div style={{ minHeight: 160, padding: "2rem", background: b.imageUrl ? `url(${b.imageUrl}) center/cover no-repeat` : "linear-gradient(135deg, var(--primary) 0%, #1a5fa0 100%)", position: "relative", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)" }} />
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "0 0 6px", textShadow: "0 2px 8px rgba(0,0,0,.5)" }}>{b.title || "عنوان بنر"}</h3>
                    {b.subtitle && <p style={{ color: "rgba(255,255,255,.85)", fontSize: 14, margin: "0 0 14px", lineHeight: 1.6 }}>{b.subtitle}</p>}
                    {b.buttonText && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "#fff", padding: "8px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13 }}>{b.buttonText} <i className="ti ti-arrow-left" style={{ fontSize: 13 }} /></span>}
                  </div>
                </div>
              </div>
            );
          })()}

          {banners.length === 0 && !editBanner && <div style={{ textAlign: "center", padding: "2rem", color: "var(--text3)" }}>بنری وجود ندارد</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {banners.map((b, idx) => (
              <div key={b.id} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button disabled={idx === 0} onClick={async () => { const u = [...banners]; [u[idx-1],u[idx]]=[u[idx],u[idx-1]]; await fetch("/api/admin/cms/banners",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:u.map((x,i)=>({id:x.id,sortOrder:i}))})}); setBanners(u.map((x,i)=>({...x,sortOrder:i}))); }} style={{ background:"var(--bg)",border:"1px solid var(--border)",borderRadius:4,padding:"2px 5px",cursor:idx===0?"default":"pointer",opacity:idx===0?.3:1,fontSize:11 }}>▲</button>
                  <button disabled={idx===banners.length-1} onClick={async()=>{const u=[...banners];[u[idx],u[idx+1]]=[u[idx+1],u[idx]];await fetch("/api/admin/cms/banners",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:u.map((x,i)=>({id:x.id,sortOrder:i}))})});setBanners(u.map((x,i)=>({...x,sortOrder:i})));}} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:4,padding:"2px 5px",cursor:idx===banners.length-1?"default":"pointer",opacity:idx===banners.length-1?.3:1,fontSize:11}}>▼</button>
                </div>
                {b.imageUrl && <img src={b.imageUrl} alt="" style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 13 }}>{b.title}</div>
                  {b.subtitle && <div style={{ fontSize: 11, color: "var(--text3)" }}>{b.subtitle}</div>}
                  <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    {b.buttonLink && <span style={{ fontSize: 10, color: "var(--accent)", direction: "ltr" }}>{b.buttonLink}</span>}
                    {b.startDate && <span style={{ fontSize: 10, color: "var(--text3)" }}>از {b.startDate.slice(0,10)}</span>}
                    {b.endDate && <span style={{ fontSize: 10, color: "var(--text3)" }}>تا {b.endDate.slice(0,10)}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 11, background: b.isActive ? "#dcfce7" : "#f1f5f9", color: b.isActive ? "#16a34a" : "#64748b", padding: "2px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap" }}>{b.isActive ? "فعال" : "غیرفعال"}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <AdminBtn size="sm" onClick={() => setEditBanner({ ...b })}>ویرایش</AdminBtn>
                  <AdminBtn size="sm" variant={b.isActive ? "secondary" : "ghost"} onClick={() => toggleBanner(b)}>{b.isActive ? "غیرفعال" : "فعال"}</AdminBtn>
                  <AdminBtn size="sm" variant="danger" icon="ti-trash" onClick={() => deleteBanner(b.id)} />
                </div>
              </div>
            ))}
          </div>

          {editBanner && (
            <AdminCard>
              <AdminCardHeader title={editBanner.id ? "ویرایش بنر" : "بنر جدید"} icon="ti-photo" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                <div><label style={lbl}>عنوان <span style={{ color: "red" }}>*</span></label><input style={inp} value={editBanner.title ?? ""} onChange={e => setEditBanner(p => ({ ...p, title: e.target.value }))} /></div>
                <div><label style={lbl}>زیرعنوان</label><input style={inp} value={editBanner.subtitle ?? ""} onChange={e => setEditBanner(p => ({ ...p, subtitle: e.target.value }))} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>تصویر بنر</label><ImageUploader value={editBanner.imageUrl ?? ""} onChange={v => setEditBanner(p => ({ ...p, imageUrl: v || null }))} folder="banners" previewHeight={80} /></div>
                <div><label style={lbl}>صفحه هدف</label>
                  <select style={inp} value={editBanner.targetPage ?? ""} onChange={e => setEditBanner(p => ({ ...p, targetPage: e.target.value || null }))}>
                    <option value="">همه صفحات</option><option value="home">صفحه اصلی</option><option value="all">همه</option>
                  </select>
                </div>
                <div><label style={lbl}>متن دکمه</label><input style={inp} value={editBanner.buttonText ?? ""} onChange={e => setEditBanner(p => ({ ...p, buttonText: e.target.value }))} /></div>
                <div><label style={lbl}>لینک دکمه</label><input style={{ ...inp, direction: "ltr" }} value={editBanner.buttonLink ?? ""} onChange={e => setEditBanner(p => ({ ...p, buttonLink: e.target.value }))} /></div>
                <div>
                  <label style={lbl}>تاریخ شروع</label>
                  <DatePicker value={editBanner.startDate?.slice(0,10) ?? ""} onChange={v => setEditBanner(p => ({ ...p, startDate: v || null }))} />
                </div>
                <div>
                  <label style={lbl}>تاریخ پایان</label>
                  <DatePicker value={editBanner.endDate?.slice(0,10) ?? ""} onChange={v => setEditBanner(p => ({ ...p, endDate: v || null }))} />
                </div>
                <div><label style={lbl}>ترتیب</label><input type="number" style={inp} value={editBanner.sortOrder ?? 0} onChange={e => setEditBanner(p => ({ ...p, sortOrder: parseInt(e.target.value) }))} /></div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <AdminBtn variant="primary" icon="ti-device-floppy" loading={savingBanner} onClick={saveBanner}>ذخیره</AdminBtn>
                <AdminBtn onClick={() => setEditBanner(null)}>انصراف</AdminBtn>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginRight: "auto", cursor: "pointer" }}>
                  <input type="checkbox" checked={editBanner.isActive ?? true} onChange={e => setEditBanner(p => ({ ...p, isActive: e.target.checked }))} /> فعال
                </label>
              </div>
            </AdminCard>
          )}
        </div>
      )}

      {/* ── SLIDER ── */}
      {tab === "slider" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sliderLoading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>در حال بارگذاری...</div>
          ) : (
            <>
              {slides.length > 0 && (
                <div style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
                  {previewHeader(`پیش‌نمایش اسلایدر — ${slides.filter(s => s.isActive).length} اسلاید فعال`)}
                  <div style={{ display: "flex", overflowX: "auto" }}>
                    {slides.filter(s => s.isActive).slice(0, 4).map((slide, idx) => (
                      <div key={slide.id} style={{ minWidth: 220, height: 130, flexShrink: 0, position: "relative", overflow: "hidden", background: slide.imageUrl ? `url(${slide.imageUrl}) center/cover no-repeat` : `linear-gradient(135deg,hsl(${idx*50+210},65%,30%),hsl(${idx*50+230},65%,20%))`, borderRight: "2px solid #fff" }}>
                        {!slide.imageUrl && (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="ti ti-photo" style={{ fontSize: 28, color: "rgba(255,255,255,0.25)" }} />
                          </div>
                        )}
                        <div style={{ position: "absolute", bottom: 28, right: 0, left: 0, textAlign: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.4)", padding: "2px 8px", borderRadius: 4 }}>اسلاید {idx + 1}</span>
                        </div>
                        <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 3 }}>
                          {slides.filter(s => s.isActive).slice(0,4).map((_,di) => <div key={di} style={{ width: di===idx?14:5, height: 5, borderRadius: 3, background: di===idx?"#fff":"rgba(255,255,255,.4)", transition:"width .2s" }} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <AdminCard>
                <AdminCardHeader title="تنظیمات اسلایدر" icon="ti-settings" />
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
                  {([["autoPlay", "پخش خودکار"], ["showArrows", "نمایش فلش‌ها"], ["showDots", "نمایش نقطه‌ها"]] as const).map(([key, label]) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <div onClick={() => setSliderSettings(s => ({ ...s, [key]: !s[key] }))} style={tog(sliderSettings[key])}><div style={knob(sliderSettings[key])} /></div>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
                    </label>
                  ))}
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>فاصله:</span>
                    <select value={sliderSettings.interval} onChange={e => setSliderSettings(s => ({ ...s, interval: parseInt(e.target.value) }))} style={{ border: "1.5px solid var(--border)", borderRadius: 6, padding: "5px 10px", fontFamily: "Vazirmatn", fontSize: 13 }}>
                      {[3000,4000,5000,6000,8000,10000].map(v => <option key={v} value={v}>{v/1000} ثانیه</option>)}
                    </select>
                  </label>
                  <AdminBtn variant="primary" icon="ti-device-floppy" loading={savingSliderSettings} onClick={saveSliderSettings}>ذخیره تنظیمات</AdminBtn>
                </div>
              </AdminCard>

              <AdminCard>
                <AdminCardHeader
                  title={`اسلایدها (${slides.length})`}
                  icon="ti-slideshow"
                  actions={
                    <AdminBtn variant="primary" icon="ti-plus" onClick={() => { setEditingSlideId(null); setSlideForm(EMPTY_SLIDE); setShowSlideForm(true); }}>اسلاید جدید</AdminBtn>
                  }
                />
                <div style={{ marginTop: 12 }}>
                  {slides.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>
                      <i className="ti ti-slideshow" style={{ fontSize: 44, display: "block", marginBottom: 10 }} />
                      <p style={{ fontWeight: 700 }}>هنوز اسلایدی اضافه نشده است</p>
                    </div>
                  ) : slides.map((slide, index) => (
                    <div key={slide.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 1.5rem", borderBottom: index < slides.length-1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ width: 80, height: 50, borderRadius: 6, flexShrink: 0, background: slide.imageUrl ? `url(${slide.imageUrl}) center/cover no-repeat` : "linear-gradient(135deg,var(--primary),#1a5fa0)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {!slide.imageUrl && <i className="ti ti-photo" style={{ fontSize: 18, color: "rgba(255,255,255,.4)" }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>اسلاید {index + 1}</div>
                        <div style={{ fontSize: 11, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr" }}>{slide.buttonLink || "بدون لینک"}</div>
                      </div>
                      <div onClick={() => toggleSlide(slide)} style={tog(slide.isActive)} title={slide.isActive ? "فعال" : "غیرفعال"}><div style={knob(slide.isActive)} /></div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <button onClick={() => moveSlide(index,-1)} disabled={index===0} style={{ background:"var(--bg)",border:"1px solid var(--border)",borderRadius:4,padding:"3px 7px",cursor:index===0?"not-allowed":"pointer",opacity:index===0?.4:1 }}><i className="ti ti-arrow-up" style={{fontSize:11}} /></button>
                        <button onClick={() => moveSlide(index,1)} disabled={index===slides.length-1} style={{ background:"var(--bg)",border:"1px solid var(--border)",borderRadius:4,padding:"3px 7px",cursor:index===slides.length-1?"not-allowed":"pointer",opacity:index===slides.length-1?.4:1 }}><i className="ti ti-arrow-down" style={{fontSize:11}} /></button>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {slide.isDefault && <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, padding: "4px 8px" }}>پیش‌فرض</span>}
                        <AdminBtn size="sm" icon="ti-edit" onClick={() => { setEditingSlideId(slide.id); setSlideForm({ imageUrl: slide.imageUrl??"", buttonLink: slide.buttonLink??"", isActive: slide.isActive, startDate: slide.startDate?.slice(0,10)??"", endDate: slide.endDate?.slice(0,10)??"" }); setShowSlideForm(true); }}>ویرایش</AdminBtn>
                        {slide.isDefault ? (
                          <AdminBtn size="sm" icon="ti-lock" disabled />
                        ) : (
                          <AdminBtn size="sm" icon="ti-trash" variant="danger" loading={deletingSlideId===slide.id} onClick={() => deleteSlide(slide.id)} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AdminCard>

              {showSlideForm && (
                <AdminCard>
                  <AdminCardHeader
                    title={editingSlideId ? "ویرایش اسلاید" : "اسلاید جدید"}
                    icon="ti-slideshow"
                    actions={
                      <button onClick={() => { setShowSlideForm(false); setEditingSlideId(null); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text3)" }}><i className="ti ti-x" /></button>
                    }
                  />
                  <div style={{ padding: "1rem 0", display: "flex", gap: 20 }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                      <AdminField label="تصویر اسلاید" required>
                        <ImageUploader value={slideForm.imageUrl} onChange={v => setSlideForm(f => ({ ...f, imageUrl: v }))} folder="slider" previewHeight={90} />
                      </AdminField>
                      <AdminField label="لینک اسلاید (کلیک روی تصویر)">
                        <input value={slideForm.buttonLink} onChange={e => setSlideForm(f => ({ ...f, buttonLink: e.target.value }))} placeholder="/category/... یا https://..." style={{ ...inp, direction: "ltr" }} />
                      </AdminField>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <AdminField label="تاریخ شروع">
                          <DatePicker value={slideForm.startDate} onChange={v => setSlideForm(f => ({ ...f, startDate: v }))} />
                        </AdminField>
                        <AdminField label="تاریخ پایان">
                          <DatePicker value={slideForm.endDate} onChange={v => setSlideForm(f => ({ ...f, endDate: v }))} />
                        </AdminField>
                      </div>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                        <div onClick={() => setSlideForm(f => ({ ...f, isActive: !f.isActive }))} style={tog(slideForm.isActive)}><div style={knob(slideForm.isActive)} /></div>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{slideForm.isActive ? "فعال" : "غیرفعال"}</span>
                      </label>
                      <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                        <AdminBtn variant="primary" icon="ti-device-floppy" loading={savingSlide} onClick={saveSlide}>
                          {editingSlideId ? "ذخیره تغییرات" : "افزودن"}
                        </AdminBtn>
                        <AdminBtn onClick={() => { setShowSlideForm(false); setEditingSlideId(null); }}>انصراف</AdminBtn>
                      </div>
                    </div>
                    <div style={{ width: 240, flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}><i className="ti ti-eye" style={{ fontSize: 12 }} /> پیش‌نمایش</div>
                      <div style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)", height: 170, position: "relative", background: slideForm.imageUrl ? `url(${slideForm.imageUrl}) center/cover no-repeat` : "linear-gradient(135deg,var(--primary) 0%,#1a5fa0 100%)" }}>
                        {!slideForm.imageUrl && (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                            <i className="ti ti-photo" style={{ fontSize: 32, color: "rgba(255,255,255,0.3)" }} />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>آدرس تصویر وارد کنید</span>
                          </div>
                        )}
                        {slideForm.buttonLink && (
                          <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, padding: "4px 10px", borderRadius: 6, backdropFilter: "blur(4px)", direction: "ltr", fontFamily: "monospace", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {slideForm.buttonLink}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </AdminCard>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MENUS ── */}
      {tab === "menus" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {(["header","footer"] as const).map(m => (
              <button key={m} onClick={() => setMenuType(m)} style={{ background: menuType===m?"var(--primary)":"var(--bg)", color: menuType===m?"#fff":"var(--text2)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "7px 16px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {m === "header" ? "منوی هدر" : "منوی فوتر"}
              </button>
            ))}
            <AdminBtn variant="primary" icon="ti-plus" style={{ marginRight: "auto" }} onClick={() => setEditItem({ label: "", url: "", newTab: false, sortOrder: menuItems.length, isActive: true })}>آیتم جدید</AdminBtn>
          </div>

          <div style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
            {previewHeader(`پیش‌نمایش ${menuType === "header" ? "هدر" : "فوتر"}`)}
            <div style={{ background: menuType === "header" ? "#0a2a5e" : "#1a1a2e", padding: "12px 20px", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              {menuType === "header" && <span style={{ color: "var(--accent)", fontWeight: 900, fontSize: 14, marginLeft: 16 }}>مرجان</span>}
              {menuItems.filter(i => i.isActive).length === 0
                ? <span style={{ color: "rgba(255,255,255,.4)", fontSize: 12 }}>هنوز آیتمی وجود ندارد</span>
                : menuItems.filter(i => i.isActive).map(item => (
                    <span key={item.id} style={{ color: "rgba(255,255,255,.85)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      {item.label}{item.newTab && <i className="ti ti-external-link" style={{ fontSize: 10, opacity: 0.5 }} />}
                    </span>
                  ))
              }
            </div>
          </div>

          <AdminCard>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>{["ترتیب","عنوان","لینک","تب جدید","وضعیت","عملیات"].map(h => <th key={h} style={{ background:"var(--bg)",padding:"9px 12px",fontSize:11,fontWeight:900,color:"var(--text2)",textAlign:"right",borderBottom:"2px solid var(--border)" }}>{h}</th>)}</tr></thead>
              <tbody>
                {menuItems.map((item,i) => (
                  <tr key={item.id} style={{ borderBottom: i<menuItems.length-1?"1px solid var(--border)":"none" }}>
                    <td style={{padding:"9px 12px"}}>{item.sortOrder}</td>
                    <td style={{padding:"9px 12px",fontWeight:700}}>{item.label}</td>
                    <td style={{padding:"9px 12px",direction:"ltr",color:"var(--accent)"}}>{item.url}</td>
                    <td style={{padding:"9px 12px"}}>{item.newTab?"✓":"—"}</td>
                    <td style={{padding:"9px 12px"}}><span style={{background:item.isActive?"#dcfce7":"#f1f5f9",color:item.isActive?"#16a34a":"#64748b",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700}}>{item.isActive?"فعال":"غیرفعال"}</span></td>
                    <td style={{padding:"9px 12px"}}><div style={{display:"flex",gap:5}}>
                      <AdminBtn size="sm" onClick={() => setEditItem({...item})}>ویرایش</AdminBtn>
                      <AdminBtn size="sm" variant="danger" icon="ti-trash" onClick={() => deleteMenuItem(item.id)} />
                    </div></td>
                  </tr>
                ))}
                {menuItems.length === 0 && <tr><td colSpan={6} style={{textAlign:"center",padding:"2rem",color:"var(--text3)"}}>آیتمی وجود ندارد</td></tr>}
              </tbody>
            </table>
          </AdminCard>

          {editItem && (
            <AdminCard>
              <AdminCardHeader title={editItem.id ? "ویرایش آیتم" : "آیتم جدید"} icon="ti-layout-navbar" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 12, marginTop: 14 }}>
                <div><label style={lbl}>عنوان</label><input style={inp} value={editItem.label??""} onChange={e=>setEditItem(p=>({...p,label:e.target.value}))} /></div>
                <div><label style={lbl}>لینک</label><input style={{...inp,direction:"ltr"}} value={editItem.url??""} onChange={e=>setEditItem(p=>({...p,url:e.target.value}))} placeholder="/products" /></div>
                <div><label style={lbl}>ترتیب</label><input type="number" style={inp} value={editItem.sortOrder??0} onChange={e=>setEditItem(p=>({...p,sortOrder:parseInt(e.target.value)}))} /></div>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}><input type="checkbox" checked={editItem.newTab??false} onChange={e=>setEditItem(p=>({...p,newTab:e.target.checked}))} /> باز در تب جدید</label>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}><input type="checkbox" checked={editItem.isActive??true} onChange={e=>setEditItem(p=>({...p,isActive:e.target.checked}))} /> فعال</label>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <AdminBtn variant="primary" icon="ti-device-floppy" loading={savingItem} onClick={saveMenuItem}>ذخیره</AdminBtn>
                <AdminBtn onClick={()=>setEditItem(null)}>انصراف</AdminBtn>
              </div>
            </AdminCard>
          )}
        </div>
      )}

      {/* ── TOPBAR ── */}
      {tab === "topbar" && (
        <AdminCard>
          <AdminCardHeader title="محتوای نوار بالای سایت" icon="ti-layout-navbar" />
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "8px 0 14px" }}>این متن‌ها در نوار آبی تیره بالای هر صفحه نمایش داده می‌شوند.</p>
          <div style={{ background: "#071d42", color: "#b8c8e8", fontSize: 12, padding: "7px 16px", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><i className="ti ti-phone" /> {topbar.site_phone || "—"}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><i className="ti ti-clock" /> {topbar.site_hours || "—"}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><i className="ti ti-truck-delivery" /> {topbar.site_free_shipping_text || "—"}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <AdminField label="شماره تلفن">
              <AdminInput value={topbar.site_phone} onChange={v => setTopbar(p => ({ ...p, site_phone: v }))} placeholder="۰۲۱-۴۴۵۵۶۶۷۷" />
            </AdminField>
            <AdminField label="ساعات کاری">
              <AdminInput value={topbar.site_hours} onChange={v => setTopbar(p => ({ ...p, site_hours: v }))} placeholder="شنبه تا پنجشنبه ۸ تا ۱۷" />
            </AdminField>
            <AdminField label="متن ارسال">
              <AdminInput value={topbar.site_free_shipping_text} onChange={v => setTopbar(p => ({ ...p, site_free_shipping_text: v }))} placeholder="ارسال رایگان بالای ۵ میلیون تومان" />
            </AdminField>
            <AdminBtn variant="primary" icon="ti-device-floppy" loading={savingTopbar} style={{ alignSelf: "flex-start" }} onClick={saveTopbar}>ذخیره نوار بالا</AdminBtn>
          </div>
        </AdminCard>
      )}

      {/* ── STATUS ── */}
      {tab === "status" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(status.emergencyBanner || status.ordersClosed || status.registrationClosed) && (
            <div style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
              {previewHeader("پیش‌نمایش — پیام‌هایی که کاربران می‌بینند")}
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {status.emergencyBanner && (
                  <div style={{ background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <i className="ti ti-alert-circle" style={{ color: "#2563eb", fontSize: 18, flexShrink: 0 }} />
                    <span style={{ color: "#1e40af", fontWeight: 700 }}>{status.emergencyBannerMessage || "پیام اضطراری در حال نمایش است"}</span>
                  </div>
                )}
                {status.ordersClosed && (
                  <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <i className="ti ti-shopping-cart-off" style={{ color: "#d97706", fontSize: 18, flexShrink: 0 }} />
                    <span style={{ color: "#92400e", fontWeight: 700 }}>{status.ordersClosedMessage || "امکان ثبت سفارش فعلاً وجود ندارد"}</span>
                  </div>
                )}
                {status.registrationClosed && (
                  <div style={{ background: "#fdecea", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <i className="ti ti-user-off" style={{ color: "#dc2626", fontSize: 18, flexShrink: 0 }} />
                    <span style={{ color: "#991b1b", fontWeight: 700 }}>ثبت‌نام کاربران جدید متوقف شده است</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {[
            { key: "registrationClosed" as const, label: "بستن ثبت‌نام", desc: "کاربران جدید نمی‌توانند ثبت‌نام کنند", color: "#dc2626" },
            { key: "ordersClosed" as const, label: "بستن سفارش‌ها", desc: "کاربران نمی‌توانند سفارش جدید ثبت کنند", color: "#d97706" },
            { key: "emergencyBanner" as const, label: "پیام اضطراری", desc: "یک نوار اطلاع‌رسانی در بالای همه صفحات نمایش داده می‌شود", color: "#2563eb" },
          ].map(item => (
            <AdminCard key={item.key}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: status[item.key] ? 12 : 0 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 14, color: "var(--primary)" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{item.desc}</div>
                </div>
                <button onClick={() => setStatus(s => ({ ...s, [item.key]: !s[item.key] }))} style={{ background: status[item.key] ? item.color : "var(--bg)", color: status[item.key] ? "#fff" : "var(--text2)", border: "1.5px solid var(--border)", borderRadius: 20, padding: "6px 18px", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {status[item.key] ? "فعال — کلیک برای غیرفعال" : "غیرفعال — کلیک برای فعال"}
                </button>
              </div>
              {item.key === "ordersClosed" && status.ordersClosed && (
                <AdminField label="پیام به کاربر">
                  <AdminInput value={status.ordersClosedMessage} onChange={v => setStatus(s => ({ ...s, ordersClosedMessage: v }))} placeholder="سفارش‌گیری موقتاً متوقف شده است..." />
                </AdminField>
              )}
              {item.key === "emergencyBanner" && status.emergencyBanner && (
                <AdminField label="متن پیام">
                  <AdminInput value={status.emergencyBannerMessage} onChange={v => setStatus(s => ({ ...s, emergencyBannerMessage: v }))} placeholder="پیام مهم برای کاربران..." />
                </AdminField>
              )}
            </AdminCard>
          ))}
          <AdminBtn variant="primary" icon="ti-device-floppy" loading={savingStatus} style={{ alignSelf: "flex-start" }} onClick={saveStatus}>ذخیره تنظیمات</AdminBtn>
        </div>
      )}
    </div>
  );
}
