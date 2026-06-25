"use client";
import { useState, useEffect } from "react";
import {
  AdminPageHeader, AdminBtn, AdminCard, AdminCardHeader,
  AdminField, AdminInput, AdminTextarea, AdminBadge, AdminEmptyState,
} from "@/components/admin/AdminUI";

interface Faq { id: string; question: string; answer: string; sortOrder: number; isActive: boolean; }

const EMPTY = { question: "", answer: "", sortOrder: 0, isActive: true };

export default function FaqManager() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/faqs").then(r => r.json()).then(setFaqs).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/faqs/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const updated = await res.json();
        setFaqs(f => f.map(x => x.id === editing.id ? updated : x));
      } else {
        const res = await fetch("/api/admin/faqs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const created = await res.json();
        setFaqs(f => [...f, created]);
      }
      setEditing(null); setAdding(false); setForm(EMPTY);
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("حذف این سؤال؟")) return;
    await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    setFaqs(f => f.filter(x => x.id !== id));
  };

  const toggleActive = async (faq: Faq) => {
    await fetch(`/api/admin/faqs/${faq.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !faq.isActive }) });
    setFaqs(f => f.map(x => x.id === faq.id ? { ...x, isActive: !x.isActive } : x));
  };

  const openEdit = (faq: Faq) => { setEditing(faq); setAdding(false); setForm({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder, isActive: faq.isActive }); };

  const showForm = adding || editing;

  return (
    <div>
      <AdminPageHeader
        title="سؤالات متداول"
        icon="ti-help"
        count={faqs.length}
        subtitle={`${faqs.length} سؤال ثبت‌شده`}
        actions={
          <AdminBtn variant="primary" icon="ti-plus" onClick={() => { setAdding(true); setEditing(null); setForm(EMPTY); }}>سؤال جدید</AdminBtn>
        }
      />

      {showForm && (
        <AdminCard style={{ marginBottom: 16 }}>
          <AdminCardHeader title={editing ? "ویرایش سؤال" : "سؤال جدید"} icon="ti-help" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            <AdminField label="سؤال" required>
              <AdminInput value={form.question} onChange={v => setForm(f => ({ ...f, question: v }))} placeholder="سؤال را وارد کنید" />
            </AdminField>
            <AdminField label="پاسخ" required>
              <AdminTextarea value={form.answer} onChange={v => setForm(f => ({ ...f, answer: v }))} rows={4} placeholder="پاسخ را وارد کنید" />
            </AdminField>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <AdminField label="ترتیب نمایش" style={{ width: 100 }}>
                <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none" }} />
              </AdminField>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 1 }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                فعال
              </label>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <AdminBtn variant="primary" icon="ti-device-floppy" loading={saving} onClick={save}>ذخیره</AdminBtn>
              <AdminBtn onClick={() => { setEditing(null); setAdding(false); }}>انصراف</AdminBtn>
            </div>
          </div>
        </AdminCard>
      )}

      {loading ? (
        <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />
      ) : faqs.length === 0 ? (
        <AdminEmptyState icon="ti-help" title="هنوز سؤالی ثبت نشده" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {faqs.map((faq, i) => (
            <div key={faq.id} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ width: 26, height: 26, background: "var(--bg)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "var(--text3)", flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1, fontWeight: 900, fontSize: 14, color: "var(--text)" }}>{faq.question}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <AdminBadge variant={faq.isActive ? "success" : "neutral"} size="xs">{faq.isActive ? "فعال" : "غیرفعال"}</AdminBadge>
                  <AdminBtn size="sm" onClick={() => toggleActive(faq)} variant="ghost">
                    {faq.isActive ? "غیرفعال کن" : "فعال کن"}
                  </AdminBtn>
                  <AdminBtn size="sm" icon="ti-edit" onClick={() => openEdit(faq)} />
                  <AdminBtn size="sm" icon="ti-trash" variant="danger" onClick={() => del(faq.id)} />
                </div>
              </div>
              <div style={{ padding: "10px 16px 12px 16px", fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{faq.answer}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
