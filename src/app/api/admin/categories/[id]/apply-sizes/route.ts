export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const unitsSchema = z.record(z.string().min(1), z.array(z.string()));

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requirePermission("MANAGE_CATEGORIES")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  try {
    const units = unitsSchema.parse(body.units ?? {});

    // Flatten to ProductSize rows: label = "value unitName", unit = PIECE
    const sizeRows = Object.entries(units).flatMap(([unitName, values]) =>
      values.filter(v => v.trim()).map(v => ({ label: `${v.trim()} ${unitName}`, unit: "PIECE" as const }))
    );

    const products = await prisma.product.findMany({
      where: { categoryId: id, deletedAt: null },
      select: { id: true },
    });

    if (products.length === 0)
      return NextResponse.json({ updated: 0 });

    const productIds = products.map(p => p.id);

    await prisma.$transaction([
      prisma.productSize.deleteMany({ where: { productId: { in: productIds } } }),
      ...(sizeRows.length > 0
        ? [
            prisma.productSize.createMany({
              data: productIds.flatMap(productId =>
                sizeRows.map(s => ({ productId, label: s.label, unit: s.unit, stock: 0 }))
              ),
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ updated: products.length });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
