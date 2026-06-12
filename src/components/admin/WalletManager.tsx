"use client";

import { useState, useEffect, useCallback } from "react";

interface WalletStats { activeWallets: number; totalBalance: number; monthCharge: number; }
interface WalletTx {
  id: string; type: string; amount: number; description: string | null;
  refId: string | null; createdAt: string; walletBalance: number;
  user: { firstName: string; lastName: string; email: string | null; phone: string | null } | null;
}
type Toast = { msg: string; ok: boolean };

const TYPE_LABELS: Record<string, { label: string; pill: string; sign: string }> = {
  DEPOSIT:    { label: "شارژ",      pill: "pill-green",  sign: "+" },
  WITHDRAWAL: { label: "برداشت",    pill: "pill-red",    sign: "−" },
  REFUND:     { label: "استرداد",   pill: "pill-blue",   sign: "+" },
  PURCHASE:   { label: "خرید",      pill: "pill-orange", sign: "−" },
};

export default function WalletManager() {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  // Admin charge form
  const [showForm, setShowForm] = useState(false);
  const [formUserId, setFormUserId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState("DEPOSIT");
  const [formDesc, setFormDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (typeFilter) params.set("type", typeFilter);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/wallet?${params}`);
      const data = await res.json();
      if (data.stats) setStats(data.stats);
      setTxs(data.transactions ?? []);
      setTotal(data.pagination?.total ?? 0);
      setPages(data.pagination?.totalPages ?? 1);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, q]);

  useEffect(() => { load(1); }, [load]);

  async function handleAdminTx() {
    if (!formUserId.trim()) { showToast("شناسه کاربر الزامی است", false); return; }
    const amt = parseInt(formAmount);
    if (isNaN(amt) || amt <= 0) { showToast("مبلغ نادرست", false); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: formUserId.trim(), amount: amt, type: formType, description: formDesc }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "خطا", false); return; }
      showToast(`موجودی جدید: ${data.newBalance.toLocaleString("fa-IR")} ریال`);
      setShowForm(false);
      setFormUserId(""); setFormAmount(""); setFormDesc(""); setFormType("DEPOSIT");
      load(1);
    } finally {
      setSubmitting(false);
    }
  }

  const fmt = (n: number) => n.toLocaleString("fa-IR");
  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

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
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>مدیریت کیف پول</h2>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>مشاهده و مدیریت تراکنش‌های کیف پول کاربران</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "9px 16px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <i className="ti ti-plus" /> تراکنش دستی
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { icon: "ti-wallet", color: "#0284c7", val: fmt(stats.activeWallets), label: "کیف پول فعال" },
            { icon: "ti-currency-dollar", color: "#16a34a", val: fmt(stats.totalBalance), label: "مانده کل (ریال)" },
            { icon: "ti-trending-up", color: "#ea580c", val: fmt(stats.monthCharge), label: "شارژ این ماه (ریال)" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className={`ti ${s.icon}`} style={{ fontSize: 24, color: "#fff" }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(1)}
          placeholder="جستجو توضیحات..."
          style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", minWidth: 200 }}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontFamily: "Vazirmatn", fontSize: 13, background: "#fff" }}>
          <option value="">همه انواع</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={() => load(1)} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>اعمال</button>
        <div style={{ marginRight: "auto", fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>{fmt(total)} تراکنش</div>
      </div>

      {/* Transactions table */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
            <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />در حال بارگذاری...
          </div>
        ) : txs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
            <i className="ti ti-wallet-off" style={{ fontSize: 40, display: "block", marginBottom: 8 }} />تراکنشی یافت نشد
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["کاربر", "نوع", "مبلغ (ریال)", "موجودی", "توضیح", "تاریخ"].map(h => (
                  <th key={h} style={{ background: "var(--bg)", padding: "10px 14px", fontSize: 11, fontWeight: 900, color: "var(--text2)", textAlign: "right", borderBottom: "2px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.map((tx, i) => {
                const tm = TYPE_LABELS[tx.type] ?? { label: tx.type, pill: "pill-gray", sign: "" };
                const isPos = tm.sign === "+";
                return (
                  <tr key={tx.id} style={{ borderBottom: i < txs.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "10px 14px" }}>
                      {tx.user ? (
                        <div>
                          <div style={{ fontWeight: 900 }}>{tx.user.firstName} {tx.user.lastName}</div>
                          <div style={{ fontSize: 11, color: "var(--text3)" }}>{tx.user.phone ?? tx.user.email ?? ""}</div>
                        </div>
                      ) : <span style={{ color: "var(--text3)" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span className={tm.pill} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{tm.label}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 900, color: isPos ? "#16a34a" : "#dc2626" }}>
                      {tm.sign}{fmt(tx.amount)}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--text3)", fontSize: 12 }}>
                      {fmt(tx.walletBalance)}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--text3)", fontSize: 12 }}>{tx.description ?? "—"}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text3)", fontSize: 11, whiteSpace: "nowrap" }}>{fmtDate(tx.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          <button onClick={() => load(page - 1)} disabled={page <= 1} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer", opacity: page <= 1 ? .5 : 1 }}>قبلی</button>
          <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "var(--text2)", padding: "0 8px" }}>{page} از {pages}</span>
          <button onClick={() => load(page + 1)} disabled={page >= pages} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer", opacity: page >= pages ? .5 : 1 }}>بعدی</button>
        </div>
      )}

      {/* Admin transaction modal */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9990 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: "var(--radius)", boxShadow: "0 12px 48px rgba(0,0,0,.25)", width: 420, maxWidth: "95vw", zIndex: 9991, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--primary)", borderRadius: "var(--radius) var(--radius) 0 0" }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}><i className="ti ti-wallet" /> تراکنش دستی کیف پول</span>
              <button onClick={() => setShowForm(false)} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-x" />
              </button>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>شناسه کاربر (userId) *</label>
                <input value={formUserId} onChange={e => setFormUserId(e.target.value)} placeholder="UUID کاربر..." style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "monospace", fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box", direction: "ltr" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>نوع</label>
                  <select value={formType} onChange={e => setFormType(e.target.value)} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 10px", fontFamily: "Vazirmatn", fontSize: 13, width: "100%", background: "#fff" }}>
                    <option value="DEPOSIT">شارژ (واریز)</option>
                    <option value="WITHDRAWAL">برداشت</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>مبلغ (ریال) *</label>
                  <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="مثال: 500000" style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", direction: "ltr" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text2)", display: "block", marginBottom: 5 }}>توضیح (اختیاری)</label>
                <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="علت تراکنش..." style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "Vazirmatn", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  onClick={handleAdminTx}
                  disabled={submitting}
                  style={{ flex: 1, background: submitting ? "#aaa" : "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "11px 0", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 900, cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  {submitting ? "در حال ثبت..." : "ثبت تراکنش"}
                </button>
                <button onClick={() => setShowForm(false)} style={{ background: "var(--bg)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "11px 18px", fontFamily: "Vazirmatn", fontSize: 14, cursor: "pointer" }}>
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
