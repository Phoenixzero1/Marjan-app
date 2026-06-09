export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const fallback = { orders: 0, comments: 0, returns: 0, sessions: 0, logs: 0, blog: 0 };
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

    const now = new Date();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [orders, comments, returns_, sessions, logs, blog] = await prisma.$transaction([
      prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
      prisma.review.count({ where: { isApproved: false } }),
      prisma.returnRequest.count({ where: { status: "PENDING" } }),
      prisma.session.count({ where: { expires: { gt: now }, createdAt: { gte: since24h } } }),
      prisma.systemLog.count({ where: { level: { in: ["ERROR", "CRITICAL"] }, createdAt: { gte: since24h } } }),
      prisma.blogPost.count({ where: { isPublished: false, deletedAt: null } }),
    ]);

    return NextResponse.json({ orders, comments, returns: returns_, sessions, logs, blog });
  } catch {
    return NextResponse.json(fallback);
  }
}
