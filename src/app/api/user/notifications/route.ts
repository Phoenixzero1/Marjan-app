export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Ù„Ø·ÙØ§Ù‹ ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return NextResponse.json({ notifications, unreadCount });
}

// PATCH â€” mark one or all notifications as read
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Ù„Ø·ÙØ§Ù‹ ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯" }, { status: 401 });

  const body = await req.json();
  const parsed = z.object({ id: z.string().optional(), all: z.boolean().optional() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ø¯Ø§Ø¯Ù‡ Ù†Ø§Ù…Ø¹ØªØ¨Ø±" }, { status: 400 });
  const { id, all } = parsed.data;

  try {
    if (all) {
      await prisma.notification.updateMany({ where: { userId: session.user.id, isRead: false }, data: { isRead: true } });
    } else if (id) {
      await prisma.notification.update({ where: { id }, data: { isRead: true } });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ø®Ø·Ø§ Ø¯Ø± Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø§Ø¹Ù„Ø§Ù†" }, { status: 500 });
  }
}
