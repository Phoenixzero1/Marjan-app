export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

// GET — list admin replies for a contact message
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
  const { id } = await params;
  try {
    const replies = await prisma.contactReply.findMany({ where: { contactId: id }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ replies });
  } catch (err) {
    console.error("GET contact replies failed:", err);
    return NextResponse.json({ replies: [] });
  }
}

// POST — admin replies to a contact message (persisted; email/sms delivery is up to the operator)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const content = (body.content ?? "").trim();
  const sentVia = ["panel", "email", "sms"].includes(body.sentVia) ? body.sentVia : "panel";
  if (!content) return NextResponse.json({ error: "متن پاسخ الزامی است" }, { status: 400 });

  try {
    const reply = await prisma.contactReply.create({
      data: { contactId: id, content, sentVia, authorName: session.user?.name ?? "مدیر" },
    });
    await prisma.contactMessage.update({ where: { id }, data: { repliedAt: new Date(), isRead: true } }).catch(() => {});
    return NextResponse.json({ reply }, { status: 201 });
  } catch (err) {
    console.error("POST contact reply failed:", err);
    return NextResponse.json({ error: "خطا در ثبت پاسخ — احتمالاً مهاجرت دیتابیس اجرا نشده است (prisma migrate deploy)" }, { status: 500 });
  }
}
