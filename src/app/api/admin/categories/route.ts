import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";const schema = z.object({
  name: z.string().min(2, "نام الزامی است"),
  slug: z.string().min(2, "اسلاگ الزامی است").regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف انگلیسی، اعداد و خط تیره"),
  parentId: z.string().optional().nullable(),
  description: z.string().optional(),
  iconClass: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
});

export async function GET() {
  if (!(await requirePermission("MANAGE_CATEGORIES"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true, children: true } },
      parent: { select: { name: true } },
    },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await requirePermission("MANAGE_CATEGORIES");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است" }, { status: 409 });

  const category = await prisma.category.create({ data: parsed.data });
  audit({ userId: session.user.id, action: "CATEGORY_CREATE", entity: "Category", entityId: category.id, newValue: { name: category.name, slug: category.slug }, ip: getClientIp(req), ua: req.headers.get("user-agent") });
  return NextResponse.json({ category }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await requirePermission("MANAGE_CATEGORIES");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  const parsed = schema.partial().safeParse(rest);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  if (parsed.data.parentId === id)
    return NextResponse.json({ error: "دسته‌بندی نمی‌تواند والد خودش باشد" }, { status: 400 });

  if (parsed.data.slug) {
    const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
    if (existing && existing.id !== id)
      return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است" }, { status: 409 });
  }

  try {
    const before = await prisma.category.findUnique({ where: { id }, select: { name: true, slug: true, isActive: true } });
    const category = await prisma.category.update({ where: { id }, data: parsed.data });
    audit({ userId: session.user.id, action: "CATEGORY_UPDATE", entity: "Category", entityId: id, oldValue: before, newValue: parsed.data, ip: getClientIp(req), ua: req.headers.get("user-agent") });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "خطا در ویرایش دسته‌بندی" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requirePermission("MANAGE_CATEGORIES");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return NextResponse.json({ error: `این دسته‌بندی دارای ${productCount} محصول است. ابتدا محصولات را منتقل کنید.` }, { status: 409 });
  }

  const before = await prisma.category.findUnique({ where: { id }, select: { name: true, slug: true } });
  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  audit({ userId: session.user.id, action: "CATEGORY_DELETE", entity: "Category", entityId: id, oldValue: before, ip: getClientIp(req), ua: req.headers.get("user-agent") });
  return NextResponse.json({ success: true });
}
