export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1, "Ú©Ø¯ ØªØ®ÙÛŒÙ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª"),
  orderAmount: z.number().min(0),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ù„Ø·ÙØ§Ù‹ ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯" }, { status: 401 });
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
    return NextResponse.json({ error: "Ú©Ø¯ ØªØ®ÙÛŒÙ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª" }, { status: 400 });
  }

  if (coupon.startsAt && coupon.startsAt > now) {
    return NextResponse.json({ error: "Ú©Ø¯ ØªØ®ÙÛŒÙ Ù‡Ù†ÙˆØ² ÙØ¹Ø§Ù„ Ù†Ø´Ø¯Ù‡ Ø§Ø³Øª" }, { status: 400 });
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    return NextResponse.json({ error: "Ú©Ø¯ ØªØ®ÙÛŒÙ Ù…Ù†Ù‚Ø¶ÛŒ Ø´Ø¯Ù‡ Ø§Ø³Øª" }, { status: 400 });
  }

  if (coupon.maxUsageCount !== null && coupon.usedCount >= coupon.maxUsageCount) {
    return NextResponse.json({ error: "Ø¸Ø±ÙÛŒØª Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø§Ø² Ø§ÛŒÙ† Ú©Ø¯ ØªØ®ÙÛŒÙ ØªÙ…Ø§Ù… Ø´Ø¯Ù‡ Ø§Ø³Øª" }, { status: 400 });
  }

  if (coupon.minOrderAmount !== null && orderAmount < coupon.minOrderAmount) {
    return NextResponse.json({
      error: `Ø­Ø¯Ø§Ù‚Ù„ Ù…Ø¨Ù„Øº Ø³ÙØ§Ø±Ø´ Ø¨Ø±Ø§ÛŒ Ø§ÛŒÙ† Ú©Ø¯ ØªØ®ÙÛŒÙ ${coupon.minOrderAmount.toLocaleString("fa-IR")} ØªÙˆÙ…Ø§Ù† Ø§Ø³Øª`,
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
