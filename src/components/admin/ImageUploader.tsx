"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  /** Height of the preview image in px (default 120) */
  previewHeight?: number;
  accept?: string;
  /** Compact mode: shows a smaller zone, good for logo/thumbnail fields */
  compact?: boolean;
}

export default function ImageUploader({
  value,
  onChange,
  folder,
  previewHeight = 120,
  accept = "image/jpeg,image/png,image/webp",
  compact = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url);
      } else {
        setError(data.error ?? "خطا در آپلود");
      }
    } catch {
      setError("اتصال برقرار نشد");
    } finally {
      setUploading(false);
    }
  }, [folder, onChange]);

  // Global paste handler — ignores paste inside text inputs/textareas
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) { e.preventDefault(); upload(blob); }
          break;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [upload]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  const pick = () => fileRef.current?.click();

  if (value) {
    return (
      <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", gap: 6 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt=""
          style={{
            height: previewHeight,
            maxWidth: compact ? 140 : "100%",
            objectFit: "contain",
            borderRadius: 8,
            border: "1.5px solid var(--border)",
            background: "#f8f9fb",
            display: "block",
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            style={{
              flex: 1, padding: "5px 12px", fontSize: 11, fontWeight: 700,
              fontFamily: "Vazirmatn", cursor: "pointer", borderRadius: 6,
              background: "var(--bg)", border: "1.5px solid var(--border)",
              color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            <i className={uploading ? "ti ti-loader-2" : "ti ti-upload"} style={{ fontSize: 12 }} />
            {uploading ? "آپلود..." : "تغییر تصویر"}
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            style={{
              padding: "5px 10px", fontSize: 12, fontWeight: 900,
              fontFamily: "Vazirmatn", cursor: "pointer", borderRadius: 6,
              background: "#fdecea", border: "1.5px solid #f5c6cb", color: "#c0392b",
            }}
          >×</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={pick}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? "var(--primary)" : "var(--border)"}`,
          borderRadius: 10,
          padding: compact ? "14px 12px" : "22px 16px",
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? "rgba(10,42,94,0.04)" : "#fafbfd",
          transition: "all .18s",
        }}
      >
        {uploading ? (
          <div style={{ color: "var(--primary)", fontWeight: 700, fontSize: 13 }}>
            <i className="ti ti-loader-2" style={{ fontSize: compact ? 22 : 28, display: "block", marginBottom: 6 }} />
            در حال آپلود...
          </div>
        ) : (
          <>
            <i
              className="ti ti-cloud-upload"
              style={{
                fontSize: compact ? 22 : 30,
                color: dragOver ? "var(--primary)" : "#c0c8d4",
                display: "block",
                marginBottom: compact ? 4 : 8,
                transition: "color .18s",
              }}
            />
            <div style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: "var(--text2)", marginBottom: 3 }}>
              کلیک کنید یا فایل را اینجا رها کنید
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>
              <kbd style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 3, padding: "1px 5px", fontSize: 10, fontFamily: "monospace" }}>Ctrl+V</kbd>
              {" "}برای چسباندن از کلیپ‌بورد
            </div>
          </>
        )}
      </div>
      {error && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#c0392b", fontWeight: 700 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 11, marginLeft: 4 }} />{error}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />
    </div>
  );
}
