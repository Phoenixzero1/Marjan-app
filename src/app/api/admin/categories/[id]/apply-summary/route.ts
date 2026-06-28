export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requirePermission("MANAGE_CATEGORIES")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const summary: string | null = typeof body.summary === "string" ? body.summary || null : null;

  try {
    const result = await prisma.product.updateMany({
      where: { categoryId: id, deletedAt: null },
      data: { sizeSummary: summary },
    });
    await prisma.siteSettings.upsert({
      where: { key: `category_size_summary_${id}` },
      update: { value: summary ?? "" },
      create: { key: `category_size_summary_${id}`, value: summary ?? "", group: "category" },
    });
    return NextResponse.json({ updated: result.count });
  } catch (err) {
    console.error("[apply-summary POST]", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
