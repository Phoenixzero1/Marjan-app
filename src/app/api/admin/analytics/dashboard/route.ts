export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayRev, weekRev, monthRev, topProducts, topCustomerOrders] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfDay } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfWeek } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.groupBy({
      by: ["userId"],
      _sum: { totalAmount: true },
      _count: { _all: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 5,
      where: { userId: { not: undefined } },
    }),
  ]);

  const productIds = topProducts.map(p => p.productId);
  const customerIds = topCustomerOrders.map(c => c.userId).filter((id): id is string => id !== null && id !== undefined);

  const [productDetails, customerDetails] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, images: { take: 1, select: { url: true } } } }),
    prisma.user.findMany({ where: { id: { in: customerIds } }, select: { id: true, firstName: true, lastName: true, email: true } }),
  ]);

  const productMap = Object.fromEntries(productDetails.map(p => [p.id, p]));
  const customerMap = Object.fromEntries(customerDetails.map(u => [u.id, u]));

  return NextResponse.json({
    revenue: {
      today: todayRev._sum.amount ?? 0,
      week: weekRev._sum.amount ?? 0,
      month: monthRev._sum.amount ?? 0,
    },
    topProducts: topProducts.map(p => ({
      ...productMap[p.productId],
      totalSold: p._sum.quantity ?? 0,
      totalRevenue: p._sum.price ?? 0,
    })),
    topCustomers: topCustomerOrders.map(c => {
      const user = c.userId ? customerMap[c.userId] : null;
      return {
        id: c.userId ?? "",
        name: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
        email: user?.email ?? undefined,
        orderCount: c._count._all,
        totalSpent: c._sum.totalAmount ?? 0,
      };
    }),
  });
}
