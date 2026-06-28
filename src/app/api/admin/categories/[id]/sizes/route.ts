export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const unitsSchema = z.record(z.string().min(1), z.array(z.string()));

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requirePermission("MANAGE_CATEGORIES")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const { id } = await params;
  const setting = await prisma.siteSettings.findUnique({ where: { key: `category_sizes_${id}` } });
  if (!setting) return NextResponse.json({ units: {} });
  try {
    const parsed = JSON.parse(setting.value);
    // old format was an array — treat as empty
    if (Array.isArray(parsed)) return NextResponse.json({ units: {} });
    return NextResponse.json({ units: parsed });
  } catch {
    return NextResponse.json({ units: {} });
  }
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
    const units = unitsSchema.parse(body.units ?? {});
    await prisma.siteSettings.upsert({
      where: { key: `category_sizes_${id}` },
      update: { value: JSON.stringify(units) },
      create: { key: `category_sizes_${id}`, value: JSON.stringify(units), group: "category" },
    });
    return NextResponse.json({ units });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
