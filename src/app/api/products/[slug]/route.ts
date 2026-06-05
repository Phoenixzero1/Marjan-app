import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        brand: true,
        category: {
          include: { parent: { select: { name: true, slug: true } } },
        },
        sizes: { orderBy: { label: "asc" } },
        specs: { orderBy: { sortOrder: "asc" } },
        questions: {
          where: { isApproved: true, answer: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, question: true, answer: true, answeredAt: true, createdAt: true, user: { select: { firstName: true, lastName: true } } },
        },
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product || product.status !== "PUBLISHED") {
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    // Increment view count
    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    // Related products: same category, exclude current
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        status: "PUBLISHED",
        id: { not: product.id },
      },
      take: 6,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        brand: { select: { name: true } },
        sizes: true,
      },
    });

    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

    return NextResponse.json({ product: { ...product, avgRating }, related });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
