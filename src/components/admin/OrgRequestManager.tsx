"use client";

import { useState, useEffect, useCallback } from "react";

interface OrgRequest {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string | null;
  nationalCode: string | null;
  category: string | null;
  estimatedAmount: string | null;
  description: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "در انتظار بررسی",
  IN_REVIEW: "در حال بررسی",
  APPROVED:  "تأیید شده",
  REJECTED:  "رد شده",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "#e8920a",
  IN_REVIEW: "#2563eb",
  APPROVED:  "#16a34a",
  REJECTED:  "#c0392b",
};

const STATUS_OPTIONS = ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"];

export default function OrgRequestManager() {
  const [requests, setRequests] = useState<OrgRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<OrgRequest | null>(null);
  const [note, setNote] = useState("");
  const [noteStatus, setNoteStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const safeJson = async (r: Response) => {
    const t = await r.text();
    try { return JSON.parse(t); } catch { return null; }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const url = `/api/admin/org-requests${filter ? `?status=${filter}` : ""}`;
    const d = await fetch(url).then(safeJson);
    setRequests(d?.requests ?? []);
    setTotal(d?.total ?? 0);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openDetail = (req: OrgRequest) => {
    setSelected(req);
    setNote(req.adminNote ?? "");
    setNoteStatus(req.status);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const r = await fetch("/api/admin/org-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status: noteStatus, adminNote: note }),
    });
    const d = await safeJson(r);
    setSaving(false);
    if (d?.ok) {
      setRequests((prev) => prev.map((x) => x.id === selected.id ? { ...x, status: noteStatus, adminNote: note } : x));
      setSelected(null);
      showToast("تغییرات ذخیره شد");
    } else {
      showToast("خطا در ذخیره");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: "#1a7a4a", color: "#fff", padding: "12px 28px", borderRadius: 10,
          fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 700, zIndex: 9999,
          boxShadow: "0 6px 24px rgba(0,0,0,.25)",
        }}>
          <i className="ti ti-circle-check" /> {toast}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 500,
          display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
        }} onClick={() => setSelected(null)}>
          <div
            style={{
              width: 460, height: "100vh", background: "#fff", overflowY: "auto",
              padding: "2rem", boxShadow: "-8px 0 40px rgba(0,0,0,.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)" }}>جزئیات درخواست</h3>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text3)" }}>
                <i className="ti ti-x" />
              </button>
            </div>

            {/* Info grid */}
            {[
              { label: "شرکت", val: selected.companyName },
              { label: "مسئول خرید", val: selected.contactName },
              { label: "تلفن", val: selected.phone },
              { label: "ایمیل", val: selected.email ?? "—" },
              { label: "کد ملی/ثبتی", val: selected.nationalCode ?? "—" },
              { label: "دسته محصول", val: selected.category ?? "—" },
              { label: "مبلغ تخمینی", val: selected.estimatedAmount ?? "—" },
              { label: "تاریخ ثبت", val: new Date(selected.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }) },
            ].map((f) => (
              <div key={f.label} style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: 13 }}>
                <span style={{ fontWeight: 900, color: "var(--text2)", minWidth: 90, flexShrink: 0 }}>{f.label}:</span>
                <span style={{ color: "var(--text)" }}>{f.val}</span>
              </div>
            ))}

            {/* Description */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", marginBottom: 6 }}>توضیحات درخواست</div>
              <div style={{ background: "var(--bg)", padding: "12px 14px", borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: "var(--text)" }}>
                {selected.description}
              </div>
            </div>

            {/* Status + note */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>وضعیت</label>
                <select
                  value={noteStatus}
                  onChange={(e) => setNoteStatus(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "Vazirmatn" }}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>یادداشت داخلی</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "Vazirmatn", minHeight: 80, resize: "vertical" }}
                  placeholder="یادداشت برای تیم داخلی..."
                />
              </div>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  background: "var(--primary)", color: "#fff", border: "none", padding: "11px",
                  borderRadius: 8, fontSize: 14, fontWeight: 900, fontFamily: "Vazirmatn",
                  cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <i className={`ti ${saving ? "ti-loader-2" : "ti-device-floppy"}`} />
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)" }}>فیلتر وضعیت:</span>
        {["", ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
              borderColor: filter === s ? "var(--primary)" : "var(--border)",
              background: filter === s ? "var(--primary)" : "#fff",
              color: filter === s ? "#fff" : "var(--text2)",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn",
            }}
          >
            {s ? STATUS_LABELS[s] : `همه (${total})`}
          </button>
        ))}
      </div>

      {/* Request list */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>در حال بارگذاری...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text3)" }}>
            <i className="ti ti-building-off" style={{ fontSize: 48, display: "block", marginBottom: 12 }} />
            <p>درخواستی یافت نشد</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                {["شرکت", "مسئول خرید", "تلفن", "دسته", "تاریخ", "وضعیت", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", fontSize: 12, fontWeight: 900, color: "var(--text3)", textAlign: "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req.id}
                  style={{ borderBottom: "1px solid var(--border)", transition: "background .12s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700 }}>{req.companyName}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text2)" }}>{req.contactName}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text2)", direction: "ltr" }}>{req.phone}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text3)" }}>{req.category ?? "—"}</td>
                  <td style={{ padding: "14px 16px", fontSize: 11, color: "var(--text3)" }}>
                    {new Date(req.createdAt).toLocaleDateString("fa-IR")}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      background: `${STATUS_COLORS[req.status] ?? "#888"}20`,
                      color: STATUS_COLORS[req.status] ?? "#888",
                      fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20,
                    }}>
                      {STATUS_LABELS[req.status] ?? req.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={() => openDetail(req)}
                      style={{
                        background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 6,
                        padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        fontFamily: "Vazirmatn", color: "var(--primary)", display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      <i className="ti ti-eye" /> مشاهده
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
