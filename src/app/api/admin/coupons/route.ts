import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function requireAdmin() {
  const session = await auth();
  return session?.user?.id && ADMIN_ROLES.includes(session.user.role ?? "") ? session : null;
}

const schema = z.object({
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
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

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
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

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

  return NextResponse.json({ coupon }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  const partial = schema.partial().safeParse(rest);
  if (!partial.success) return NextResponse.json({ error: partial.error.issues[0]?.message }, { status: 400 });

  // If code is being changed, check uniqueness
  if (partial.data.code) {
    const existing = await prisma.coupon.findUnique({ where: { code: partial.data.code } });
    if (existing && existing.id !== id) return NextResponse.json({ error: "این کد قبلاً استفاده شده است" }, { status: 409 });
  }

  try {
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...partial.data,
        ...(partial.data.startsAt !== undefined ? { startsAt: partial.data.startsAt ? new Date(partial.data.startsAt) : null } : {}),
        ...(partial.data.expiresAt !== undefined ? { expiresAt: partial.data.expiresAt ? new Date(partial.data.expiresAt) : null } : {}),
      },
    });
    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
