"use client";
import { useState, useEffect } from "react";
import {
  AdminPageHeader, AdminBtn, AdminBadge, AdminEmptyState,
} from "@/components/admin/AdminUI";

interface Question {
  id: string; question: string; answer?: string; isApproved: boolean; createdAt: string; answeredAt?: string;
  product: { name: string; slug: string };
  user: { firstName?: string; lastName?: string } | null;
}

export default function ProductQuestionsManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"unanswered" | "all">("unanswered");
  const [answering, setAnswering] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const qs = filter === "unanswered" ? "?unanswered=true" : "";
    fetch(`/api/admin/questions${qs}`).then(r => r.json()).then(d => setQuestions(d.questions ?? [])).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [filter]);

  const submitAnswer = async (id: string) => {
    if (!answerText.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/questions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, answer: answerText, isApproved: true }) });
      setQuestions(q => q.map(x => x.id === id ? { ...x, answer: answerText, isApproved: true, answeredAt: new Date().toISOString() } : x));
      setAnswering(null); setAnswerText("");
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("حذف این سؤال؟")) return;
    await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
    setQuestions(q => q.filter(x => x.id !== id));
  };

  const unansweredCount = questions.filter(q => !q.answer).length;

  return (
    <div>
      <AdminPageHeader
        title="سؤالات محصولات"
        icon="ti-message-question"
        count={questions.length}
        subtitle={unansweredCount > 0 ? `${unansweredCount} سؤال بی‌پاسخ` : undefined}
      />

      <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
        {([["unanswered", `بی‌پاسخ${unansweredCount > 0 ? ` (${unansweredCount})` : ""}`], ["all", "همه"]] as const).map(([val, label]) => (
          <AdminBtn key={val} size="sm" variant={filter === val ? "primary" : "secondary"} onClick={() => setFilter(val)}>
            {label}
          </AdminBtn>
        ))}
      </div>

      {loading ? (
        <AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." />
      ) : questions.length === 0 ? (
        <AdminEmptyState icon="ti-message-question" title="سؤالی یافت نشد" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {questions.map(q => (
            <div key={q.id} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: "var(--primary)" }}>{q.product.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>از: {q.user ? `${q.user.firstName ?? ""} ${q.user.lastName ?? ""}`.trim() || "کاربر" : "کاربر"}</span>
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{new Date(q.createdAt).toLocaleDateString("fa-IR")}</span>
                    {!q.answer && <AdminBadge variant="danger" size="xs">بی‌پاسخ</AdminBadge>}
                    {q.isApproved && <AdminBadge variant="success" size="xs">تأیید‌شده</AdminBadge>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: q.answer ? 8 : 0 }}>
                    <i className="ti ti-help-circle" style={{ marginLeft: 6, color: "var(--accent)" }} />{q.question}
                  </div>
                  {q.answer && (
                    <div style={{ background: "rgba(26,122,74,0.05)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "var(--text2)", borderRight: "3px solid #1a7a4a" }}>
                      <i className="ti ti-arrow-back-up" style={{ marginLeft: 6, color: "#1a7a4a" }} />{q.answer}
                    </div>
                  )}
                  {answering === q.id && (
                    <div style={{ marginTop: 10 }}>
                      <textarea
                        value={answerText}
                        onChange={e => setAnswerText(e.target.value)}
                        rows={3}
                        placeholder="پاسخ را بنویسید..."
                        style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                      />
                      <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                        <AdminBtn size="sm" onClick={() => { setAnswering(null); setAnswerText(""); }}>انصراف</AdminBtn>
                        <AdminBtn size="sm" variant="primary" loading={saving} onClick={() => submitAnswer(q.id)}>ثبت پاسخ</AdminBtn>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {(!answering || answering !== q.id) && (
                    <AdminBtn size="sm" icon="ti-message-reply" variant="ghost" style={{ color: "#1a7a4a", background: "rgba(26,122,74,0.1)" }} onClick={() => { setAnswering(q.id); setAnswerText(q.answer ?? ""); }}>
                      {q.answer ? "ویرایش پاسخ" : "پاسخ دادن"}
                    </AdminBtn>
                  )}
                  <AdminBtn size="sm" icon="ti-trash" variant="danger" onClick={() => del(q.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
