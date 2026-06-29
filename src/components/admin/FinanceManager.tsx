"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DatePicker from "@/components/ui/DatePicker";
import { formatPrice } from "@/lib/utils";
import {
  AdminPageHeader, AdminToolbar, AdminSelect, AdminBtn, AdminTabs,
  AdminTable, AdminTh, AdminTd, AdminTr, AdminBadge, AdminEmptyState, AdminPagination,
} from "@/components/admin/AdminUI";
import { RevenueAreaChart } from "@/components/admin/DashboardCharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Summary {
  totalRevenue: number; monthRevenue: number; lastMonthRevenue: number;
  todayRevenue: number; totalRefunded: number;
  pendingCount: number; paidCount: number; failedCount: number;
}
interface DailyPoint { date: string; amount: number }
interface Payment {
  id: string; amount: number; status: string; gateway: string;
  refId: string | null; paidAt: string | null; createdAt: string;
  order: { orderNumber: string; totalAmount: number; user: { firstName: string; lastName: string; phone: string | null } | null };
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PAID:     { label: "پرداخت شده", bg: "rgba(22,163,74,0.10)",  color: "#16a34a" },
  PENDING:  { label: "در انتظار",  bg: "rgba(234,88,12,0.10)",  color: "#ea580c" },
  FAILED:   { label: "ناموفق",     bg: "rgba(220,38,38,0.10)",  color: "#dc2626" },
  REFUNDED: { label: "مسترد",      bg: "rgba(71,85,105,0.10)",  color: "#475569" },
};
const STATUS_BADGE: Record<string, "success"|"warning"|"danger"|"neutral"> = {
  PAID: "success", PENDING: "warning", FAILED: "danger", REFUNDED: "neutral",
};

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const dur = 1000, t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(e * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return <>{val.toLocaleString("fa-IR")}{suffix}</>;
}

// ─── SVG helpers ──────────────────────────────────────────────────────────────
function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const sx = cx + r * Math.cos(rad(startDeg));
  const sy = cy + r * Math.sin(rad(startDeg));
  const ex = cx + r * Math.cos(rad(endDeg));
  const ey = cy + r * Math.sin(rad(endDeg));
  return `M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`;
}

// ─── Widget 1: Animated Semi-circle Gauge (matches reference HealthScore) ─────
const GAUGE_W = 180; const GAUGE_H = 110;
const ARC_R = 70;   const ARC_CX = 90; const ARC_CY = 95; const ARC_STROKE = 12;
const HALF_CIRC = Math.PI * ARC_R;

