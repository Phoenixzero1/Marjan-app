import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "اسلاگ فقط حروف انگلیسی، اعداد و خط تیره"),
  logoUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, slug: true, logoUrl: true,
      description: true, country: true, isActive: true,
      _count: { select: { products: true } },
    },
  });

  return NextResponse.json({ brands });
}

export async function POST(req: NextRequest) {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const exists = await prisma.brand.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است" }, { status: 409 });

  const brand = await prisma.brand.create({ data: parsed.data });
  return NextResponse.json({ brand }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  const parsed = schema.partial().safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const brand = await prisma.brand.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ brand });
}

export async function DELETE(req: NextRequest) {
  const session = await requirePermission("EDIT_PRODUCTS");
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "شناسه برند الزامی است" }, { status: 400 });

  const productCount = await prisma.product.count({ where: { brandId: id } });

  if (productCount > 0) {
    await prisma.product.updateMany({ where: { brandId: id }, data: { brandId: null } });
  }

  await prisma.brand.update({ where: { id }, data: { isActive: false } });

  return NextResponse.json({ success: true, unbrandedProducts: productCount });
}
