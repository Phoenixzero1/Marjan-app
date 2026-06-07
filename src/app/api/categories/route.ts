export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");

    // Single category lookup by slug (for category page)
    if (slug) {
      const category = await prisma.category.findUnique({
        where: { slug, isActive: true },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
          parent: { select: { name: true, slug: true } },
        },
      });
      if (!category) {
        return NextResponse.json({ error: "Ø¯Ø³ØªÙ‡â€ŒØ¨Ù†Ø¯ÛŒ ÛŒØ§ÙØª Ù†Ø´Ø¯" }, { status: 404 });
      }
      return NextResponse.json({ category });
    }

    // All top-level categories (for megamenu, sidebar, etc.)
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { products: true } } },
        },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ø®Ø·Ø§ÛŒ Ø³Ø±ÙˆØ±" }, { status: 500 });
  }
}