function PaymentGauge({ paidCount, totalCount, failedCount, pendingCount }: {
  paidCount: number; totalCount: number; failedCount: number; pendingCount: number;
}) {
  const score = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
  const arcPath = describeArc(ARC_CX, ARC_CY, ARC_R, -180, 0);
  const arcRef = useRef<SVGPathElement>(null);

  const getGrad = (s: number) => {
    if (s >= 80) return { from: "#10b981", to: "#34d399" };
    if (s >= 60) return { from: "var(--primary)", to: "#60a5fa" };
    if (s >= 40) return { from: "var(--accent)", to: "#fbbf24" };
    return { from: "#ef4444", to: "#f87171" };
  };
  const getLabel = (s: number) => s >= 80 ? "عالی" : s >= 60 ? "خوب" : s >= 40 ? "متوسط" : "ضعیف";
  const { from, to } = getGrad(score);
  const scoreGap = HALF_CIRC * (1 - score / 100);

  useEffect(() => {
    if (!arcRef.current) return;
    arcRef.current.style.strokeDashoffset = String(HALF_CIRC);
    const id = setTimeout(() => {
      if (arcRef.current) arcRef.current.style.strokeDashoffset = String(scoreGap);
    }, 150);
    return () => clearTimeout(id);
  }, [scoreGap]);

  const factors = [
    { label: "پرداخت موفق", val: paidCount, max: totalCount, color: "#16a34a" },
    { label: "در انتظار",    val: pendingCount, max: totalCount, color: "var(--accent)" },
    { label: "ناموفق",       val: failedCount,  max: totalCount, color: "#ef4444" },
  ];

  return (
    <div className="admin-card" style={{ padding: "1.25rem" }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <i className="ti ti-heart-rate-monitor" style={{ color: "var(--accent)", fontSize: 16 }} />
        نرخ موفقیت پرداخت
      </div>

      {/* Gauge — fixed-size SVG, score overlaid as absolute div (matches reference) */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          {/* Soft glow */}
          <div style={{ position: "absolute", top: 0, width: 140, height: 70, borderRadius: "70px 70px 0 0", background: `radial-gradient(ellipse, ${from}20 0%, transparent 70%)` }} />
          <svg width={GAUGE_W} height={GAUGE_H} viewBox={`0 0 ${GAUGE_W} ${GAUGE_H}`} style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor={from} stopOpacity={0.25} />
                <stop offset="50%" stopColor={from} />
                <stop offset="100%" stopColor={to} />
              </linearGradient>
              <filter id="gaugeGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* Track */}
            <path d={arcPath} fill="none" stroke="rgba(10,42,94,0.10)" strokeWidth={ARC_STROKE} strokeLinecap="round" />
            {/* Score arc */}
            <path
              ref={arcRef}
              d={arcPath}
              fill="none"
              stroke={`url(#gaugeGrad)`}
              strokeWidth={ARC_STROKE}
              strokeLinecap="round"
              strokeDasharray={String(HALF_CIRC)}
              className="fin-gauge-arc"
              filter="url(#gaugeGlow)"
            />
            {/* Scale labels */}
            <text x={ARC_CX - ARC_R - 2} y={ARC_CY + 14} textAnchor="middle" fontSize={9} fill="rgba(74,85,120,0.4)">۰</text>
            <text x={ARC_CX}              y={ARC_CY - ARC_R - 6} textAnchor="middle" fontSize={9} fill="rgba(74,85,120,0.4)">۵۰</text>
            <text x={ARC_CX + ARC_R + 2} y={ARC_CY + 14} textAnchor="middle" fontSize={9} fill="rgba(74,85,120,0.4)">۱۰۰</text>
          </svg>
          {/* Score overlay — absolute div over arc center (reference style) */}
          <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: 90 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: from, lineHeight: 1 }}>
              <Counter target={score} suffix="٪" />
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2, fontWeight: 700 }}>{getLabel(score)}</div>
          </div>
        </div>
      </div>

      {/* Factor bars */}
      {factors.map((f, i) => (
        <div key={i} className="fin-factor-row" style={{ marginBottom: i < factors.length - 1 ? 10 : 0, animationDelay: `${0.8 + i * 0.08}s` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
            <span style={{ color: "var(--text2)", fontWeight: 700 }}>{f.label}</span>
            <span style={{ fontWeight: 900, color: f.color }}>{f.val.toLocaleString("fa-IR")}</span>
          </div>
          <div style={{ height: 5, background: "rgba(10,42,94,0.07)", borderRadius: 4, overflow: "hidden" }}>
            <div className="fin-progress-bar" style={{ height: "100%", width: f.max > 0 ? `${Math.round((f.val / f.max) * 100)}%` : "0%", background: f.color, borderRadius: 4, transitionDelay: `${0.9 + i * 0.1}s` }} />
          </div>
        </div>
      ))}

      <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(10,42,94,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "var(--text3)", fontWeight: 700 }}>کل تراکنش‌ها</span>
        <span style={{ fontWeight: 900, color: "var(--primary)" }}>{totalCount.toLocaleString("fa-IR")}</span>
      </div>
    </div>
  );
}

