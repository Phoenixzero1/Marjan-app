import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"].includes(session.user.role))
    return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const q = searchParams.get("q");
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, pagination: { total, page, limit } });
}

const productSchema = z.object({
  name: z.string().min(2),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0),
  comparePrice: z.number().optional(),
  stockQty: z.number().default(0),
  description: z.string().optional(),
  shortDesc: z.string().optional(),
  status: z.union([z.literal("PUBLISHED"), z.literal("DRAFT"), z.literal("ARCHIVED")]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  try {
    const body = await req.json();
    const data = productSchema.parse(body);

    const base = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
    const slug = (base || "product") + "-" + Date.now();
    const product = await prisma.product.create({ data: { ...data, slug } });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: "شناسه محصول الزامی است" }, { status: 400 });

    const data = productSchema.partial().parse(rest);
    const product = await prisma.product.update({ where: { id }, data });

    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
