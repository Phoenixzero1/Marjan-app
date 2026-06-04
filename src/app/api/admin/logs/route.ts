import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

import { prisma } from "@/lib/prisma";export async function GET(req: NextRequest) {
  if (!(await requirePermission("VIEW_LOGS"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 50;
  const level = searchParams.get("level") ?? "";
  const q = searchParams.get("q") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const where: Record<string, unknown> = {};
  if (level) where.level = level;
  if (q) where.OR = [
    { action: { contains: q, mode: "insensitive" } },
    { ipAddress: { contains: q } },
  ];
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
    };
  }

  const [total, logs, counts] = await Promise.all([
    prisma.systemLog.count({ where }),
    prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.systemLog.groupBy({
      by: ["level"],
      _count: { _all: true },
    }),
  ]);

  const levelCounts = Object.fromEntries(counts.map(c => [c.level, c._count._all]));

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit), levelCounts });
}

export async function DELETE(req: NextRequest) {
  if (!(await requirePermission("VIEW_LOGS"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { olderThanDays } = await req.json();
  const days = parseInt(olderThanDays ?? "30");
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const { count } = await prisma.systemLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return NextResponse.json({ success: true, deleted: count });
}
