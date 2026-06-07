export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalOrders, monthOrders, totalUsers, todayUsers, totalRevenue, monthRevenue, pendingOrders, todayVisits, pendingReviews, publishedBlogPosts] =
    await prisma.$transaction([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.systemLog.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.review.count({ where: { isApproved: false } }),
      prisma.blogPost.count({ where: { isPublished: true, deletedAt: null } }),
    ]);

  return NextResponse.json({
    totalOrders, monthOrders, totalUsers, todayUsers,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    monthRevenue: monthRevenue._sum.amount ?? 0,
    pendingOrders, todayVisits, pendingReviews, publishedBlogPosts,
  });
}