// ─── Widget 2: Financial Overview — recharts area chart (matches dashboard) ────
function FinancialOverviewChart({ daily }: { daily: DailyPoint[] }) {
  const chartData = daily.map(d => ({
    label: new Date(d.date).toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
    value: d.amount,
  }));

  const total = daily.reduce((s, d) => s + d.amount, 0);
  const half = Math.floor(daily.length / 2);
  const prevTotal = daily.slice(0, half).reduce((s, d) => s + d.amount, 0);
  const currTotal = daily.slice(half).reduce((s, d) => s + d.amount, 0);
  const change = prevTotal > 0 ? Math.round(((currTotal - prevTotal) / prevTotal) * 100) : 0;

  return (
    <div className="admin-card" style={{ padding: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(10,42,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-chart-area" style={{ fontSize: 16, color: "var(--primary)" }} />
            </div>
            نمای کلی مالی — ۳۰ روز اخیر
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6, marginRight: 40 }}>
            مجموع درآمد: <strong style={{ color: "var(--primary)" }}>{(total / 1_000_000).toFixed(1)}M تومان</strong>
          </div>
        </div>
        {daily.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20,
            background: change >= 0 ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)",
            color: change >= 0 ? "#16a34a" : "#dc2626",
            fontSize: 12, fontWeight: 900,
          }}>
            <i className={`ti ${change >= 0 ? "ti-trending-up" : "ti-trending-down"}`} style={{ fontSize: 13 }} />
            {change > 0 ? "+" : ""}{change}٪
          </div>
        )}
      </div>

      {daily.length === 0 ? (
        <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", flexDirection: "column", gap: 8 }}>
          <i className="ti ti-loader-2" style={{ fontSize: 28, opacity: 0.4 }} />
          <span style={{ fontSize: 12 }}>در حال بارگذاری...</span>
        </div>
      ) : (
        <RevenueAreaChart data={chartData} />
      )}
    </div>
  );
}

