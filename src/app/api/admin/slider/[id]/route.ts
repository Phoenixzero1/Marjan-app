export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.subtitle !== undefined) data.subtitle = body.subtitle || null;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;
    if (body.buttonText !== undefined) data.buttonText = body.buttonText || null;
    if (body.buttonLink !== undefined) data.buttonLink = body.buttonLink || null;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;

    const slide = await prisma.banner.update({ where: { id: params.id }, data });
    return NextResponse.json({ slide });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  try {
    const existing = await prisma.banner.findUnique({ where: { id: params.id }, select: { isDefault: true } });
    if (existing?.isDefault) {
      return NextResponse.json({ error: "اسلاید پیش‌فرض قابل حذف نیست" }, { status: 403 });
    }
    await prisma.banner.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
