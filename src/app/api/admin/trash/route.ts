export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";// GET — list all soft-deleted items across entities
export async function GET() {
  if (!(await requirePermission("VIEW_ADMIN"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const safe = async <T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch (err) { console.error(`[trash GET] ${label}:`, err); return fallback; }
  };

  const products = await safe("products", () => prisma.product.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, name: true, deletedAt: true, price: true },
    orderBy: { deletedAt: "desc" },
  }), []);
  const categories = await safe("categories", () => prisma.category.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, name: true, slug: true, deletedAt: true },
    orderBy: { deletedAt: "desc" },
  }), []);
  const blogPosts = await safe("blogPosts", () => prisma.blogPost.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, title: true, slug: true, deletedAt: true },
    orderBy: { deletedAt: "desc" },
  }), []);
  const orders = await safe("orders", () => prisma.order.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, orderNumber: true, totalAmount: true, deletedAt: true },
    orderBy: { deletedAt: "desc" },
  }), []);
  return NextResponse.json({ products, categories, blogPosts, orders });
}

const restoreSchema = z.object({
  entity: z.enum(["product", "category", "blogPost", "order"]),
  id: z.string().min(1, "شناسه الزامی است"),
});

// PATCH — restore a soft-deleted item
export async function PATCH(req: NextRequest) {
  if (!(await requirePermission("VIEW_ADMIN"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const parsed = restoreSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { entity, id } = parsed.data;

  try {
    const updateData = { deletedAt: null };
    switch (entity) {
      case "product":  await prisma.product.update({ where: { id }, data: updateData }); break;
      case "category": await prisma.category.update({ where: { id }, data: updateData }); break;
      case "blogPost": await prisma.blogPost.update({ where: { id }, data: updateData }); break;
      case "order":    await prisma.order.update({ where: { id }, data: updateData }); break;
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "خطا در بازیابی آیتم" }, { status: 500 });
  }
}

// DELETE — permanently delete an item (cannot be undone)
export async function DELETE(req: NextRequest) {
  if (!(await requirePermission("VIEW_ADMIN"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { entity, id } = await req.json() as { entity: string; id: string };

  switch (entity) {
    case "product":
      await prisma.product.delete({ where: { id } });
      break;
    case "category":
      await prisma.category.delete({ where: { id } });
      break;
    case "blogPost":
      await prisma.blogPost.delete({ where: { id } });
      break;
    case "order":
      await prisma.order.delete({ where: { id } });
      break;
    default:
      return NextResponse.json({ error: "موجودیت نامعتبر" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
