export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  try {
    const slides = await prisma.banner.findMany({
      where: { type: "hero" },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ slides });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  try {
    const body = await req.json();
    const agg = await prisma.banner.aggregate({ where: { type: "hero" }, _max: { sortOrder: true } });
    const slide = await prisma.banner.create({
      data: {
        type: "hero",
        title: body.title || "",
        subtitle: body.subtitle || null,
        imageUrl: body.imageUrl || null,
        buttonText: body.buttonText || null,
        buttonLink: body.buttonLink || null,
        isActive: body.isActive ?? true,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        sortOrder: (agg._max.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json({ slide });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// Bulk reorder
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  try {
    const { items } = await req.json() as { items: { id: string; sortOrder: number }[] };
    await prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        prisma.banner.update({ where: { id }, data: { sortOrder } })
      )
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
