export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requirePermission("MANAGE_CATEGORIES")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const { id } = await params;
  const setting = await prisma.siteSettings.findUnique({ where: { key: `category_unit_${id}` } });
  return NextResponse.json({ unit: setting?.value ?? "" });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requirePermission("MANAGE_CATEGORIES")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const { id } = await params;
  const { unit } = await req.json();
  if (unit) {
    await prisma.siteSettings.upsert({
      where: { key: `category_unit_${id}` },
      update: { value: String(unit) },
      create: { key: `category_unit_${id}`, value: String(unit), group: "category" },
    });
  } else {
    await prisma.siteSettings.deleteMany({ where: { key: `category_unit_${id}` } });
  }
  return NextResponse.json({ unit: unit ?? "" });
}
