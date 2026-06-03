"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface BlogCategory { id: string; name: string; slug: string; _count: { posts: number }; }
interface BlogPost {
  id: string; title: string; slug: string; excerpt: string | null;
  content: string; categoryId: string | null; imageUrl: string | null;
  isPublished: boolean; viewCount: number; tags: string[];
  metaTitle: string | null; metaDesc: string | null;
  createdAt: string; publishedAt: string | null;
  category: { id: string; name: string } | null;
}

const inp: React.CSSProperties = {
  border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
  padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13,
  color: "var(--text)", outline: "none", width: "100%", background: "#fff", boxSizing: "border-box",
};
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 };

interface PostForm {
  id?: string;
  title: string; slug: string; excerpt: string; content: string;
  categoryId: string; imageUrl: string; isPublished: boolean;
  tags: string; metaTitle: string; metaDesc: string;
}
const emptyPost: PostForm = {
  title: "", slug: "", excerpt: "", content: "", categoryId: "",
  imageUrl: "", isPublished: false, tags: "", metaTitle: "", metaDesc: "",
};

interface CatForm { id?: string; name: string; slug: string; }
const emptyCat: CatForm = { name: "", slug: "" };

export default function BlogManager() {
  const [tab, setTab] = useState<"posts" | "categories">("posts");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Post form state
  const [postFormOpen, setPostFormOpen] = useState(false);
  const [postForm, setPostForm] = useState<PostForm>(emptyPost);
  const [postSaving, setPostSaving] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Category form state
  const [catForm, setCatForm] = useState<CatForm>(emptyCat);
  const [catSaving, setCatSaving] = useState(false);
  const [catSlugTouched, setCatSlugTouched] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadCategories = useCallback(() => {
    fetch("/api/admin/blog/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => showToast("error", "خطا در بارگذاری دسته‌ها"));
  }, [showToast]);

  const loadPosts = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("q", search.trim());
    if (publishedFilter) qs.set("published", publishedFilter);
    if (catFilter) qs.set("categoryId", catFilter);
    fetch(`/api/admin/blog?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => showToast("error", "خطا در بارگذاری مقالات"))
      .finally(() => setLoading(false));
  }, [search, publishedFilter, catFilter, showToast]);

  useEffect(() => {
    loadCategories();
    loadPosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadPosts(); }, [publishedFilter, catFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Post form helpers
  const onTitleChange = (v: string) => {
    setPostForm((f) => {
      const next = { ...f, title: v };
      if (!slugTouched && !f.id) {
        next.slug = v.toLowerCase().trim().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]+/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
      }
      return next;
    });
  };

  const uploadImage = useCallback(async (file: File) => {
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "blog");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) setPostForm((f) => ({ ...f, imageUrl: data.url }));
      else showToast("error", data.error ?? "خطا در آپلود تصویر");
    } catch { showToast("error", "خطا در آپلود تصویر"); }
    finally { setImgUploading(false); }
  }, [showToast]);

  const openCreatePost = () => { setPostForm(emptyPost); setSlugTouched(false); setPostFormOpen(true); };
  const openEditPost = (p: BlogPost) => {
    setPostForm({
      id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt ?? "",
      content: p.content, categoryId: p.categoryId ?? "", imageUrl: p.imageUrl ?? "",
      isPublished: p.isPublished, tags: (p.tags ?? []).join(", "),
      metaTitle: p.metaTitle ?? "", metaDesc: p.metaDesc ?? "",
    });
    setSlugTouched(true);
    setPostFormOpen(true);
  };
  const closePostForm = () => { setPostFormOpen(false); setPostForm(emptyPost); };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postForm.title.trim().length < 2) { showToast("error", "عنوان مقاله الزامی است"); return; }
    if (!/^[a-z0-9-]{2,}$/.test(postForm.slug)) { showToast("error", "اسلاگ معتبر وارد کنید (حروف انگلیسی، اعداد، خط تیره)"); return; }
    if (!postForm.content.trim()) { showToast("error", "محتوای مقاله الزامی است"); return; }

    setPostSaving(true);
    try {
      const payload = {
        title: postForm.title.trim(),
        slug: postForm.slug.trim(),
        excerpt: postForm.excerpt.trim() || null,
        content: postForm.content.trim(),
        categoryId: postForm.categoryId || null,
        imageUrl: postForm.imageUrl || null,
        isPublished: postForm.isPublished,
        tags: postForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        metaTitle: postForm.metaTitle.trim() || null,
        metaDesc: postForm.metaDesc.trim() || null,
      };

      const res = await fetch(
        postForm.id ? `/api/admin/blog/${postForm.id}` : "/api/admin/blog",
        { method: postForm.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در ذخیره"); return; }

      showToast("success", postForm.id ? "مقاله ویرایش شد" : "مقاله ایجاد شد");
      closePostForm();
      loadPosts();
    } catch { showToast("error", "خطای سرور"); }
    finally { setPostSaving(false); }
  };

  const handleDeletePost = async (p: BlogPost) => {
    if (!window.confirm(`آیا از حذف «${p.title}» مطمئن هستید؟`)) return;
    setDeletingPostId(p.id);
    try {
      const res = await fetch(`/api/admin/blog/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در حذف"); return; }
      showToast("success", `«${p.title}» حذف شد`);
      setPosts((prev) => prev.filter((x) => x.id !== p.id));
    } catch { showToast("error", "خطای سرور"); }
    finally { setDeletingPostId(null); }
  };

  // Category helpers
  const onCatNameChange = (v: string) => {
    setCatForm((f) => {
      const next = { ...f, name: v };
      if (!catSlugTouched) next.slug = v.toLowerCase().trim().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]+/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
      return next;
    });
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (catForm.name.trim().length < 2) { showToast("error", "نام دسته الزامی است"); return; }
    if (!/^[a-z0-9-]{2,}$/.test(catForm.slug)) { showToast("error", "اسلاگ معتبر وارد کنید"); return; }

    setCatSaving(true);
    try {
      const res = await fetch("/api/admin/blog/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catForm.name.trim(), slug: catForm.slug.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در ایجاد دسته"); return; }
      showToast("success", "دسته ایجاد شد");
      setCatForm(emptyCat);
      setCatSlugTouched(false);
      loadCategories();
    } catch { showToast("error", "خطای سرور"); }
    finally { setCatSaving(false); }
  };

  const handleDeleteCat = async (c: BlogCategory) => {
    if (c._count.posts > 0) { showToast("error", `این دسته دارای ${c._count.posts} مقاله است`); return; }
    if (!window.confirm(`آیا از حذف «${c.name}» مطمئن هستید؟`)) return;
    setDeletingCatId(c.id);
    try {
      const res = await fetch("/api/admin/blog/categories", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در حذف"); return; }
      showToast("success", `«${c.name}» حذف شد`);
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
    } catch { showToast("error", "خطای سرور"); }
    finally { setDeletingCatId(null); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fa-IR");

  return (
    <div style={{ position: "relative" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? "#1a7a4a" : "#c0392b", color: "#fff", padding: "12px 28px", borderRadius: 10, fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, zIndex: 10000, boxShadow: "0 6px 24px rgba(0,0,0,.25)", display: "flex", alignItems: "center", gap: 10, maxWidth: "90vw" }}>
          <i className={`ti ${toast.type === "success" ? "ti-circle-check" : "ti-circle-x"}`} style={{ fontSize: 18, flexShrink: 0 }} />
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: "1.25rem", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden", width: "fit-content" }}>
        {(["posts", "categories"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "var(--primary)" : "transparent", color: tab === t ? "#fff" : "var(--text2)", border: "none", padding: "10px 24px", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", transition: "all .15s" }}>
            {t === "posts" ? <><i className="ti ti-article" /> مقالات</> : <><i className="ti ti-category" /> دسته‌ها</>}
          </button>
        ))}
      </div>

      {/* ── POSTS TAB ── */}
      {tab === "posts" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadPosts()} placeholder="جستجو عنوان مقاله..." style={{ ...inp, maxWidth: 260, flex: "1 1 180px" }} />
            <select value={publishedFilter} onChange={(e) => setPublishedFilter(e.target.value)} style={{ ...inp, width: "auto", cursor: "pointer" }}>
              <option value="">همه وضعیت‌ها</option>
              <option value="true">منتشر شده</option>
              <option value="false">پیش‌نویس</option>
            </select>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ ...inp, width: "auto", cursor: "pointer" }}>
              <option value="">همه دسته‌ها</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={loadPosts} style={{ background: "var(--bg)", color: "var(--text2)", border: "1px solid var(--border)", padding: "9px 14px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer" }}>
              <i className="ti ti-search" />
            </button>
            <button onClick={openCreatePost} style={{ marginRight: "auto", background: "var(--primary)", color: "#fff", border: "none", padding: "9px 16px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <i className="ti ti-plus" /> مقاله جدید
            </button>
          </div>

          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
              <thead>
                <tr>
                  {["عنوان مقاله", "دسته", "بازدید", "وضعیت", "تاریخ", ""].map((h) => (
                    <th key={h} style={{ background: "var(--bg)", padding: "10px 12px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 900 }}>{p.title}</div>
                      {p.excerpt && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{p.excerpt.substring(0, 60)}...</div>}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text3)" }}>{p.category?.name ?? "—"}</td>
                    <td style={{ padding: "10px 12px" }}>{p.viewCount}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span className={p.isPublished ? "pill-green" : "pill-orange"} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block", whiteSpace: "nowrap" }}>
                        {p.isPublished ? "منتشر شده" : "پیش‌نویس"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text3)", whiteSpace: "nowrap" }}>{fmtDate(p.createdAt)}</td>
                    <td style={{ padding: "10px 12px", display: "flex", gap: 4 }}>
                      <button onClick={() => openEditPost(p)} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "Vazirmatn", color: "var(--text2)", whiteSpace: "nowrap" }}>
                        <i className="ti ti-edit" /> ویرایش
                      </button>
                      <button onClick={() => handleDeletePost(p)} disabled={deletingPostId === p.id} style={{ background: "#fdecea", border: "1px solid #f5c6cb", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: deletingPostId === p.id ? "not-allowed" : "pointer", fontFamily: "Vazirmatn", color: "#c0392b", opacity: deletingPostId === p.id ? .6 : 1, whiteSpace: "nowrap" }}>
                        <i className="ti ti-trash" /> {deletingPostId === p.id ? "..." : "حذف"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && posts.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>مقاله‌ای یافت نشد</td></tr>}
                {loading && <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}><i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />در حال بارگذاری...</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CATEGORIES TAB ── */}
      {tab === "categories" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
          {/* List */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["نام", "اسلاگ", "مقالات", ""].map((h) => (
                    <th key={h} style={{ background: "var(--bg)", padding: "10px 12px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 900 }}>{c.name}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text3)", direction: "ltr", textAlign: "right", fontSize: 12 }}>{c.slug}</td>
                    <td style={{ padding: "10px 12px" }}>{c._count.posts}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <button onClick={() => handleDeleteCat(c)} disabled={deletingCatId === c.id || c._count.posts > 0} title={c._count.posts > 0 ? "ابتدا مقالات را منتقل کنید" : ""} style={{ background: "#fdecea", border: "1px solid #f5c6cb", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: (deletingCatId === c.id || c._count.posts > 0) ? "not-allowed" : "pointer", fontFamily: "Vazirmatn", color: "#c0392b", opacity: (deletingCatId === c.id || c._count.posts > 0) ? .45 : 1 }}>
                        <i className="ti ti-trash" /> حذف
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--text3)" }}>دسته‌ای ایجاد نشده</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Create form */}
          <form onSubmit={handleCatSubmit} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: 4 }}>دسته جدید</div>
            <div>
              <label style={lbl}>نام <span style={{ color: "#c0392b" }}>*</span></label>
              <input value={catForm.name} onChange={(e) => onCatNameChange(e.target.value)} style={inp} placeholder="آموزش" />
            </div>
            <div>
              <label style={lbl}>اسلاگ <span style={{ color: "#c0392b" }}>*</span></label>
              <input value={catForm.slug} onChange={(e) => { setCatSlugTouched(true); setCatForm((f) => ({ ...f, slug: e.target.value })); }} style={{ ...inp, direction: "ltr", textAlign: "left" }} placeholder="tutorial" />
            </div>
            <button type="submit" disabled={catSaving} style={{ background: catSaving ? "#aaa" : "var(--primary)", color: "#fff", border: "none", padding: "11px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", cursor: catSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {catSaving ? <><i className="ti ti-loader-2" /> در حال ذخیره...</> : <><i className="ti ti-plus" /> ایجاد دسته</>}
            </button>
          </form>
        </div>
      )}

      {/* ── POST CREATE/EDIT DRAWER ── */}
      {postFormOpen && (
        <div onClick={closePostForm} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9998, display: "flex", justifyContent: "flex-start" }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handlePostSubmit} style={{ width: 580, maxWidth: "100%", height: "100%", background: "var(--bg)", overflowY: "auto", boxShadow: "0 0 40px rgba(0,0,0,.3)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "1rem 1.5rem", background: "#fff", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", margin: 0 }}>
                {postForm.id ? "ویرایش مقاله" : "مقاله جدید"}
              </h3>
              <button type="button" onClick={closePostForm} style={{ background: "transparent", border: "none", fontSize: 22, color: "var(--text3)", cursor: "pointer", lineHeight: 1 }}>
                <i className="ti ti-x" />
              </button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <div>
                <label style={lbl}>عنوان مقاله <span style={{ color: "#c0392b" }}>*</span></label>
                <input value={postForm.title} onChange={(e) => onTitleChange(e.target.value)} style={inp} placeholder="عنوان مقاله را وارد کنید" />
              </div>
              <div>
                <label style={lbl}>اسلاگ (URL) <span style={{ color: "#c0392b" }}>*</span></label>
                <input value={postForm.slug} onChange={(e) => { setSlugTouched(true); setPostForm((f) => ({ ...f, slug: e.target.value })); }} style={{ ...inp, direction: "ltr", textAlign: "left" }} placeholder="article-slug" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>دسته‌بندی</label>
                  <select value={postForm.categoryId} onChange={(e) => setPostForm((f) => ({ ...f, categoryId: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                    <option value="">— بدون دسته —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--text2)", cursor: "pointer" }}>
                    <input type="checkbox" checked={postForm.isPublished} onChange={(e) => setPostForm((f) => ({ ...f, isPublished: e.target.checked }))} style={{ width: 17, height: 17, cursor: "pointer" }} />
                    منتشر شود
                  </label>
                </div>
              </div>

              <div>
                <label style={lbl}>خلاصه (Excerpt)</label>
                <textarea value={postForm.excerpt} onChange={(e) => setPostForm((f) => ({ ...f, excerpt: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} placeholder="خلاصه کوتاه مقاله برای نمایش در لیست..." />
              </div>

              <div>
                <label style={lbl}>محتوا <span style={{ color: "#c0392b" }}>*</span></label>
                <textarea value={postForm.content} onChange={(e) => setPostForm((f) => ({ ...f, content: e.target.value }))} rows={10} style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.6 }} placeholder="محتوای کامل مقاله (HTML یا متن ساده)..." />
              </div>

              {/* Cover image */}
              <div>
                <label style={lbl}>تصویر شاخص</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {postForm.imageUrl ? (
                    <div style={{ position: "relative", width: 80, height: 56, borderRadius: 8, overflow: "hidden", border: "1.5px solid var(--border)", flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={postForm.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button type="button" onClick={() => setPostForm((f) => ({ ...f, imageUrl: "" }))} style={{ position: "absolute", top: 2, left: 2, background: "rgba(192,57,43,.9)", color: "#fff", border: "none", borderRadius: 4, width: 20, height: 20, cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  ) : (
                    <div style={{ width: 80, height: 56, borderRadius: 8, border: "1.5px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--border)", flexShrink: 0 }}>
                      <i className="ti ti-photo" style={{ fontSize: 24 }} />
                    </div>
                  )}
                  <button type="button" onClick={() => imgInputRef.current?.click()} disabled={imgUploading} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "8px 14px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 900, fontFamily: "Vazirmatn", cursor: imgUploading ? "not-allowed" : "pointer", color: "var(--text2)", display: "flex", alignItems: "center", gap: 6 }}>
                    <i className={`ti ${imgUploading ? "ti-loader-2" : "ti-upload"}`} /> {imgUploading ? "در حال آپلود..." : "انتخاب تصویر"}
                  </button>
                  <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                </div>
              </div>

              <div>
                <label style={lbl}>تگ‌ها (با کاما جدا کنید)</label>
                <input value={postForm.tags} onChange={(e) => setPostForm((f) => ({ ...f, tags: e.target.value }))} style={inp} placeholder="لوله‌کشی، شیرآلات، آموزش" />
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text3)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-search" /> تنظیمات سئو
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={lbl}>Meta Title</label>
                    <input value={postForm.metaTitle} onChange={(e) => setPostForm((f) => ({ ...f, metaTitle: e.target.value }))} style={inp} placeholder="عنوان برای موتورهای جستجو" />
                  </div>
                  <div>
                    <label style={lbl}>Meta Description</label>
                    <textarea value={postForm.metaDesc} onChange={(e) => setPostForm((f) => ({ ...f, metaDesc: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} placeholder="توضیحات متا..." />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "1rem 1.5rem", background: "#fff", borderTop: "1px solid var(--border)", display: "flex", gap: 10, position: "sticky", bottom: 0 }}>
              <button type="submit" disabled={postSaving || imgUploading} style={{ flex: 1, background: (postSaving || imgUploading) ? "#aaa" : "var(--primary)", color: "#fff", border: "none", padding: "12px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 900, fontFamily: "Vazirmatn", cursor: (postSaving || imgUploading) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {postSaving ? <><i className="ti ti-loader-2" /> در حال ذخیره...</> : <><i className="ti ti-device-floppy" /> {postForm.id ? "ذخیره تغییرات" : "ثبت مقاله"}</>}
              </button>
              <button type="button" onClick={closePostForm} style={{ background: "var(--bg)", color: "var(--text2)", border: "1px solid var(--border)", padding: "12px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer" }}>
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
