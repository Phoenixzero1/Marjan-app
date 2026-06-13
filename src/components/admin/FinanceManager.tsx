"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

interface Summary {
  totalRevenue: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  todayRevenue: number;
  totalRefunded: number;
  pendingCount: number;
  paidCount: number;
  failedCount: number;
}

interface DailyPoint { date: string; amount: number }

interface Payment {
  id: string;
  amount: number;
  status: string;
  gateway: string;
  refId: string | null;
  paidAt: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    totalAmount: number;
    user: { firstName: string; lastName: string; phone: string | null } | null;
  };
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PAID:     { label: "پرداخت شده",      bg: "#dcfce7", color: "#16a34a" },
  PENDING:  { label: "در انتظار",        bg: "#fff7ed", color: "#ea580c" },
  FAILED:   { label: "ناموفق",           bg: "#fee2e2", color: "#dc2626" },
  REFUNDED: { label: "مسترد شده",        bg: "#f1f5f9", color: "#475569" },
};

function pill(status: string) {
  const s = STATUS_MAP[status] ?? { label: status, bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function StatCard({ label, value, sub, subLabel, icon, accent }: {
  label: string; value: string; sub?: string; subLabel?: string; icon: string; accent: string;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)" }}>{label}</div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className={`ti ${icon}`} style={{ fontSize: 20, color: accent }} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text3)" }}><span style={{ fontWeight: 700 }}>{sub}</span> {subLabel}</div>}
    </div>
  );
}

