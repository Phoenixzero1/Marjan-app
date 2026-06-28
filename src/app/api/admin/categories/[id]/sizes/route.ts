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
  const [setting, summarySetting] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { key: `category_sizes_${id}` } }),
    prisma.siteSettings.findUnique({ where: { key: `category_size_summary_${id}` } }),
  ]);
  const categorySummary = summarySetting?.value ?? "";
  if (!setting) return NextResponse.json({ units: {}, categorySummary });
  try {
    const parsed = JSON.parse(setting.value);
    if (Array.isArray(parsed)) return NextResponse.json({ units: {}, categorySummary });
    return NextResponse.json({ units: parsed, categorySummary });
  } catch {
    return NextResponse.json({ units: {}, categorySummary });
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
    const categorySummary = typeof body.categorySummary === "string" ? body.categorySummary : undefined;
    const ops: Promise<unknown>[] = [
      prisma.siteSettings.upsert({
        where: { key: `category_sizes_${id}` },
        update: { value: JSON.stringify(units) },
        create: { key: `category_sizes_${id}`, value: JSON.stringify(units), group: "category" },
      }),
    ];
    if (categorySummary !== undefined) {
      ops.push(
        prisma.siteSettings.upsert({
          where: { key: `category_size_summary_${id}` },
          update: { value: categorySummary },
          create: { key: `category_size_summary_${id}`, value: categorySummary, group: "category" },
        })
      );
    }
    await Promise.all(ops);
    return NextResponse.json({ units, categorySummary });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
