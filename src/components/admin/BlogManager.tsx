"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminToolbar, AdminSearch, AdminSelect, AdminBtn, AdminTable, AdminTh, AdminTd, AdminTr,
  AdminBadge, AdminEmptyState, AdminDrawer, AdminField, AdminInput, AdminTextarea, AdminInputSelect,
  AdminToggle, AdminDivider, AdminTabs, AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";
import ImageUploader from "@/components/admin/ImageUploader";

interface BlogCategory { id: string; name: string; slug: string; _count: { posts: number }; }
interface BlogPost {
  id: string; title: string; slug: string; excerpt: string | null; content: string;
  categoryId: string | null; imageUrl: string | null; isPublished: boolean;
  viewCount: number; tags: string[]; metaTitle: string | null; metaDesc: string | null;
  createdAt: string; publishedAt: string | null;
  category: { id: string; name: string } | null;
}

interface PostForm {
  id?: string; title: string; slug: string; excerpt: string; content: string;
  categoryId: string; imageUrl: string; isPublished: boolean;
  tags: string; metaTitle: string; metaDesc: string;
}

const emptyPost: PostForm = { title: "", slug: "", excerpt: "", content: "", categoryId: "", imageUrl: "", isPublished: false, tags: "", metaTitle: "", metaDesc: "" };
interface CatForm { id?: string; name: string; slug: string; }
const emptyCat: CatForm = { name: "", slug: "" };

