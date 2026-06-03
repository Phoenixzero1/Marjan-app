import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"].includes(session.user.role))
    return null;
  return session;
}

const imageSchema = z.object({
  url: z.string(),
  isPrimary: z.boolean().default(false),
  altText: z.string().optional(),
  sortOrder: z.number().default(0),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  comparePrice: z.number().optional().nullable(),
  stockQty: z.number().optional(),
  description: z.string().optional().nullable(),
  shortDesc: z.string().optional().nullable(),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(imageSchema).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      sizes: { orderBy: { id: "asc" } },
    },
  });

  if (!product) return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { id } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { images, ...fields } = parsed.data;

  try {
    const before = await prisma.product.findUnique({ where: { id }, select: { name: true, price: true, status: true } });
    const product = await prisma.$transaction(async (tx) => {
      if (images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img) => ({ ...img, productId: id })),
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: fields,
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
        },
      });
    });

    const action = fields.price !== undefined && fields.price !== before?.price ? "PRODUCT_PRICE_CHANGE" : "PRODUCT_UPDATE";
    audit({ userId: session.user.id, action, entity: "Product", entityId: id, oldValue: before, newValue: fields, ip: getClientIp(req), ua: req.headers.get("user-agent") });
    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { id } = await params;

  try {
    const before = await prisma.product.findUnique({ where: { id }, select: { name: true, price: true } });
    await prisma.product.delete({ where: { id } });
    audit({ userId: session.user.id, action: "PRODUCT_DELETE", entity: "Product", entityId: id, oldValue: before, ip: getClientIp(req), ua: req.headers.get("user-agent") });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "خطا در حذف محصول" }, { status: 500 });
  }
}