function MiniBar({ daily }: { daily: DailyPoint[] }) {
  const max = Math.max(...daily.map(d => d.amount), 1);
  const last7 = daily.slice(-7);

  return (
    <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "1.25rem 1.5rem" }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 16 }}>درآمد ۳۰ روز اخیر</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
        {daily.map((d) => {
          const pct = max > 0 ? (d.amount / max) * 100 : 0;
          const isLast7 = last7.some(l => l.date === d.date);
          return (
            <div
              key={d.date}
              title={`${d.date}: ${formatPrice(d.amount)}`}
              style={{
                flex: 1,
                height: `${Math.max(pct, 2)}%`,
                background: isLast7 ? "var(--accent)" : "#bfdbfe",
                borderRadius: "3px 3px 0 0",
                minWidth: 4,
                transition: "height .3s",
                cursor: "default",
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "var(--text3)" }}>
        <span>{daily[0]?.date?.slice(5)}</span>
        <span>{daily[daily.length - 1]?.date?.slice(5)}</span>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent)" }} />
          <span style={{ color: "var(--text3)" }}>۷ روز اخیر</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#bfdbfe" }} />
          <span style={{ color: "var(--text3)" }}>قبل از آن</span>
        </div>
      </div>
    </div>
  );
}

export default function FinanceManager() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (statusFilter) params.set("status", statusFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/admin/finance?${params}`);
      const data = await res.json();
      setSummary(data.summary);
      setDaily(data.daily ?? []);
      setPayments(data.payments ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, from, to]);

  useEffect(() => { load(1); }, [load]);

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const growthPct = summary && summary.lastMonthRevenue > 0
    ? Math.round(((summary.monthRevenue - summary.lastMonthRevenue) / summary.lastMonthRevenue) * 100)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", margin: 0 }}>گزارش مالی</h2>
        <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>خلاصه تراکنش‌ها و درآمد فروشگاه</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          <StatCard
            label="کل درآمد"
            value={formatPrice(summary.totalRevenue)}
            icon="ti-report-money"
            accent="#2563eb"
          />
          <StatCard
            label="درآمد این ماه"
            value={formatPrice(summary.monthRevenue)}
            sub={growthPct !== null ? `${growthPct > 0 ? "+" : ""}${growthPct}%` : undefined}
            subLabel="نسبت به ماه قبل"
            icon="ti-calendar-stats"
            accent="#16a34a"
          />
          <StatCard
            label="درآمد امروز"
            value={formatPrice(summary.todayRevenue)}
            icon="ti-sun"
            accent="#ea580c"
          />
          <StatCard
            label="مسترد شده"
            value={formatPrice(summary.totalRefunded)}
            icon="ti-arrow-back-up"
            accent="#dc2626"
          />
          <StatCard
            label="تراکنش‌های موفق"
            value={summary.paidCount.toLocaleString("fa-IR")}
            sub={`${summary.pendingCount.toLocaleString("fa-IR")} در انتظار`}
            icon="ti-circle-check"
            accent="#16a34a"
          />
          <StatCard
            label="تراکنش‌های ناموفق"
            value={summary.failedCount.toLocaleString("fa-IR")}
            icon="ti-circle-x"
            accent="#dc2626"
          />
        </div>
      )}

      {/* Chart */}
      {daily.length > 0 && <MiniBar daily={daily} />}

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "14px 20px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 10px", fontFamily: "Vazirmatn", fontSize: 13, background: "#fff" }}
        >
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text3)" }}>
          <span>از:</span>
          <DatePicker value={from} onChange={setFrom} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text3)" }}>
          <span>تا:</span>
          <DatePicker value={to} onChange={setTo} />
        </div>
        <button
          onClick={() => load(1)}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontFamily: "Vazirmatn", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          اعمال فیلتر
        </button>
        {(statusFilter || from || to) && (
          <button
            onClick={() => { setStatusFilter(""); setFrom(""); setTo(""); }}
            style={{ background: "var(--surface)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer" }}
          >
            پاک‌سازی فیلتر
          </button>
        )}
        <div style={{ marginRight: "auto", fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          {total.toLocaleString("fa-IR")} تراکنش
        </div>
      </div>

      {/* Transactions table */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 680 }}>
          <thead>
            <tr style={{ background: "var(--surface)", borderBottom: "2px solid var(--border)" }}>
              {["شماره سفارش", "مشتری", "مبلغ", "وضعیت", "درگاه", "کد رهگیری", "تاریخ"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 900, color: "var(--text2)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
                <i className="ti ti-loader-2" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />در حال بارگذاری...
              </td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>تراکنشی یافت نشد</td></tr>
            ) : payments.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "#fff" : "var(--surface)" }}>
                <td style={{ padding: "10px 14px", fontWeight: 900, direction: "ltr", textAlign: "right", fontSize: 12 }}>
                  {p.order.orderNumber}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ fontWeight: 700 }}>{p.order.user ? `${p.order.user.firstName} ${p.order.user.lastName}` : "—"}</div>
                  {p.order.user?.phone && <div style={{ fontSize: 11, color: "var(--text3)", direction: "ltr", textAlign: "right" }}>{p.order.user.phone}</div>}
                </td>
                <td style={{ padding: "10px 14px", fontWeight: 900 }}>{formatPrice(p.amount)}</td>
                <td style={{ padding: "10px 14px" }}>{pill(p.status)}</td>
                <td style={{ padding: "10px 14px", color: "var(--text3)", fontSize: 12 }}>{p.gateway}</td>
                <td style={{ padding: "10px 14px", direction: "ltr", textAlign: "right", fontSize: 12, color: "var(--text3)" }}>
                  {p.refId ?? "—"}
                </td>
                <td style={{ padding: "10px 14px", color: "var(--text3)", whiteSpace: "nowrap", fontSize: 12 }}>
                  {fmtDate(p.paidAt ?? p.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          <button onClick={() => load(page - 1)} disabled={page <= 1} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer", opacity: page <= 1 ? .5 : 1 }}>قبلی</button>
          <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "var(--text2)", padding: "0 8px" }}>
            صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}
          </span>
          <button onClick={() => load(page + 1)} disabled={page >= pages} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer", opacity: page >= pages ? .5 : 1 }}>بعدی</button>
        </div>
      )}
    </div>
  );
}
