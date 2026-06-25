export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

// GET — list admin replies for a review
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requirePermission("EDIT_PRODUCTS"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
  const { id } = await params;
  try {
    const replies = await prisma.reviewReply.findMany({ where: { reviewId: id }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ replies });
  } catch (err) {
    // Table may not exist yet (migration not deployed) — fail soft
    console.error("GET review replies failed:", err);
    return NextResponse.json({ replies: [] });
  }
}

// POST — admin replies to a review
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("EDIT_PRODUCTS");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const content = (body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "متن پاسخ الزامی است" }, { status: 400 });

  try {
    const reply = await prisma.reviewReply.create({
      data: { reviewId: id, content, authorName: session.user?.name ?? "مدیر" },
    });
    return NextResponse.json({ reply }, { status: 201 });
  } catch (err) {
    console.error("POST review reply failed:", err);
    return NextResponse.json({ error: "خطا در ثبت پاسخ — احتمالاً مهاجرت دیتابیس اجرا نشده است (prisma migrate deploy)" }, { status: 500 });
  }
}
