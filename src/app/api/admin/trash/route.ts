import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

import { prisma } from "@/lib/prisma";// GET — list all soft-deleted items across entities
export async function GET() {
  if (!(await requirePermission("VIEW_ADMIN"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const [products, categories, blogPosts, orders] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, deletedAt: true, price: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.category.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, slug: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.blogPost.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, title: true, slug: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.order.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, orderNumber: true, totalAmount: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ products, categories, blogPosts, orders });
}

// PATCH — restore a soft-deleted item
export async function PATCH(req: NextRequest) {
  if (!(await requirePermission("VIEW_ADMIN"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { entity, id } = await req.json() as { entity: string; id: string };

  const updateData = { deletedAt: null };

  switch (entity) {
    case "product":
      await prisma.product.update({ where: { id }, data: updateData });
      break;
    case "category":
      await prisma.category.update({ where: { id }, data: updateData });
      break;
    case "blogPost":
      await prisma.blogPost.update({ where: { id }, data: updateData });
      break;
    case "order":
      await prisma.order.update({ where: { id }, data: updateData });
      break;
    default:
      return NextResponse.json({ error: "موجودیت نامعتبر" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
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
