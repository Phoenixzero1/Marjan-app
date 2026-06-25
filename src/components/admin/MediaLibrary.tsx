"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AdminPageHeader, AdminBtn, AdminCard, AdminCardHeader,
  AdminToolbar, AdminSearch, AdminSelect,
  AdminTable, AdminTh, AdminTd, AdminTr, AdminEmptyState,
  AdminStatCard, AdminPagination, AdminTabs,
  AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  folder: string;
  createdAt: string;
}

interface CleanupStats {
  totalCount: number;
  totalSize: number;
  unusedCount: number;
  unusedSize: number;
  unused: MediaItem[];
}

type ActiveTab = "library" | "cleanup";

function formatBytes(n: number) {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + " MB";
  if (n >= 1024) return (n / 1024).toFixed(0) + " KB";
  return n + " B";
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });
}

export default function MediaLibrary() {
  const { toast, showToast } = useAdminToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("library");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [mimeFilter, setMimeFilter] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cleanup, setCleanup] = useState<CleanupStats | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "40" });
      if (q) params.set("q", q);
      if (mimeFilter) params.set("mimeType", mimeFilter);
      if (folderFilter) params.set("folder", folderFilter);
      const res = await fetch(`/api/admin/media?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(pg);
    } finally { setLoading(false); }
  }, [q, mimeFilter, folderFilter]);

  useEffect(() => { load(1); }, [load]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let successCount = 0;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "uploads");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) successCount++;
      else { const d = await res.json(); showToast("error", d.error ?? "خطا در آپلود"); }
    }
    setUploading(false);
    if (successCount > 0) { showToast("success", `${successCount} فایل با موفقیت آپلود شد`); load(1); }
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`آیا از حذف "${item.originalName}" مطمئن هستید؟`)) return;
    setDeleting(item.id);
    try {
      const res = await fetch("/api/admin/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا در حذف"); return; }
      showToast("success", "فایل حذف شد");
      if (selected?.id === item.id) setSelected(null);
      load(page);
    } finally { setDeleting(null); }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(window.location.origin + url).then(() => showToast("success", "آدرس کپی شد"));
  }

  const isImage = (mime: string) => mime.startsWith("image/");

  async function loadCleanup() {
    setCleanupLoading(true);
    try {
      const res = await fetch("/api/admin/media/cleanup");
      const d = await res.json();
      setCleanup(d);
    } finally { setCleanupLoading(false); }
  }

  async function bulkDeleteUnused() {
    if (!cleanup || cleanup.unusedCount === 0) return;
    if (!confirm(`آیا از حذف ${cleanup.unusedCount} فایل بلااستفاده (${formatBytes(cleanup.unusedSize)}) مطمئن هستید؟`)) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/admin/media/cleanup", { method: "DELETE" });
      const d = await res.json();
      if (res.ok) { showToast("success", `${d.deleted} فایل حذف شد — ${formatBytes(d.freedBytes)} آزاد شد`); loadCleanup(); load(1); }
      else showToast("error", "خطا در حذف فایل‌ها");
    } finally { setBulkDeleting(false); }
  }

  useEffect(() => {
    if (activeTab === "cleanup" && !cleanup) loadCleanup();
  }, [activeTab]);

  const TABS = [
    { id: "library", label: "کتابخانه", icon: "ti-photo" },
    { id: "cleanup", label: `پاکسازی${cleanup ? ` (${cleanup.unusedCount})` : ""}`, icon: "ti-trash" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <AdminToast toast={toast} />

      <AdminPageHeader
        title="کتابخانه رسانه"
        icon="ti-photo"
        count={total}
        subtitle={`${total.toLocaleString("fa-IR")} فایل ذخیره شده`}
        actions={
          <>
            <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => handleUpload(e.target.files)} />
            <AdminBtn icon="ti-upload" variant="primary" loading={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "در حال آپلود..." : "آپلود فایل"}
            </AdminBtn>
          </>
        }
      />

      <AdminTabs tabs={TABS} active={activeTab} onChange={(t) => setActiveTab(t as ActiveTab)} />

      {activeTab === "cleanup" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {cleanup && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <AdminStatCard icon="ti-database" label="کل فایل‌ها" value={cleanup.totalCount.toLocaleString("fa-IR")} sub={formatBytes(cleanup.totalSize)} color="#2563eb" />
              <AdminStatCard icon="ti-trash" label="فایل بلااستفاده" value={cleanup.unusedCount.toLocaleString("fa-IR")} sub={formatBytes(cleanup.unusedSize)} color="#dc2626" />
              <AdminStatCard icon="ti-circle-check" label="فایل در استفاده" value={(cleanup.totalCount - cleanup.unusedCount).toLocaleString("fa-IR")} sub={formatBytes(cleanup.totalSize - cleanup.unusedSize)} color="#16a34a" />
            </div>
          )}

          <AdminCard>
            <AdminCardHeader
              title="فایل‌های بلااستفاده"
              icon="ti-trash"
              subtitle="هیچ محصول، مقاله یا دسته‌بندی به این فایل‌ها لینک نداده"
              actions={
                <div style={{ display: "flex", gap: 8 }}>
                  <AdminBtn icon="ti-refresh" loading={cleanupLoading} onClick={loadCleanup}>بروزرسانی</AdminBtn>
                  {cleanup && cleanup.unusedCount > 0 && (
                    <AdminBtn icon="ti-trash" variant="danger" loading={bulkDeleting} onClick={bulkDeleteUnused}>
                      حذف {cleanup.unusedCount} فایل بلااستفاده
                    </AdminBtn>
                  )}
                </div>
              }
            />
            <div style={{ marginTop: 12 }}>
              {cleanupLoading ? (
                <AdminEmptyState icon="ti-loader-2" title="در حال بررسی..." />
              ) : !cleanup || cleanup.unused.length === 0 ? (
                <AdminEmptyState icon="ti-circle-check" title="فایل بلااستفاده‌ای یافت نشد" />
              ) : (
                <AdminTable>
                  <thead>
                    <tr>
                      <AdminTh>فایل</AdminTh>
                      <AdminTh>نوع</AdminTh>
                      <AdminTh>حجم</AdminTh>
                      <AdminTh>پوشه</AdminTh>
                      <AdminTh>تاریخ</AdminTh>
                    </tr>
                  </thead>
                  <tbody>
                    {cleanup.unused.map((item) => (
                      <AdminTr key={item.id}>
                        <AdminTd>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isImage(item.mimeType) ? (
                              <img src={item.url} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4 }} />
                            ) : (
                              <div style={{ width: 32, height: 32, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}>
                                <i className="ti ti-file-type-pdf" style={{ color: "#ef4444", fontSize: 14 }} />
                              </div>
                            )}
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{item.originalName}</span>
                          </div>
                        </AdminTd>
                        <AdminTd>{item.mimeType.split("/")[1]?.toUpperCase()}</AdminTd>
                        <AdminTd>{formatBytes(item.size)}</AdminTd>
                        <AdminTd>
                          <span style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: "var(--text2)" }}>{item.folder}</span>
                        </AdminTd>
                        <AdminTd>{formatDate(item.createdAt)}</AdminTd>
                      </AdminTr>
                    ))}
                  </tbody>
                </AdminTable>
              )}
            </div>
          </AdminCard>
        </div>
      )}

      {activeTab === "library" && (
        <>
          <AdminToolbar>
            <AdminSearch value={q} onChange={setQ} placeholder="جستجو نام فایل..." />
            <AdminSelect value={mimeFilter} onChange={setMimeFilter}>
              <option value="">همه نوع‌ها</option>
              <option value="image">تصاویر</option>
              <option value="pdf">PDF</option>
            </AdminSelect>
            <AdminSearch value={folderFilter} onChange={setFolderFilter} placeholder="فیلتر پوشه..." />
            <AdminBtn icon="ti-search" onClick={() => load(1)}>جستجو</AdminBtn>
            <div style={{ marginRight: "auto", display: "flex", gap: 4 }}>
              <AdminBtn size="sm" icon="ti-layout-grid" variant={viewMode === "grid" ? "primary" : "secondary"} onClick={() => setViewMode("grid")} />
              <AdminBtn size="sm" icon="ti-list" variant={viewMode === "list" ? "primary" : "secondary"} onClick={() => setViewMode("list")} />
            </div>
          </AdminToolbar>

          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />
              ) : items.length === 0 ? (
                <AdminEmptyState icon="ti-photo-off" title="فایلی یافت نشد" />
              ) : viewMode === "grid" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                  {items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelected(selected?.id === item.id ? null : item)}
                      style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: selected?.id === item.id ? "0 0 0 2px var(--accent)" : "var(--shadow)", overflow: "hidden", cursor: "pointer", transition: "box-shadow .15s", position: "relative" }}
                    >
                      <div style={{ height: 120, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {isImage(item.mimeType) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.url} alt={item.originalName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <i className="ti ti-file-type-pdf" style={{ fontSize: 48, color: "#ef4444" }} />
                        )}
                      </div>
                      <div style={{ padding: "8px 10px" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.originalName}</p>
                        <p style={{ fontSize: 10, color: "var(--text3)", margin: "2px 0 0" }}>{formatBytes(item.size)}</p>
                      </div>
                      {deleting === item.id && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <i className="ti ti-loader-2" style={{ fontSize: 24, color: "var(--accent)" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <AdminCard>
                  <AdminTable>
                    <thead>
                      <tr>
                        <AdminTh>فایل</AdminTh>
                        <AdminTh>نوع</AdminTh>
                        <AdminTh>حجم</AdminTh>
                        <AdminTh>پوشه</AdminTh>
                        <AdminTh>تاریخ</AdminTh>
                        <AdminTh>عملیات</AdminTh>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <AdminTr
                          key={item.id}
                          onClick={() => setSelected(selected?.id === item.id ? null : item)}
                          style={{ background: selected?.id === item.id ? "rgba(232,146,10,.06)" : undefined, cursor: "pointer" }}
                        >
                          <AdminTd>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {isImage(item.mimeType) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.url} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }} />
                              ) : (
                                <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "#fee2e2", borderRadius: 4 }}>
                                  <i className="ti ti-file-type-pdf" style={{ color: "#ef4444" }} />
                                </div>
                              )}
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{item.originalName}</span>
                            </div>
                          </AdminTd>
                          <AdminTd>{item.mimeType.split("/")[1]?.toUpperCase()}</AdminTd>
                          <AdminTd>{formatBytes(item.size)}</AdminTd>
                          <AdminTd>
                            <span style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: "var(--text2)" }}>{item.folder}</span>
                          </AdminTd>
                          <AdminTd>{formatDate(item.createdAt)}</AdminTd>
                          <AdminTd>
                            <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                              <AdminBtn size="sm" icon="ti-copy" onClick={() => copyUrl(item.url)} />
                              <AdminBtn size="sm" icon="ti-trash" variant="danger" loading={deleting === item.id} onClick={() => handleDelete(item)} />
                            </div>
                          </AdminTd>
                        </AdminTr>
                      ))}
                    </tbody>
                  </AdminTable>
                </AdminCard>
              )}

              {pages > 1 && (
                <AdminPagination page={page} total={total} pageSize={40} onChange={pg => load(pg)} />
              )}
            </div>

            {selected && (
              <div style={{ width: 260, background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: 20, flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>جزئیات فایل</h4>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4 }}>
                    <i className="ti ti-x" style={{ fontSize: 16 }} />
                  </button>
                </div>
                <div style={{ width: "100%", height: 160, background: "var(--bg)", borderRadius: 8, overflow: "hidden", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isImage(selected.mimeType) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.url} alt={selected.originalName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <i className="ti ti-file-type-pdf" style={{ fontSize: 64, color: "#ef4444" }} />
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                  <div>
                    <span style={{ color: "var(--text3)", fontSize: 11 }}>نام فایل</span>
                    <p style={{ margin: "2px 0 0", fontWeight: 700, color: "var(--text)", wordBreak: "break-all" }}>{selected.originalName}</p>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div><span style={{ color: "var(--text3)", fontSize: 11 }}>حجم</span><p style={{ margin: "2px 0 0", fontWeight: 700 }}>{formatBytes(selected.size)}</p></div>
                    <div><span style={{ color: "var(--text3)", fontSize: 11 }}>نوع</span><p style={{ margin: "2px 0 0", fontWeight: 700 }}>{selected.mimeType.split("/")[1]?.toUpperCase()}</p></div>
                  </div>
                  <div><span style={{ color: "var(--text3)", fontSize: 11 }}>پوشه</span><p style={{ margin: "2px 0 0", fontWeight: 700 }}>{selected.folder}</p></div>
                  <div><span style={{ color: "var(--text3)", fontSize: 11 }}>تاریخ آپلود</span><p style={{ margin: "2px 0 0", fontWeight: 700 }}>{formatDate(selected.createdAt)}</p></div>
                  <div><span style={{ color: "var(--text3)", fontSize: 11 }}>آدرس</span><p style={{ margin: "2px 0 0", fontWeight: 600, color: "var(--accent)", wordBreak: "break-all", fontSize: 11 }}>{selected.url}</p></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                  <AdminBtn icon="ti-copy" style={{ width: "100%", justifyContent: "center" }} onClick={() => copyUrl(selected.url)}>کپی آدرس</AdminBtn>
                  {isImage(selected.mimeType) && (
                    <a href={selected.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--bg)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 0", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                      <i className="ti ti-external-link" /> مشاهده در تب جدید
                    </a>
                  )}
                  <AdminBtn icon="ti-trash" variant="danger" loading={deleting === selected.id} style={{ width: "100%", justifyContent: "center" }} onClick={() => handleDelete(selected)}>حذف فایل</AdminBtn>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
