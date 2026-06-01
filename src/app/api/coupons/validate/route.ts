import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1, "کد تخفیف الزامی است"),
  orderAmount: z.number().min(0),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { code, orderAmount } = parsed.data;
  const now = new Date();

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: "کد تخفیف معتبر نیست" }, { status: 400 });
  }

  if (coupon.startsAt && coupon.startsAt > now) {
    return NextResponse.json({ error: "کد تخفیف هنوز فعال نشده است" }, { status: 400 });
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    return NextResponse.json({ error: "کد تخفیف منقضی شده است" }, { status: 400 });
  }

  if (coupon.maxUsageCount !== null && coupon.usedCount >= coupon.maxUsageCount) {
    return NextResponse.json({ error: "ظرفیت استفاده از این کد تخفیف تمام شده است" }, { status: 400 });
  }

  if (coupon.minOrderAmount !== null && orderAmount < coupon.minOrderAmount) {
    return NextResponse.json({
      error: `حداقل مبلغ سفارش برای این کد تخفیف ${coupon.minOrderAmount.toLocaleString("fa-IR")} تومان است`,
    }, { status: 400 });
  }

  const discountAmount =
    coupon.discountType === "percent"
      ? Math.round((orderAmount * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, orderAmount);

  return NextResponse.json({
    valid: true,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      description: coupon.description,
    },
  });
}
