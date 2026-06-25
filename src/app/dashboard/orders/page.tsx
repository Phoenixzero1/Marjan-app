"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatPrice, getStatusLabel } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: { id: string }[];
  payment?: { status: string } | null;
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((d) => setOrders(d.orders ?? []))
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return <div style={{ textAlign: "center", padding: "5rem", color: "var(--text3)" }}>در حال بارگذاری...</div>;
  }

  return (
    <>
      <div style={{ background: "linear-gradient(135deg,#071d42,#1a3d7c)", padding: "2rem" }}>
        <div style={{ maxWidth: 1280, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: 0 }}>سفارش‌های من</h1>
            <span style={{ color: "rgba(255,255,255,.6)", fontSize: 13 }}>{session?.user?.name}</span>
          </div>
          <Link
            href="/dashboard"
            style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.25)", color: "rgba(255,255,255,.8)", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          >
            <i className="ti ti-layout-dashboard" /> داشبورد
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "auto", padding: "2rem" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "1.5rem", boxShadow: "0 4px 24px rgba(10,42,94,.10)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginBottom: "1.25rem", marginTop: 0 }}>تاریخچه سفارش‌ها</h2>
          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text3)" }}>
              <i className="ti ti-package" style={{ fontSize: 48, display: "block", marginBottom: "1rem" }} />
              <p>هنوز سفارشی ثبت نشده است.</p>
              <Link href="/products" style={{ color: "var(--primary)", fontWeight: 700, fontSize: 14 }}>مشاهده محصولات</Link>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--bg2)" }}>
                  {["شماره سفارش", "تاریخ", "اقلام", "مبلغ", "وضعیت", "عملیات"].map((h) => (
                    <th key={h} style={{ textAlign: "right", padding: "10px", fontWeight: 900, color: "var(--text3)", fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const s = getStatusLabel(o.status);
                  return (
                    <tr key={o.id} style={{ borderBottom: "1px solid var(--bg)" }}>
                      <td style={{ padding: 10, fontWeight: 700 }}>{o.orderNumber}</td>
                      <td style={{ padding: 10, color: "var(--text3)" }}>{new Date(o.createdAt).toLocaleDateString("fa-IR")}</td>
                      <td style={{ padding: 10 }}>{o.items.length} قلم</td>
                      <td style={{ padding: 10, fontWeight: 900, color: "var(--primary)" }}>{formatPrice(o.totalAmount)}</td>
                      <td style={{ padding: 10 }}>
                        <span className={s.class} style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>{s.label}</span>
                      </td>
                      <td style={{ padding: 10 }}>
                        <button style={{ background: "var(--bg2)", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Vazirmatn", color: "var(--primary)" }}>جزئیات</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
