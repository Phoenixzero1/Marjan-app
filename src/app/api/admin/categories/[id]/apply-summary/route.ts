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

  const result = await prisma.product.updateMany({
    where: { categoryId: id, deletedAt: null },
    data: { sizeSummary: summary },
  });

  return NextResponse.json({ updated: result.count });
}
