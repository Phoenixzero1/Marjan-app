export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sizePresetSchema = z.object({
  label: z.string().min(1),
  unit: z.enum(["INCH", "MM", "METER", "PIECE"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requirePermission("MANAGE_CATEGORIES")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  try {
    const sizes = z.array(sizePresetSchema).parse(body.sizes ?? []);

    const products = await prisma.product.findMany({
      where: { categoryId: id, deletedAt: null },
      select: { id: true },
    });

    if (products.length === 0)
      return NextResponse.json({ updated: 0, message: "محصولی در این دسته‌بندی یافت نشد" });

    const productIds = products.map((p) => p.id);

    await prisma.$transaction([
      prisma.productSize.deleteMany({ where: { productId: { in: productIds } } }),
      ...(sizes.length > 0
        ? [
            prisma.productSize.createMany({
              data: productIds.flatMap((productId) =>
                sizes.map((s) => ({ productId, label: s.label, unit: s.unit, stock: 0 }))
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