export default function BlogManager() {
  const { toast, showToast } = useAdminToast();
  const [tab, setTab] = useState<"posts" | "categories">("posts");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");

  const [postFormOpen, setPostFormOpen] = useState(false);
  const [postForm, setPostForm] = useState<PostForm>(emptyPost);
  const [postSaving, setPostSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const [catForm, setCatForm] = useState<CatForm>(emptyCat);
  const [catSaving, setCatSaving] = useState(false);
  const [catSlugTouched, setCatSlugTouched] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const loadCategories = useCallback(() => {
    fetch("/api/admin/blog/categories").then(r => r.json()).then(d => setCategories(d.categories ?? [])).catch(() => showToast("error", "خطا در بارگذاری دسته‌ها"));
  }, [showToast]);

  const loadPosts = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("q", search.trim());
    if (publishedFilter) qs.set("published", publishedFilter);
    if (catFilter) qs.set("categoryId", catFilter);
    fetch(`/api/admin/blog?${qs}`).then(r => r.json()).then(d => setPosts(d.posts ?? [])).catch(() => showToast("error", "خطا در بارگذاری مقالات")).finally(() => setLoading(false));
  }, [search, publishedFilter, catFilter, showToast]);

  useEffect(() => { loadCategories(); loadPosts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadPosts(); }, [publishedFilter, catFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTitleChange = (v: string) => setPostForm(f => { const next = { ...f, title: v }; if (!slugTouched && !f.id) next.slug = v.toLowerCase().trim().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]+/g, "").replace(/-+/g, "-").replace(/^-|-$/g, ""); return next; });

  const openCreatePost = () => { setPostForm(emptyPost); setSlugTouched(false); setPostFormOpen(true); };
  const openEditPost = (p: BlogPost) => { setPostForm({ id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt ?? "", content: p.content, categoryId: p.categoryId ?? "", imageUrl: p.imageUrl ?? "", isPublished: p.isPublished, tags: (p.tags ?? []).join(", "), metaTitle: p.metaTitle ?? "", metaDesc: p.metaDesc ?? "" }); setSlugTouched(true); setPostFormOpen(true); };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postForm.title.trim().length < 2) { showToast("error", "عنوان مقاله الزامی است"); return; }
    if (!/^[a-z0-9-]{2,}$/.test(postForm.slug)) { showToast("error", "اسلاگ معتبر وارد کنید"); return; }
    if (!postForm.content.trim()) { showToast("error", "محتوای مقاله الزامی است"); return; }
    setPostSaving(true);
    try {
      const payload = { title: postForm.title.trim(), slug: postForm.slug.trim(), excerpt: postForm.excerpt.trim() || null, content: postForm.content.trim(), categoryId: postForm.categoryId || null, imageUrl: postForm.imageUrl || null, isPublished: postForm.isPublished, tags: postForm.tags.split(",").map(t => t.trim()).filter(Boolean), metaTitle: postForm.metaTitle.trim() || null, metaDesc: postForm.metaDesc.trim() || null };
      const res = await fetch(postForm.id ? `/api/admin/blog/${postForm.id}` : "/api/admin/blog", { method: postForm.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در ذخیره"); return; }
      showToast("success", postForm.id ? "مقاله ویرایش شد" : "مقاله ایجاد شد"); setPostFormOpen(false); loadPosts();
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
      showToast("success", `«${p.title}» حذف شد`); setPosts(prev => prev.filter(x => x.id !== p.id));
    } catch { showToast("error", "خطای سرور"); }
    finally { setDeletingPostId(null); }
  };

  const onCatNameChange = (v: string) => setCatForm(f => { const next = { ...f, name: v }; if (!catSlugTouched) next.slug = v.toLowerCase().trim().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]+/g, "").replace(/-+/g, "-").replace(/^-|-$/g, ""); return next; });

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (catForm.name.trim().length < 2) { showToast("error", "نام دسته الزامی است"); return; }
    if (!/^[a-z0-9-]{2,}$/.test(catForm.slug)) { showToast("error", "اسلاگ معتبر وارد کنید"); return; }
    setCatSaving(true);
    try {
      const res = await fetch("/api/admin/blog/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: catForm.name.trim(), slug: catForm.slug.trim() }) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در ایجاد دسته"); return; }
      showToast("success", "دسته ایجاد شد"); setCatForm(emptyCat); setCatSlugTouched(false); loadCategories();
    } catch { showToast("error", "خطای سرور"); }
    finally { setCatSaving(false); }
  };

  const handleDeleteCat = async (c: BlogCategory) => {
    if (c._count.posts > 0) { showToast("error", `این دسته دارای ${c._count.posts} مقاله است`); return; }
    if (!window.confirm(`آیا از حذف «${c.name}» مطمئن هستید؟`)) return;
    setDeletingCatId(c.id);
    try {
      const res = await fetch("/api/admin/blog/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id }) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در حذف"); return; }
      showToast("success", `«${c.name}» حذف شد`); setCategories(prev => prev.filter(x => x.id !== c.id));
    } catch { showToast("error", "خطای سرور"); }
    finally { setDeletingCatId(null); }
  };

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="مدیریت بلاگ" icon="ti-article" count={posts.length}
        subtitle={`${posts.filter(p => p.isPublished).length} منتشرشده — ${categories.length} دسته`}
        actions={<AdminBtn icon="ti-plus" variant="primary" onClick={openCreatePost}>مقاله جدید</AdminBtn>}
      />

      <div style={{ marginBottom: 14 }}>
        <AdminTabs active={tab} onChange={v => setTab(v as "posts" | "categories")}
          tabs={[{ id: "posts", label: "مقالات", icon: "ti-article" }, { id: "categories", label: "دسته‌بندی‌ها", icon: "ti-category" }]}
        />
      </div>

      {tab === "posts" && (
        <>
          <AdminToolbar>
            <AdminSearch value={search} onChange={setSearch} placeholder="جستجو عنوان مقاله..." />
            <AdminSelect value={publishedFilter} onChange={setPublishedFilter}>
              <option value="">همه وضعیت‌ها</option>
              <option value="true">منتشر شده</option>
              <option value="false">پیش‌نویس</option>
            </AdminSelect>
            <AdminSelect value={catFilter} onChange={setCatFilter}>
              <option value="">همه دسته‌ها</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </AdminSelect>
            <AdminBtn icon="ti-search" onClick={loadPosts}>جستجو</AdminBtn>
          </AdminToolbar>

          <AdminTable>
            <thead>
              <tr>
                <AdminTh>عنوان مقاله</AdminTh>
                <AdminTh>دسته</AdminTh>
                <AdminTh>بازدید</AdminTh>
                <AdminTh>وضعیت</AdminTh>
                <AdminTh>تاریخ</AdminTh>
                <AdminTh style={{ width: 130 }}>عملیات</AdminTh>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6}><AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /></td></tr>}
              {!loading && posts.length === 0 && <tr><td colSpan={6}><AdminEmptyState icon="ti-article-off" title="مقاله‌ای یافت نشد" /></td></tr>}
              {posts.map(p => (
                <AdminTr key={p.id}>
                  <AdminTd>
                    <div style={{ fontWeight: 900 }}>{p.title}</div>
                    {p.excerpt && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{p.excerpt.substring(0, 60)}...</div>}
                  </AdminTd>
                  <AdminTd style={{ color: "var(--text3)" }}>{p.category?.name ?? "—"}</AdminTd>
                  <AdminTd>{p.viewCount.toLocaleString("fa-IR")}</AdminTd>
                  <AdminTd><AdminBadge variant={p.isPublished ? "success" : "warning"} dot>{p.isPublished ? "منتشر شده" : "پیش‌نویس"}</AdminBadge></AdminTd>
                  <AdminTd style={{ color: "var(--text3)", fontSize: 12 }}>{new Date(p.createdAt).toLocaleDateString("fa-IR")}</AdminTd>
                  <AdminTd>
                    <div style={{ display: "flex", gap: 4 }}>
                      <AdminBtn icon="ti-edit" size="sm" onClick={() => openEditPost(p)}>ویرایش</AdminBtn>
                      <AdminBtn icon="ti-trash" size="sm" variant="danger" loading={deletingPostId === p.id} onClick={() => handleDeletePost(p)} />
                    </div>
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
        </>
      )}

      {tab === "categories" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
          <AdminTable>
            <thead>
              <tr><AdminTh>نام</AdminTh><AdminTh>اسلاگ</AdminTh><AdminTh>مقالات</AdminTh><AdminTh style={{ width: 100 }}>عملیات</AdminTh></tr>
            </thead>
            <tbody>
              {categories.length === 0 && <tr><td colSpan={4}><AdminEmptyState icon="ti-category" title="دسته‌ای ایجاد نشده" /></td></tr>}
              {categories.map(c => (
                <AdminTr key={c.id}>
                  <AdminTd style={{ fontWeight: 900 }}>{c.name}</AdminTd>
                  <AdminTd><code style={{ fontSize: 11, color: "var(--text3)", background: "var(--bg)", padding: "2px 6px", borderRadius: 4, direction: "ltr", display: "inline-block" }}>{c.slug}</code></AdminTd>
                  <AdminTd>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 28, height: 22, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 11, fontWeight: 900, color: "var(--text2)" }}>{c._count.posts}</span>
                  </AdminTd>
                  <AdminTd>
                    <AdminBtn icon="ti-trash" size="sm" variant="danger" loading={deletingCatId === c.id} disabled={c._count.posts > 0} onClick={() => handleDeleteCat(c)} />
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>

          <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid var(--border)", padding: "16px" }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: "var(--primary)", marginBottom: 14 }}>دسته جدید</div>
            <form onSubmit={handleCatSubmit}>
              <AdminField label="نام" required>
                <AdminInput value={catForm.name} onChange={onCatNameChange} placeholder="آموزش" />
              </AdminField>
              <AdminField label="اسلاگ" required>
                <AdminInput value={catForm.slug} onChange={v => { setCatSlugTouched(true); setCatForm(f => ({ ...f, slug: v })); }} placeholder="tutorial" style={{ direction: "ltr" }} />
              </AdminField>
              <AdminBtn variant="primary" icon="ti-plus" loading={catSaving} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
                {catSaving ? "در حال ذخیره..." : "ایجاد دسته"}
              </AdminBtn>
            </form>
          </div>
        </div>
      )}

      {/* Post create/edit drawer */}
      <AdminDrawer open={postFormOpen} onClose={() => setPostFormOpen(false)} title={postForm.id ? "ویرایش مقاله" : "مقاله جدید"} width={580}>
        <form onSubmit={handlePostSubmit}>
          <AdminField label="عنوان مقاله" required>
            <AdminInput value={postForm.title} onChange={onTitleChange} placeholder="عنوان مقاله را وارد کنید" />
          </AdminField>
          <AdminField label="اسلاگ (URL)" required>
            <AdminInput value={postForm.slug} onChange={v => { setSlugTouched(true); setPostForm(f => ({ ...f, slug: v })); }} placeholder="article-slug" style={{ direction: "ltr" }} />
          </AdminField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <AdminField label="دسته‌بندی">
              <AdminInputSelect value={postForm.categoryId} onChange={v => setPostForm(f => ({ ...f, categoryId: v }))}>
                <option value="">— بدون دسته —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </AdminInputSelect>
            </AdminField>
            <AdminField label="وضعیت">
              <AdminToggle checked={postForm.isPublished} onChange={v => setPostForm(f => ({ ...f, isPublished: v }))} label="منتشر شود" />
            </AdminField>
          </div>
          <AdminField label="خلاصه (Excerpt)">
            <AdminTextarea value={postForm.excerpt} onChange={v => setPostForm(f => ({ ...f, excerpt: v }))} rows={2} placeholder="خلاصه کوتاه مقاله..." />
          </AdminField>
          <AdminField label="محتوا" required>
            <AdminTextarea value={postForm.content} onChange={v => setPostForm(f => ({ ...f, content: v }))} rows={10} placeholder="محتوای کامل مقاله..." />
          </AdminField>
          <AdminField label="تصویر شاخص">
            <ImageUploader value={postForm.imageUrl} onChange={v => setPostForm(f => ({ ...f, imageUrl: v }))} folder="blog" previewHeight={90} />
          </AdminField>
          <AdminField label="تگ‌ها (با کاما جدا کنید)">
            <AdminInput value={postForm.tags} onChange={v => setPostForm(f => ({ ...f, tags: v }))} placeholder="لوله‌کشی، شیرآلات، آموزش" />
          </AdminField>
          <AdminDivider label="سئو" />
          <AdminField label="Meta Title">
            <AdminInput value={postForm.metaTitle} onChange={v => setPostForm(f => ({ ...f, metaTitle: v }))} placeholder="عنوان برای موتورهای جستجو" />
          </AdminField>
          <AdminField label="Meta Description">
            <AdminTextarea value={postForm.metaDesc} onChange={v => setPostForm(f => ({ ...f, metaDesc: v }))} rows={2} placeholder="توضیحات متا..." />
          </AdminField>
          <AdminDivider />
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn variant="primary" icon="ti-device-floppy" loading={postSaving || imgUploading} style={{ flex: 1, justifyContent: "center" }}>
              {postSaving ? "در حال ذخیره..." : postForm.id ? "ذخیره تغییرات" : "ثبت مقاله"}
            </AdminBtn>
            <AdminBtn variant="secondary" onClick={() => setPostFormOpen(false)}>انصراف</AdminBtn>
          </div>
        </form>
      </AdminDrawer>
    </div>
  );
}
