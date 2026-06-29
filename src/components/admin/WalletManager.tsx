"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AdminPageHeader, AdminToolbar, AdminSearch, AdminSelect, AdminBtn,
  AdminTable, AdminTh, AdminTd, AdminTr, AdminBadge, AdminEmptyState,
  AdminStatCard, AdminModal, AdminField, AdminInput, AdminInputSelect,
  AdminPagination, AdminToast, useAdminToast,
} from "@/components/admin/AdminUI";

interface WalletStats { activeWallets: number; totalBalance: number; monthCharge: number; }
interface WalletTx {
  id: string; type: string; amount: number; description: string | null;
  refId: string | null; createdAt: string; walletBalance: number;
  user: { firstName: string; lastName: string; email: string | null; phone: string | null } | null;
}

const TYPE_META: Record<string, { label: string; variant: "success" | "danger" | "info" | "orange"; sign: string }> = {
  DEPOSIT:    { label: "شارژ",    variant: "success", sign: "+" },
  WITHDRAWAL: { label: "برداشت",  variant: "danger",  sign: "−" },
  REFUND:     { label: "استرداد", variant: "info",    sign: "+" },
  PURCHASE:   { label: "خرید",    variant: "orange",  sign: "−" },
};

const PAGE_SIZE = 25;

export default function WalletManager() {
  const { toast, showToast } = useAdminToast();
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formUserId, setFormUserId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState("DEPOSIT");
  const [formDesc, setFormDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    } finally { setLoading(false); }
  }, [typeFilter, q]);

  useEffect(() => { load(1); }, [load]);

  async function handleAdminTx() {
    if (!formUserId.trim()) { showToast("error", "شناسه کاربر الزامی است"); return; }
    const amt = parseInt(formAmount);
    if (isNaN(amt) || amt <= 0) { showToast("error", "مبلغ نادرست"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: formUserId.trim(), amount: amt, type: formType, description: formDesc }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "خطا"); return; }
      showToast("success", `موجودی جدید: ${data.newBalance.toLocaleString("fa-IR")} ریال`);
      setShowForm(false);
      setFormUserId(""); setFormAmount(""); setFormDesc(""); setFormType("DEPOSIT");
      load(1);
    } finally { setSubmitting(false); }
  }

  const fmt = (n: number) => n.toLocaleString("fa-IR");
  const fmtDate = (s: string) => new Date(s).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <AdminToast toast={toast} />

      <AdminPageHeader title="مدیریت کیف پول" icon="ti-wallet" count={total}
        subtitle="مشاهده و مدیریت تراکنش‌های کیف پول کاربران"
        actions={<AdminBtn icon="ti-plus" variant="primary" onClick={() => setShowForm(true)}>تراکنش دستی</AdminBtn>}
      />

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
          <AdminStatCard icon="ti-wallet" label="کیف پول فعال" value={fmt(stats.activeWallets)} color="#0284c7" />
          <AdminStatCard icon="ti-currency-dollar" label="مانده کل (ریال)" value={fmt(stats.totalBalance)} color="#16a34a" />
          <AdminStatCard icon="ti-trending-up" label="شارژ این ماه (ریال)" value={fmt(stats.monthCharge)} color="#ea580c" />
        </div>
      )}

      <AdminToolbar>
        <AdminSearch value={q} onChange={setQ} placeholder="جستجو توضیحات..." />
        <AdminSelect value={typeFilter} onChange={setTypeFilter}>
          <option value="">همه انواع</option>
          {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </AdminSelect>
        <AdminBtn icon="ti-refresh" onClick={() => load(1)}>اعمال</AdminBtn>
        <span style={{ fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>{fmt(total)} تراکنش</span>
      </AdminToolbar>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>کاربر</AdminTh>
            <AdminTh>نوع</AdminTh>
            <AdminTh>مبلغ (ریال)</AdminTh>
            <AdminTh>موجودی</AdminTh>
            <AdminTh>توضیح</AdminTh>
            <AdminTh>تاریخ</AdminTh>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={6}><AdminEmptyState icon="ti-loader-2" title="در حال بارگذاری..." /></td></tr>}
          {!loading && txs.length === 0 && <tr><td colSpan={6}><AdminEmptyState icon="ti-wallet-off" title="تراکنشی یافت نشد" /></td></tr>}
          {txs.map(tx => {
            const tm = TYPE_META[tx.type] ?? { label: tx.type, variant: "neutral" as const, sign: "" };
            const isPos = tm.sign === "+";
            return (
              <AdminTr key={tx.id}>
                <AdminTd>
                  {tx.user ? (
                    <div>
                      <div style={{ fontWeight: 900 }}>{tx.user.firstName} {tx.user.lastName}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{tx.user.phone ?? tx.user.email ?? ""}</div>
                    </div>
                  ) : <span style={{ color: "var(--text3)" }}>—</span>}
                </AdminTd>
                <AdminTd><AdminBadge variant={tm.variant}>{tm.label}</AdminBadge></AdminTd>
                <AdminTd style={{ fontWeight: 900, color: isPos ? "#16a34a" : "#dc2626" }}>{tm.sign}{fmt(tx.amount)}</AdminTd>
                <AdminTd style={{ color: "var(--text3)", fontSize: 12 }}>{fmt(tx.walletBalance)}</AdminTd>
                <AdminTd style={{ color: "var(--text3)", fontSize: 12 }}>{tx.description ?? "—"}</AdminTd>
                <AdminTd style={{ color: "var(--text3)", fontSize: 11, whiteSpace: "nowrap" }}>{fmtDate(tx.createdAt)}</AdminTd>
              </AdminTr>
            );
          })}
        </tbody>
      </AdminTable>

      {pages > 1 && <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={pg => load(pg)} />}

      <AdminModal open={showForm} onClose={() => setShowForm(false)} title="تراکنش دستی کیف پول">
        <AdminField label="شناسه کاربر (userId)" required>
          <AdminInput value={formUserId} onChange={setFormUserId} placeholder="UUID کاربر..." style={{ direction: "ltr", fontFamily: "monospace", fontSize: 12 }} />
        </AdminField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <AdminField label="نوع">
            <AdminInputSelect value={formType} onChange={setFormType}>
              <option value="DEPOSIT">شارژ (واریز)</option>
              <option value="WITHDRAWAL">برداشت</option>
            </AdminInputSelect>
          </AdminField>
          <AdminField label="مبلغ (ریال)" required>
            <AdminInput type="number" value={formAmount} onChange={setFormAmount} placeholder="500000" style={{ direction: "ltr" }} />
          </AdminField>
        </div>
        <AdminField label="توضیح (اختیاری)">
          <AdminInput value={formDesc} onChange={setFormDesc} placeholder="علت تراکنش..." />
        </AdminField>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <AdminBtn variant="primary" icon="ti-check" loading={submitting} onClick={handleAdminTx} style={{ flex: 1, justifyContent: "center" }}>
            {submitting ? "در حال ثبت..." : "ثبت تراکنش"}
          </AdminBtn>
          <AdminBtn variant="secondary" onClick={() => setShowForm(false)}>انصراف</AdminBtn>
        </div>
      </AdminModal>
    </div>
  );
}
