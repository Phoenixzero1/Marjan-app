import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function requireAdmin() {
  const session = await auth();
  return session?.user?.id && ADMIN_ROLES.includes(session.user.role ?? "") ? session : null;
}

export async function GET(req: NextRequest) {
  const adminSession = await requireAdmin();
  if (!adminSession) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 25;
  const q = searchParams.get("q") ?? "";
  const expired = searchParams.get("expired") ?? "";

  const now = new Date();
  const where: Record<string, unknown> = {};
  if (q) {
    where.user = {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    };
  }
  if (expired === "true") where.expires = { lt: now };
  if (expired === "false") where.expires = { gte: now };

  const [total, sessions, activeCount, expiredCount] = await Promise.all([
    prisma.session.count({ where }),
    prisma.session.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true } },
      },
    }),
    prisma.session.count({ where: { expires: { gte: now } } }),
    prisma.session.count({ where: { expires: { lt: now } } }),
  ]);

  return NextResponse.json({
    sessions,
    total,
    page,
    pages: Math.ceil(total / limit),
    summary: { total: total, active: activeCount, expired: expiredCount },
    mySessionUserId: adminSession.user.id,
  });
}

export async function DELETE(req: NextRequest) {
  const adminSession = await requireAdmin();
  if (!adminSession) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id, userId, deleteExpired } = await req.json();

  // Purge all expired sessions
  if (deleteExpired) {
    const { count } = await prisma.session.deleteMany({ where: { expires: { lt: new Date() } } });
    return NextResponse.json({ success: true, deleted: count });
  }

  // Revoke all sessions for a specific user (force logout)
  if (userId) {
    if (userId === adminSession.user.id) {
      return NextResponse.json({ error: "نمی‌توانید نشست‌های خودتان را حذف کنید" }, { status: 400 });
    }
    const { count } = await prisma.session.deleteMany({ where: { userId } });
    return NextResponse.json({ success: true, deleted: count });
  }

  // Delete single session
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
  await prisma.session.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
