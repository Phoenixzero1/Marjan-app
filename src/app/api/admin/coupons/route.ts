import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";const schema = z.object({
  code: z.string().min(3, "کد تخفیف باید حداقل ۳ کاراکتر باشد").toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(["percent", "fixed"]).default("percent"),
  discountValue: z.number().min(0),
  minOrderAmount: z.number().optional().nullable(),
  maxUsageCount: z.number().optional().nullable(),
  maxUsagePerUser: z.number().optional().nullable(),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  if (!(await requirePermission("MANAGE_COUPONS"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = 20;

  const [coupons, total] = await prisma.$transaction([
    prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.coupon.count(),
  ]);

  return NextResponse.json({ coupons, pagination: { total, page, pages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const session = await requirePermission("MANAGE_COUPONS");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code } });
  if (existing) return NextResponse.json({ error: "این کد قبلاً استفاده شده است" }, { status: 409 });

  const coupon = await prisma.coupon.create({
    data: {
      ...parsed.data,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  });

  audit({ userId: session.user.id, action: "COUPON_CREATE", entity: "Coupon", entityId: coupon.id, newValue: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue }, ip: getClientIp(req), ua: req.headers.get("user-agent") });
  return NextResponse.json({ coupon }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await requirePermission("MANAGE_COUPONS");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  const partial = schema.partial().safeParse(rest);
  if (!partial.success) return NextResponse.json({ error: partial.error.issues[0]?.message }, { status: 400 });

  if (partial.data.code) {
    const existing = await prisma.coupon.findUnique({ where: { code: partial.data.code } });
    if (existing && existing.id !== id) return NextResponse.json({ error: "این کد قبلاً استفاده شده است" }, { status: 409 });
  }

  try {
    const before = await prisma.coupon.findUnique({ where: { id }, select: { code: true, discountValue: true, isActive: true } });
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...partial.data,
        ...(partial.data.startsAt !== undefined ? { startsAt: partial.data.startsAt ? new Date(partial.data.startsAt) : null } : {}),
        ...(partial.data.expiresAt !== undefined ? { expiresAt: partial.data.expiresAt ? new Date(partial.data.expiresAt) : null } : {}),
      },
    });
    audit({ userId: session.user.id, action: "COUPON_UPDATE", entity: "Coupon", entityId: id, oldValue: before, newValue: partial.data, ip: getClientIp(req), ua: req.headers.get("user-agent") });
    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requirePermission("MANAGE_COUPONS");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  const before = await prisma.coupon.findUnique({ where: { id }, select: { code: true, discountType: true, discountValue: true } });
  await prisma.coupon.delete({ where: { id } });
  audit({ userId: session.user.id, action: "COUPON_DELETE", entity: "Coupon", entityId: id, oldValue: before, ip: getClientIp(req), ua: req.headers.get("user-agent") });
  return NextResponse.json({ success: true });
}
