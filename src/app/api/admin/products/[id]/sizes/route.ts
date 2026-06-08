export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sizeSchema = z.object({
  label: z.string().min(1),
  unit: z.enum(["INCH", "MM"]),
  stock: z.number().int().min(0),
  price: z.number().optional().nullable(),
  sku: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const sizes = await prisma.productSize.findMany({
    where: { productId: params.id },
    orderBy: { id: "asc" },
  });
  return NextResponse.json({ sizes });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  try {
    const body = await req.json();
    const sizes = z.array(sizeSchema).parse(body.sizes ?? []);

    await prisma.$transaction([
      prisma.productSize.deleteMany({ where: { productId: params.id } }),
      ...(sizes.length > 0
        ? [prisma.productSize.createMany({
            data: sizes.map((s) => ({ ...s, productId: params.id })),
          })]
        : []),
    ]);

    const result = await prisma.productSize.findMany({
      where: { productId: params.id },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ sizes: result });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
