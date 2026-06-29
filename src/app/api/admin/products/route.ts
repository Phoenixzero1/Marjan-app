import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const q = searchParams.get("q");
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { deletedAt: null };
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
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  price: z.number().min(0),
  comparePrice: z.number().optional().nullable(),
  stockQty: z.number().default(0),
  description: z.string().optional().nullable(),
  shortDesc: z.string().optional().nullable(),
  status: z.union([z.literal("PUBLISHED"), z.literal("DRAFT"), z.literal("ARCHIVED")]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  images: z.array(z.object({
    url: z.string(),
    isPrimary: z.boolean().default(false),
    altText: z.string().optional(),
    sortOrder: z.number().default(0),
  })).default([]),
});

export async function POST(req: NextRequest) {
  const session = await requirePermission("EDIT_PRODUCTS");
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  try {
    const body = await req.json();
    const { images, categoryId, brandId, ...scalarFields } = productSchema.parse(body);

    const base = scalarFields.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
    const slug = (base || "product") + "-" + Date.now();

    const relOps: Record<string, unknown> = {};
    if (categoryId) relOps.category = { connect: { id: categoryId } };
    if (brandId) relOps.brand = { connect: { id: brandId } };

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({ data: { ...scalarFields, slug, ...relOps } });
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img) => ({ ...img, productId: p.id })),
        });
      }
      return tx.product.findUnique({
        where: { id: p.id },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      });
    });

    audit({ userId: session.user.id, action: "PRODUCT_CREATE", entity: "Product", entityId: product?.id, newValue: { name: fields.name, price: fields.price }, ip: getClientIp(req), ua: req.headers.get("user-agent") });
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requirePermission("EDIT_PRODUCTS");
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: "شناسه محصول الزامی است" }, { status: 400 });

    const { images: _imgs, ...fields } = productSchema.partial().parse(rest);
    const data = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== null && v !== undefined)
    );

    const before = await prisma.product.findUnique({ where: { id }, select: { name: true, price: true, status: true } });
    const product = await prisma.product.update({ where: { id }, data });

    const action = "price" in data ? "PRODUCT_PRICE_CHANGE" : "PRODUCT_UPDATE";
    audit({ userId: session.user.id, action, entity: "Product", entityId: id, oldValue: before, newValue: data, ip: getClientIp(req), ua: req.headers.get("user-agent") });
    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requirePermission("EDIT_PRODUCTS");
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  const before = await prisma.product.findUnique({ where: { id }, select: { name: true, price: true } });
  await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  audit({ userId: session.user.id, action: "PRODUCT_DELETE", entity: "Product", entityId: id, oldValue: before, ip: getClientIp(req), ua: req.headers.get("user-agent") });
  return NextResponse.json({ success: true });
}
