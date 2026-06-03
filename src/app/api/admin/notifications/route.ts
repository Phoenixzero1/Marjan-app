import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function requireAdmin() {
  const session = await auth();
  return session?.user?.id && ADMIN_ROLES.includes(session.user.role ?? "") ? session : null;
}

const sendSchema = z.object({
  title: z.string().min(2, "عنوان الزامی است"),
  body: z.string().min(2, "متن اطلاعیه الزامی است"),
  type: z.enum(["ORDER_UPDATE", "PAYMENT", "SYSTEM", "PROMOTION", "STOCK_ALERT"]).default("SYSTEM"),
  link: z.string().optional().nullable(),
  // target: "all" | "role:<ROLE>" | "user:<userId>"
  target: z.string().default("all"),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 25;
  const type = searchParams.get("type") ?? "";
  const isRead = searchParams.get("isRead") ?? "";

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (isRead === "true") where.isRead = true;
  if (isRead === "false") where.isRead = false;

  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  // Summary counts
  const [totalCount, unreadCount] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  return NextResponse.json({
    notifications,
    total,
    page,
    pages: Math.ceil(total / limit),
    summary: { total: totalCount, unread: unreadCount },
  });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { title, body: notifBody, type, link, target } = parsed.data;

  let userIds: string[] = [];

  if (target === "all") {
    const users = await prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
    userIds = users.map(u => u.id);
  } else if (target.startsWith("role:")) {
    const role = target.slice(5);
    const users = await prisma.user.findMany({ where: { role: role as never, status: "ACTIVE" }, select: { id: true } });
    userIds = users.map(u => u.id);
  } else if (target.startsWith("user:")) {
    const uid = target.slice(5);
    const user = await prisma.user.findUnique({ where: { id: uid }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    userIds = [uid];
  } else {
    return NextResponse.json({ error: "هدف ارسال نامعتبر است" }, { status: 400 });
  }

  if (userIds.length === 0) return NextResponse.json({ error: "هیچ کاربری برای ارسال یافت نشد" }, { status: 404 });

  const data = userIds.map(userId => ({
    userId,
    type: type as never,
    title,
    body: notifBody,
    ...(link ? { link } : {}),
  }));

  const result = await prisma.notification.createMany({ data });

  return NextResponse.json({ success: true, sent: result.count }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id, deleteAll } = await req.json();

  if (deleteAll) {
    const { count } = await prisma.notification.deleteMany({});
    return NextResponse.json({ success: true, deleted: count });
  }

  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
  await prisma.notification.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
