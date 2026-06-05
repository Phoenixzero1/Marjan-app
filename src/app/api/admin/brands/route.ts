import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({ brands });
}

export async function DELETE(req: NextRequest) {
  const session = await requirePermission("EDIT_PRODUCTS");
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "شناسه برند الزامی است" }, { status: 400 });

  const productCount = await prisma.product.count({ where: { brandId: id } });

  // Unlink products from this brand before deactivating
  if (productCount > 0) {
    await prisma.product.updateMany({ where: { brandId: id }, data: { brandId: null } });
  }

  // Soft-delete via isActive flag (Brand has no deletedAt)
  await prisma.brand.update({ where: { id }, data: { isActive: false } });

  return NextResponse.json({ success: true, unbrandedProducts: productCount });
}
