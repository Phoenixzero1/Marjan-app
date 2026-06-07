export const dynamic = 'force-dynamic'
﻿import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const specSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  sortOrder: z.number().default(0),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const { id } = params;
  const specs = await prisma.productSpec.findMany({ where: { productId: id }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ specs });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const { id } = params;
  const body = await req.json();

  // Bulk replace: receive array of specs
  if (Array.isArray(body.specs)) {
    await prisma.productSpec.deleteMany({ where: { productId: id } });
    if (body.specs.length > 0) {
      await prisma.productSpec.createMany({
        data: body.specs.map((s: { key: string; value: string }, i: number) => ({
          productId: id, key: s.key, value: s.value, sortOrder: i,
        })),
      });
    }
    const specs = await prisma.productSpec.findMany({ where: { productId: id }, orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ specs });
  }

  const parsed = specSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const spec = await prisma.productSpec.create({ data: { ...parsed.data, productId: id } });
  return NextResponse.json({ spec }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  const specId = req.nextUrl.searchParams.get("specId");
  if (!specId) return NextResponse.json({ error: "specId الزامی است" }, { status: 400 });
  await prisma.productSpec.delete({ where: { id: specId } });
  return NextResponse.json({ success: true });
}