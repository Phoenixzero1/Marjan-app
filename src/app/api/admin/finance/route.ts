import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

import { prisma } from "@/lib/prisma";export async function GET(req: NextRequest) {
  if (!(await requirePermission("VIEW_FINANCE"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const status = searchParams.get("status") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  // Summary stats
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    todayRevenue,
    totalRefunded,
    pendingCount,
    paidCount,
    failedCount,
  ] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfToday } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "REFUNDED" }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
  ]);

  // Daily revenue for the last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dailyPayments = await prisma.payment.findMany({
    where: { status: "PAID", paidAt: { gte: thirtyDaysAgo } },
    select: { amount: true, paidAt: true },
  });

  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = 0;
  }
  for (const p of dailyPayments) {
    const key = (p.paidAt ?? new Date()).toISOString().slice(0, 10);
    if (key in dailyMap) dailyMap[key] += p.amount;
  }
  const daily = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));

  // Transactions list with filters
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
    };
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    summary: {
      totalRevenue: totalRevenue._sum.amount ?? 0,
      monthRevenue: monthRevenue._sum.amount ?? 0,
      lastMonthRevenue: lastMonthRevenue._sum.amount ?? 0,
      todayRevenue: todayRevenue._sum.amount ?? 0,
      totalRefunded: totalRefunded._sum.amount ?? 0,
      pendingCount,
      paidCount,
      failedCount,
    },
    daily,
    payments,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
