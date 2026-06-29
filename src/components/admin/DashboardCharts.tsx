"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

function useIsMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export interface ChartDay { label: string; value: number; isFriday?: boolean; isFuture?: boolean }

// ─── Tooltip ────────────────────────────────────────────────────────────────
interface TipPayload { value: number; payload: ChartDay }
function RevenueTooltip({ active, payload }: { active?: boolean; payload?: TipPayload[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0];
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(7,29,66,0.16)", padding: "9px 13px", fontFamily: "Vazirmatn", direction: "rtl" }}>
      <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, marginBottom: 3 }}>{p.payload.label}</div>
      <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>
        {p.value.toLocaleString("fa-IR")} <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)" }}>تومان</span>
      </div>
    </div>
  );
}

// ─── Main revenue area chart ──────────────────────────────────────────────────
export function RevenueAreaChart({ data }: { data: ChartDay[] }) {
  const mounted = useIsMounted();
  if (!mounted) return <div style={{ width: "100%", height: 300 }} />;
  return (
    <div style={{ width: "100%", height: 300, direction: "ltr" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="revStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(10,42,94,0.06)" vertical={false} />
          <XAxis
            dataKey="label" tick={{ fontSize: 10, fill: "rgba(74,85,120,0.7)", fontFamily: "Vazirmatn" }}
            axisLine={{ stroke: "rgba(10,42,94,0.10)" }} tickLine={false} minTickGap={20}
          />
          <YAxis
            width={42} tick={{ fontSize: 9, fill: "rgba(74,85,120,0.55)", fontFamily: "Vazirmatn" }}
            axisLine={false} tickLine={false}
            tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))}
          />
          <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "var(--accent)", strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Area
            type="monotone" dataKey="value" stroke="url(#revStroke)" strokeWidth={2.5}
            fill="url(#revGrad)" fillOpacity={1}
            dot={{ r: 3, fill: "#fff", stroke: "var(--primary)", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "var(--accent)", stroke: "#fff", strokeWidth: 2 }}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Order-status donut ───────────────────────────────────────────────────────
export interface DonutSlice { name: string; value: number; color: string }
export function OrderStatusDonut({ slices, total }: { slices: DonutSlice[]; total: number }) {
  const mounted = useIsMounted();
  const hasData = slices.some((s) => s.value > 0);
  if (!mounted) return <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 128, height: 128, flexShrink: 0 }} /></div>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 128, height: 128, position: "relative", flexShrink: 0, direction: "ltr" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={hasData ? slices : [{ name: "—", value: 1, color: "rgba(10,42,94,0.08)" }]}
              dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={60}
              paddingAngle={hasData ? 3 : 0} startAngle={90} endAngle={-270}
              stroke="none" animationDuration={800}
            >
              {(hasData ? slices : [{ name: "—", value: 1, color: "rgba(10,42,94,0.08)" }]).map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)", lineHeight: 1 }}>{total.toLocaleString("fa-IR")}</div>
          <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>کل</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: i < slices.length - 1 ? 9 : 0 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 11.5, color: "var(--text2)", fontWeight: 700 }}>{s.name}</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: s.color }}>{s.value.toLocaleString("fa-IR")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI sparkline (tiny area) ────────────────────────────────────────────────
export function KpiSparkline({ data, color = "var(--primary)" }: { data: ChartDay[]; color?: string }) {
  const mounted = useIsMounted();
  if (!data || data.length === 0) return null;
  if (!mounted) return <div style={{ width: 64, height: 28 }} />;
  return (
    <div style={{ width: 64, height: 28, direction: "ltr" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
