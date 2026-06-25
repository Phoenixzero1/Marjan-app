export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

// Unread / pending counts for the Communications Center sidebar badges.
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  try {
    const [contact, blog, reviews, questions] = await Promise.all([
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.blogComment.count({ where: { isApproved: false } }),
      prisma.review.count({ where: { isApproved: false } }),
      prisma.productQuestion.count({ where: { answer: null } }),
    ]);
    return NextResponse.json({ contact, blog, reviews, questions });
  } catch (err) {
    console.error("GET /api/admin/communications/stats failed:", err);
    return NextResponse.json({ error: "خطا در دریافت آمار", contact: 0, blog: 0, reviews: 0, questions: 0 }, { status: 500 });
  }
}
