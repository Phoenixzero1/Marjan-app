import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const DAY_LABELS = ["ی", "د", "س", "چ", "پ", "ج", "ش"]; // Sun→Sat

export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [chartPayments, recentOrders, recentUsers, thisMonthRevenue, lastMonthRevenue, thisMonthOrders, lastMonthOrders] =
    await prisma.$transaction([
      prisma.payment.findMany({
        where: { status: "PAID", paidAt: { gte: sevenDaysAgo } },
        select: { amount: true, paidAt: true },
      }),
      prisma.order.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, firstName: true, lastName: true, createdAt: true },
      }),
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    ]);

  // Build 7-day chart — one entry per day oldest→newest
  const chart = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sevenDaysAgo);
    day.setDate(day.getDate() + i);
    const dayStr = day.toISOString().slice(0, 10);
    const total = chartPayments
      .filter(p => p.paidAt && p.paidAt.toISOString().slice(0, 10) === dayStr)
      .reduce((s, p) => s + p.amount, 0);
    return { label: DAY_LABELS[day.getDay()], value: total };
  });

  // Build activity feed: mix orders + registrations, sort by time, take 8
  const orderActivity = recentOrders.map(o => ({
    id: o.id,
    user: `${o.user.firstName} ${o.user.lastName}`.trim(),
    type: "order" as const,
    typeLabel: statusLabel(o.status),
    typeClass: statusClass(o.status),
    detail: o.orderNumber.slice(-8).toUpperCase(),
    createdAt: o.createdAt,
  }));

  const userActivity = recentUsers.map(u => ({
    id: u.id,
    user: `${u.firstName} ${u.lastName}`.trim(),
    type: "register" as const,
    typeLabel: "ثبت‌نام",
    typeClass: "pill-blue",
    detail: "کاربر جدید",
    createdAt: u.createdAt,
  }));

  const activity = [...orderActivity, ...userActivity]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  // % changes (vs last month)
  const curRev = thisMonthRevenue._sum.amount ?? 0;
  const prevRev = lastMonthRevenue._sum.amount ?? 0;
  const revenueChange = prevRev > 0 ? Math.round(((curRev - prevRev) / prevRev) * 100) : 0;
  const ordersChange = lastMonthOrders > 0 ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100) : 0;

  return NextResponse.json({ chart, activity, revenueChange, ordersChange });
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    PENDING: "سفارش جدید", CONFIRMED: "تأیید شد", PROCESSING: "در حال پردازش",
    SHIPPED: "ارسال شد", DELIVERED: "تحویل شد", RETURNED: "مرجوع شد", CANCELLED: "لغو شد",
  };
  return m[s] ?? s;
}

function statusClass(s: string) {
  if (s === "PENDING") return "pill-orange";
  if (s === "DELIVERED") return "pill-green";
  if (s === "CANCELLED" || s === "RETURNED") return "pill-red";
  return "pill-blue";
}
