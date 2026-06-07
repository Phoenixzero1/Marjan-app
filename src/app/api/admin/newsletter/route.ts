export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

import { prisma } from "@/lib/prisma";
import { z } from "zod";export async function GET(req: NextRequest) {
  if (!(await requirePermission("VIEW_ADMIN"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 25;
  const q = searchParams.get("q") ?? "";
  const active = searchParams.get("active") ?? "";

  const where: Record<string, unknown> = {};
  if (q) where.email = { contains: q, mode: "insensitive" };
  if (active === "true") where.isActive = true;
  if (active === "false") where.isActive = false;

  const [total, subscribers, activeCount, totalCount] = await Promise.all([
    prisma.newsletter.count({ where }),
    prisma.newsletter.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.newsletter.count({ where: { isActive: true } }),
    prisma.newsletter.count(),
  ]);

  return NextResponse.json({
    subscribers,
    total,
    page,
    pages: Math.ceil(total / limit),
    summary: { total: totalCount, active: activeCount, inactive: totalCount - activeCount },
  });
}

export async function POST(req: NextRequest) {
  if (!(await requirePermission("VIEW_ADMIN"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const parsed = z.object({ email: z.string().email("ایمیل نامعتبر است") }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const existing = await prisma.newsletter.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده است" }, { status: 409 });

  const subscriber = await prisma.newsletter.create({ data: { email: parsed.data.email } });
  return NextResponse.json({ subscriber }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().min(1, "شناسه الزامی است"),
  isActive: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  if (!(await requirePermission("VIEW_ADMIN"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  try {
    const subscriber = await prisma.newsletter.update({ where: { id: parsed.data.id }, data: { isActive: parsed.data.isActive } });
    return NextResponse.json({ subscriber });
  } catch {
    return NextResponse.json({ error: "خطا در بروزرسانی" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requirePermission("VIEW_ADMIN"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id, deleteInactive } = await req.json();

  if (deleteInactive) {
    const { count } = await prisma.newsletter.deleteMany({ where: { isActive: false } });
    return NextResponse.json({ success: true, deleted: count });
  }

  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
  await prisma.newsletter.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
