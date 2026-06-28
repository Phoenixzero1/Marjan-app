export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sizePresetSchema = z.object({
  label: z.string().min(1),
  unit: z.enum(["INCH", "MM", "METER", "PIECE"]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requirePermission("MANAGE_CATEGORIES")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const { id } = await params;
  const setting = await prisma.siteSettings.findUnique({ where: { key: `category_sizes_${id}` } });
  const sizes = setting ? JSON.parse(setting.value) : [];
  return NextResponse.json({ sizes });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requirePermission("MANAGE_CATEGORIES")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  try {
    const sizes = z.array(sizePresetSchema).parse(body.sizes ?? []);
    await prisma.siteSettings.upsert({
      where: { key: `category_sizes_${id}` },
      update: { value: JSON.stringify(sizes) },
      create: { key: `category_sizes_${id}`, value: JSON.stringify(sizes), group: "category" },
    });
    return NextResponse.json({ sizes });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
