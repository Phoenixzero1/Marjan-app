export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LEVELS = ["INFO", "WARNING", "ERROR", "CRITICAL"] as const;

export async function GET(req: NextRequest) {
  if (!(await requirePermission("VIEW_LOGS"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.max(1, parseInt(searchParams.get("pageSize") ?? "50"));
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

  try {
    const total = await prisma.systemLog.count({ where });
    const logs = await prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    const counts = await prisma.systemLog.groupBy({
      by: ["level"],
      _count: { _all: true },
    });
    const summary = Object.fromEntries(LEVELS.map(lv => [lv, 0])) as Record<string, number>;
    for (const c of counts) summary[c.level] = c._count._all;

    const entries = logs.map(l => ({
      id: l.id,
      level: l.level,
      message: l.action,
      context: l.user ? [l.user.firstName, l.user.lastName].filter(Boolean).join(" ") || l.user.email : null,
      source: l.ipAddress,
      details: l.details,
      createdAt: l.createdAt,
    }));

    return NextResponse.json({ entries, total, page, pages: Math.ceil(total / limit), summary });
  } catch (err) {
    console.error("[admin/logs GET]", err);
    const summary = Object.fromEntries(LEVELS.map(lv => [lv, 0]));
    return NextResponse.json({ entries: [], total: 0, page: 1, pages: 0, summary });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  let body: { message?: string; stack?: string; digest?: string; url?: string; level?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "بدنه نامعتبر" }, { status: 400 }); }

  const message = (body.message ?? "").slice(0, 2000);
  if (!message) return NextResponse.json({ error: "پیام خطا الزامی است" }, { status: 400 });

  const level = body.level === "CRITICAL" ? "CRITICAL" : "ERROR";
  const userId = (session?.user as { id?: string } | undefined)?.id;

  try {
    await prisma.systemLog.create({
      data: {
        ...(userId ? { user: { connect: { id: userId } } } : {}),
        level,
        action: message,
        details: { stack: body.stack ?? null, digest: body.digest ?? null, url: body.url ?? null, source: "client" },
        userAgent: req.headers.get("user-agent"),
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/logs POST]", err);
    return NextResponse.json({ error: "خطا در ثبت لاگ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requirePermission("VIEW_LOGS"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const days = parseInt(new URL(req.url).searchParams.get("days") ?? "30");
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const { count } = await prisma.systemLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return NextResponse.json({ success: true, deleted: count });
}
