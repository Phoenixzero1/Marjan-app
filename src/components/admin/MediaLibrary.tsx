"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

interface Toast { msg: string; ok: boolean }

function formatBytes(n: number) {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + " MB";
  if (n >= 1024) return (n / 1024).toFixed(0) + " KB";
  return n + " B";
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });
}

export default function MediaLibrary() {
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
  const [toast, setToast] = useState<Toast | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

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
    } finally {
      setLoading(false);
    }
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
      else { const d = await res.json(); showToast(d.error ?? "خطا در آپلود", false); }
    }
    setUploading(false);
    if (successCount > 0) {
      showToast(`${successCount} فایل با موفقیت آپلود شد`);
      load(1);
    }
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`آیا از حذف "${item.originalName}" مطمئن هستید؟`)) return;
    setDeleting(item.id);
    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "خطا در حذف", false); return; }
      showToast("فایل حذف شد");
      if (selected?.id === item.id) setSelected(null);
      load(page);
    } finally {
      setDeleting(null);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(window.location.origin + url).then(() => showToast("آدرس کپی شد"));
  }

  const isImage = (mime: string) => mime.startsWith("image/");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? "#22c55e" : "#ef4444", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 4px 24px rgba(0,0,0,.18)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>کتابخانه رسانه</h2>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>{total.toLocaleString("fa-IR")} فایل ذخیره شده</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => handleUpload(e.target.files)} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "9px 18px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            <i className="ti ti-upload" />
            {uploading ? "در حال آپلود..." : "آپلود فایل"}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "14px 20px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(1)}
          placeholder="جستجو نام فایل..."
          style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", minWidth: 200 }}
        />
        <select value={mimeFilter} onChange={e => setMimeFilter(e.target.value)} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontFamily: "Vazirmatn", fontSize: 13, background: "#fff" }}>
          <option value="">همه نوع‌ها</option>
          <option value="image">تصاویر</option>
          <option value="pdf">PDF</option>
        </select>
        <input
          value={folderFilter}
          onChange={e => setFolderFilter(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(1)}
          placeholder="فیلتر پوشه..."
          style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", width: 140 }}
        />
        <button onClick={() => load(1)} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>جستجو</button>
        <div style={{ marginRight: "auto", display: "flex", gap: 4 }}>
          <button onClick={() => setViewMode("grid")} title="نمای شبکه" style={{ background: viewMode === "grid" ? "var(--primary)" : "var(--surface)", color: viewMode === "grid" ? "#fff" : "var(--text2)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 10px", cursor: "pointer" }}>
            <i className="ti ti-layout-grid" />
          </button>
          <button onClick={() => setViewMode("list")} title="نمای لیست" style={{ background: viewMode === "list" ? "var(--primary)" : "var(--surface)", color: viewMode === "list" ? "#fff" : "var(--text2)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 10px", cursor: "pointer" }}>
            <i className="ti ti-list" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Grid / List */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
              <i className="ti ti-loader-2" style={{ fontSize: 36, display: "block", marginBottom: 8 }} />
              در حال بارگذاری...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", color: "var(--text3)" }}>
              <i className="ti ti-photo-off" style={{ fontSize: 48, display: "block", marginBottom: 8 }} />
              <p>فایلی یافت نشد</p>
            </div>
          ) : viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {items.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelected(selected?.id === item.id ? null : item)}
                  style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: selected?.id === item.id ? "0 0 0 2px var(--accent)" : "var(--shadow)", overflow: "hidden", cursor: "pointer", transition: "box-shadow .15s", position: "relative" }}
                >
                  <div style={{ height: 120, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
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
            // List view
            <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--surface)", borderBottom: "1.5px solid var(--border)" }}>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "var(--text2)" }}>فایل</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "var(--text2)" }}>نوع</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "var(--text2)" }}>حجم</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "var(--text2)" }}>پوشه</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "var(--text2)" }}>تاریخ</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 700, color: "var(--text2)" }}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelected(selected?.id === item.id ? null : item)}
                      style={{ background: selected?.id === item.id ? "rgba(var(--accent-rgb),.06)" : i % 2 === 0 ? "#fff" : "var(--surface)", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                    >
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {isImage(item.mimeType) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }} />
                          ) : (
                            <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "#fee2e2", borderRadius: 4 }}>
                              <i className="ti ti-file-type-pdf" style={{ color: "#ef4444" }} />
                            </div>
                          )}
                          <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{item.originalName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px", color: "var(--text3)", fontSize: 11 }}>{item.mimeType.split("/")[1]?.toUpperCase()}</td>
                      <td style={{ padding: "10px 16px", color: "var(--text3)" }}>{formatBytes(item.size)}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: "var(--text2)" }}>{item.folder}</span>
                      </td>
                      <td style={{ padding: "10px 16px", color: "var(--text3)", fontSize: 12 }}>{formatDate(item.createdAt)}</td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                          <button onClick={e => { e.stopPropagation(); copyUrl(item.url); }} title="کپی آدرس" style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: "var(--text2)" }}>
                            <i className="ti ti-copy" style={{ fontSize: 14 }} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(item); }} disabled={deleting === item.id} title="حذف" style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: "#ef4444" }}>
                            <i className="ti ti-trash" style={{ fontSize: 14 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
              <button onClick={() => load(page - 1)} disabled={page <= 1} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer", opacity: page <= 1 ? .5 : 1 }}>قبلی</button>
              <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "var(--text2)", padding: "0 8px" }}>
                صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}
              </span>
              <button onClick={() => load(page + 1)} disabled={page >= pages} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer", opacity: page >= pages ? .5 : 1 }}>بعدی</button>
            </div>
          )}
        </div>

        {/* Detail panel — shown when item is selected */}
        {selected && (
          <div style={{ width: 260, background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: 20, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>جزئیات فایل</h4>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4 }}>
                <i className="ti ti-x" style={{ fontSize: 16 }} />
              </button>
            </div>

            <div style={{ width: "100%", height: 160, background: "var(--surface)", borderRadius: 8, overflow: "hidden", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                <div>
                  <span style={{ color: "var(--text3)", fontSize: 11 }}>حجم</span>
                  <p style={{ margin: "2px 0 0", fontWeight: 700 }}>{formatBytes(selected.size)}</p>
                </div>
                <div>
                  <span style={{ color: "var(--text3)", fontSize: 11 }}>نوع</span>
                  <p style={{ margin: "2px 0 0", fontWeight: 700 }}>{selected.mimeType.split("/")[1]?.toUpperCase()}</p>
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text3)", fontSize: 11 }}>پوشه</span>
                <p style={{ margin: "2px 0 0", fontWeight: 700 }}>{selected.folder}</p>
              </div>
              <div>
                <span style={{ color: "var(--text3)", fontSize: 11 }}>تاریخ آپلود</span>
                <p style={{ margin: "2px 0 0", fontWeight: 700 }}>{formatDate(selected.createdAt)}</p>
              </div>
              <div>
                <span style={{ color: "var(--text3)", fontSize: 11 }}>آدرس</span>
                <p style={{ margin: "2px 0 0", fontWeight: 600, color: "var(--accent)", wordBreak: "break-all", fontSize: 11 }}>{selected.url}</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              <button
                onClick={() => copyUrl(selected.url)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "9px 0", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}
              >
                <i className="ti ti-copy" /> کپی آدرس
              </button>
              {isImage(selected.mimeType) && (
                <a href={selected.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--surface)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 0", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, textDecoration: "none", width: "100%" }}>
                  <i className="ti ti-external-link" /> مشاهده در تب جدید
                </a>
              )}
              <button
                onClick={() => handleDelete(selected)}
                disabled={deleting === selected.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#fef2f2", color: "#ef4444", border: "1.5px solid #fca5a5", borderRadius: "var(--radius-sm)", padding: "9px 0", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}
              >
                <i className="ti ti-trash" /> حذف فایل
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