// ─── Widget 3: Money Movement — bar chart ─────────────────────────────────────
function MoneyMovement({ daily, totalRefunded }: { daily: DailyPoint[]; totalRefunded: number }) {
  const [period, setPeriod] = useState<7 | 14 | 30>(7);
  const slice = daily.slice(-period);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 120); return () => clearTimeout(t); }, []);

  const totalIn = slice.reduce((s, d) => s + d.amount, 0);
  const maxVal = Math.max(...slice.map(d => d.amount), 1);

  return (
    <div className="admin-card" style={{ padding: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-arrows-exchange-2" style={{ color: "var(--accent)", fontSize: 16 }} />
          جریان پرداخت
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {([7, 14, 30] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 900, fontFamily: "Vazirmatn", cursor: "pointer", border: "none", background: period === p ? "var(--primary)" : "rgba(10,42,94,0.06)", color: period === p ? "#fff" : "var(--text3)", transition: "all 0.15s" }}>
              {p}ر
            </button>
          ))}
        </div>
      </div>

      {/* Summary chips (like MoneyMovement component) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(22,163,74,0.08)", borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(22,163,74,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-arrow-down-left" style={{ color: "#16a34a", fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: "rgba(22,163,74,0.7)", fontWeight: 700, marginBottom: 1 }}>ورودی</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#16a34a" }}>{(totalIn / 1_000_000).toFixed(1)}M</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(220,38,38,0.07)", borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(220,38,38,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-arrow-up-right" style={{ color: "#dc2626", fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: "rgba(220,38,38,0.6)", fontWeight: 700, marginBottom: 1 }}>مسترد</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#dc2626" }}>{(totalRefunded / 1000).toLocaleString("fa-IR")}K</div>
          </div>
        </div>
      </div>

      {/* Net flow row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(10,42,94,0.04)", borderRadius: 10, marginBottom: 14, border: "1px solid var(--border)", fontSize: 12 }}>
        <span style={{ color: "var(--text3)", fontWeight: 700 }}>خالص جریان</span>
        <span style={{ fontWeight: 900, color: "#16a34a" }}>+{((totalIn - totalRefunded) / 1_000_000).toFixed(1)}M</span>
      </div>

      {/* Bar chart — fixed height, date labels as HTML below */}
      {(() => {
        const BW = 320; const BH = 140;
        const barPad = { t: 8, r: 4, b: 0, l: 4 };
        const bw = BW - barPad.l - barPad.r;
        const bh = BH - barPad.t - barPad.b;
        const barW = Math.max(bw / slice.length - 3, 6);
        const labelIndices = slice.length > 0 ? [0, Math.floor(slice.length / 2), slice.length - 1] : [];
        return (
          <>
            <svg viewBox={`0 0 ${BW} ${BH}`} style={{ width: "100%", height: "160px" }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="mmBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--primary)" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0.5, 1].map(f => (
                <line key={f} x1={barPad.l} x2={BW - barPad.r}
                  y1={barPad.t + bh * (1 - f)} y2={barPad.t + bh * (1 - f)}
                  stroke="rgba(10,42,94,0.06)" strokeWidth={1} strokeDasharray="3 3" />
              ))}
              {slice.map((d, i) => {
                const pct = maxVal > 0 ? (d.amount / maxVal) : 0.03;
                const barH = Math.max(bh * pct, 4);
                const x = barPad.l + (i / slice.length) * bw + (bw / slice.length - barW) / 2;
                const y = barPad.t + bh - barH;
                return (
                  <g key={i}>
                    {/* Background track bar */}
                    <rect x={x} y={barPad.t} width={barW} height={bh} fill="rgba(10,42,94,0.04)" rx={3} />
                    {/* Gradient bar with CSS transition */}
                    <rect
                      x={x} y={mounted ? y : barPad.t + bh} width={barW}
                      height={mounted ? barH : 0} fill="url(#mmBarGrad)" rx={3}
                      style={{ transition: `y 0.65s cubic-bezier(0.4,0,0.2,1) ${i * 0.03}s, height 0.65s cubic-bezier(0.4,0,0.2,1) ${i * 0.03}s` }}
                    />
                  </g>
                );
              })}
            </svg>
            {/* X-axis date labels — HTML below SVG */}
            {slice.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 8, color: "rgba(74,85,120,0.5)" }}>
                {labelIndices.map(i => (
                  <span key={i}>{slice[i]?.date?.slice(5)}</span>
                ))}
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

// ─── Widget 4: Revenue KPI card ───────────────────────────────────────────────
function KpiCard({ label, rawValue, icon, iconBg, iconColor, change, changeDir, sub, idx }: {
  label: string; rawValue: number; icon: string; iconBg: string; iconColor: string;
  change?: string; changeDir?: "up" | "down"; sub?: string; idx: number;
}) {
  const changeColor = changeDir === "up" ? "#16a34a" : "#dc2626";
  const changeIcon = changeDir === "up" ? "ti-trending-up" : "ti-trending-down";
  return (
    <div className="admin-stat fin-kpi-card" style={{ animationDelay: `${idx * 0.07}s` }}>
      <div style={{ position: "absolute", top: 12, left: 12, opacity: 0.35, zIndex: 1 }}>
        <i className="ti ti-arrow-up-right" style={{ fontSize: 11, color: "var(--text3)" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, position: "relative", zIndex: 1 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 17, color: iconColor }} />
        </div>
        <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, lineHeight: 1.3 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "var(--primary)", lineHeight: 1, marginBottom: 10, position: "relative", zIndex: 1 }}>
        <Counter target={Math.round(rawValue / 1000)} suffix="K" />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)", position: "relative", zIndex: 1 }}>
        {change && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 900, color: changeColor }}>
            <i className={`ti ${changeIcon}`} style={{ fontSize: 12 }} />
            {change}
          </div>
        )}
        {sub && <div style={{ fontSize: 10, color: "var(--text3)", marginRight: change ? 0 : "auto" }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Monthly target gauge (SpendingLimit style) ───────────────────────────────
function MonthlyTarget({ monthRevenue, lastMonthRevenue, todayRevenue }: {
  monthRevenue: number; lastMonthRevenue: number; todayRevenue: number;
}) {
  const target = Math.round(lastMonthRevenue * 1.15) || 10_000_000;
  const pct = Math.min(Math.round((monthRevenue / target) * 100), 100);
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimPct(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="admin-card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)", display: "flex", alignItems: "center", gap: 7 }}>
          <i className="ti ti-target" style={{ color: "var(--accent)", fontSize: 16 }} />
          هدف ماهانه
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: "rgba(10,42,94,0.06)", fontSize: 10, fontWeight: 900, color: "var(--primary)" }}>
          <i className="ti ti-shield-check" style={{ fontSize: 11 }} /> {animPct}٪
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 3 }}>هدف</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)", lineHeight: 1 }}>
          {(target / 1_000_000).toFixed(0)}M
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text3)", marginRight: 4 }}>تومان</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, background: "rgba(10,42,94,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
        <div className="fin-progress-bar" style={{ height: "100%", width: `${animPct}%`, background: `linear-gradient(90deg, var(--accent), var(--primary))`, borderRadius: 8 }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 9, color: "var(--text3)", marginBottom: 2 }}>تاکنون</div>
          <div style={{ fontWeight: 900, color: "var(--primary)" }}>{(monthRevenue / 1_000_000).toFixed(1)}M</div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 9, color: "var(--text3)", marginBottom: 2 }}>مانده</div>
          <div style={{ fontWeight: 900, color: "#16a34a" }}>{Math.max((target - monthRevenue) / 1_000_000, 0).toFixed(1)}M</div>
        </div>
      </div>

      <div style={{ padding: "8px 12px", background: "rgba(10,42,94,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span style={{ color: "var(--text3)", fontWeight: 700 }}>امروز</span>
        <span style={{ fontWeight: 900, color: "var(--accent)" }}>{(todayRevenue / 1_000).toFixed(0)}K</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const [tab, setTab] = useState<"overview" | "chart" | "payments">("overview");

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
    } finally { setLoading(false); }
  }, [statusFilter, from, to]);

  useEffect(() => { load(1); }, [load]);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const growthPct = summary && summary.lastMonthRevenue > 0
    ? Math.round(((summary.monthRevenue - summary.lastMonthRevenue) / summary.lastMonthRevenue) * 100)
    : null;

  const avgOrder = summary && summary.paidCount > 0
    ? Math.round(summary.totalRevenue / summary.paidCount)
    : 0;

  if (!summary && loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", flexDirection: "column", gap: 12, color: "var(--text3)" }}>
      <i className="ti ti-loader-2" style={{ fontSize: 36, opacity: 0.4 }} />
      <span style={{ fontSize: 13 }}>در حال بارگذاری گزارش مالی...</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Header ── */}
      <AdminPageHeader
        title="گزارش مالی"
        icon="ti-report-money"
        count={total}
        subtitle="تحلیل جامع تراکنش‌ها و درآمد فروشگاه"
        actions={<AdminBtn icon="ti-file-spreadsheet">خروجی Excel</AdminBtn>}
      />

      {/* ── Tabs ── */}
      <AdminTabs
        tabs={[
          { id: "overview", label: "خلاصه", icon: "ti-chart-pie" },
          { id: "chart", label: "نمودار درآمد", icon: "ti-chart-area" },
          { id: "payments", label: "تراکنش‌ها", icon: "ti-receipt", badge: total },
        ]}
        active={tab}
        onChange={(id) => setTab(id as "overview" | "chart" | "payments")}
      />

      {/* ═══ TAB: OVERVIEW — KPIs + summary widgets ═══ */}
      {tab === "overview" && (
        <>
          {summary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
              <KpiCard idx={0} label="کل درآمد" rawValue={summary.totalRevenue}
                icon="ti-report-money" iconBg="rgba(10,42,94,0.10)" iconColor="var(--primary)"
                sub="از ابتدا تاکنون" />
              <KpiCard idx={1} label="درآمد این ماه" rawValue={summary.monthRevenue}
                icon="ti-calendar-stats" iconBg="rgba(22,163,74,0.10)" iconColor="#16a34a"
                change={growthPct !== null ? `${growthPct > 0 ? "+" : ""}${growthPct}٪ vs ماه قبل` : undefined}
                changeDir={growthPct == null ? undefined : growthPct >= 0 ? "up" : "down"} />
              <KpiCard idx={2} label="درآمد امروز" rawValue={summary.todayRevenue}
                icon="ti-sun" iconBg="rgba(232,146,10,0.10)" iconColor="var(--accent)"
                sub="لحظه‌ای" />
              <KpiCard idx={3} label="میانگین سفارش" rawValue={avgOrder}
                icon="ti-chart-arrows-vertical" iconBg="rgba(124,58,237,0.10)" iconColor="#7c3aed"
                sub={`${summary.paidCount.toLocaleString("fa-IR")} سفارش موفق`} />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1.25rem" }}>
            <MoneyMovement daily={daily} totalRefunded={summary?.totalRefunded ?? 0} />
            {summary && (
              <PaymentGauge
                paidCount={summary.paidCount}
                totalCount={total || summary.paidCount + summary.pendingCount + summary.failedCount}
                failedCount={summary.failedCount}
                pendingCount={summary.pendingCount}
              />
            )}
            {summary && (
              <MonthlyTarget
                monthRevenue={summary.monthRevenue}
                lastMonthRevenue={summary.lastMonthRevenue}
                todayRevenue={summary.todayRevenue}
              />
            )}
          </div>
        </>
      )}

      {/* ═══ TAB: CHART — daily revenue overview ═══ */}
      {tab === "chart" && (
        <FinancialOverviewChart daily={daily} />
      )}

      {/* ═══ TAB: PAYMENTS — filters + transactions table ═══ */}
      {tab === "payments" && (
        <>
          <AdminToolbar>
            <AdminSelect value={statusFilter} onChange={v => setStatusFilter(v)}>
              <option value="">همه وضعیت‌ها</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </AdminSelect>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text3)" }}>
              <span>از:</span>
              <div style={{ width: 140 }}><DatePicker value={from} onChange={setFrom} placeholder="از تاریخ" inputStyle={{ height: 34, padding: "0 8px 0 32px", fontSize: 12 }} /></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text3)" }}>
              <span>تا:</span>
              <div style={{ width: 140 }}><DatePicker value={to} onChange={setTo} placeholder="تا تاریخ" inputStyle={{ height: 34, padding: "0 8px 0 32px", fontSize: 12 }} /></div>
            </div>
            <AdminBtn icon="ti-search" onClick={() => load(1)}>اعمال</AdminBtn>
            {(statusFilter || from || to) && (
              <AdminBtn icon="ti-x" variant="ghost" onClick={() => { setStatusFilter(""); setFrom(""); setTo(""); }}>پاک</AdminBtn>
            )}
            <span style={{ marginRight: "auto", fontSize: 12, color: "var(--text3)", fontWeight: 700 }}>
              {total.toLocaleString("fa-IR")} تراکنش
            </span>
          </AdminToolbar>

          <AdminTable>
            <thead>
              <tr>
                <AdminTh>شماره سفارش</AdminTh>
                <AdminTh>مشتری</AdminTh>
                <AdminTh>مبلغ</AdminTh>
                <AdminTh>وضعیت</AdminTh>
                <AdminTh>درگاه</AdminTh>
                <AdminTh>کد رهگیری</AdminTh>
                <AdminTh>تاریخ</AdminTh>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7}><AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /></td></tr>
              )}
              {!loading && payments.length === 0 && (
                <tr><td colSpan={7}><AdminEmptyState icon="ti-inbox" title="تراکنشی یافت نشد" /></td></tr>
              )}
              {payments.map(p => (
                <AdminTr key={p.id}>
                  <AdminTd>
                    <span style={{ fontWeight: 900, direction: "ltr", display: "inline-block", fontSize: 12, color: "var(--primary)" }}>{p.order.orderNumber}</span>
                  </AdminTd>
                  <AdminTd>
                    <div style={{ fontWeight: 700 }}>{p.order.user ? `${p.order.user.firstName} ${p.order.user.lastName}` : "—"}</div>
                    {p.order.user?.phone && <div style={{ fontSize: 11, color: "var(--text3)", direction: "ltr" }}>{p.order.user.phone}</div>}
                  </AdminTd>
                  <AdminTd><span style={{ fontWeight: 900 }}>{formatPrice(p.amount)}</span></AdminTd>
                  <AdminTd>
                    <AdminBadge variant={STATUS_BADGE[p.status] ?? "neutral"} size="xs">
                      {STATUS_MAP[p.status]?.label ?? p.status}
                    </AdminBadge>
                  </AdminTd>
                  <AdminTd style={{ color: "var(--text3)", fontSize: 12 }}>{p.gateway}</AdminTd>
                  <AdminTd style={{ direction: "ltr", textAlign: "right" as const, fontSize: 12, color: "var(--text3)" }}>{p.refId ?? "—"}</AdminTd>
                  <AdminTd style={{ color: "var(--text3)", whiteSpace: "nowrap", fontSize: 11 }}>{fmtDate(p.paidAt ?? p.createdAt)}</AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>

          {pages > 1 && (
            <AdminPagination page={page} total={total} pageSize={Math.ceil(total / pages)} onChange={p => load(p)} />
          )}
        </>
      )}
    </div>
  );
}
