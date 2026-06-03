import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const schema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  purpose: z.enum(["register", "login", "reset"]),
});

// Simple 6-digit OTP
function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(`otp:${ip}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: "تعداد درخواست‌های OTP بیش از حد است. ۱۰ دقیقه صبر کنید." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" },
        { status: 400 }
      );
    }

    const { phone, purpose } = parsed.data;

    // Rate-limit: max 3 OTPs per phone per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await prisma.otpCode.count({
      where: {
        phone,
        purpose,
        createdAt: { gte: tenMinutesAgo },
        used: false,
      },
    });

    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "تعداد درخواست‌های OTP بیش از حد مجاز است. ۱۰ دقیقه صبر کنید." },
        { status: 429 }
      );
    }

    // Invalidate previous unused OTPs for this phone+purpose
    await prisma.otpCode.updateMany({
      where: { phone, purpose, used: false },
      data: { used: true },
    });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otpCode.create({
      data: { phone, code, purpose, expiresAt },
    });

    // In production: send via SMS gateway (Melipayamak / KaveNegar / etc.)
    // For development: log to console
    if (process.env.NODE_ENV === "development") {
      console.log(`[OTP] Phone: ${phone} | Purpose: ${purpose} | Code: ${code}`);
    } else {
      // TODO: integrate SMS gateway
      // await sendSms(phone, `کد تأیید مارجان: ${code}`)
    }

    return NextResponse.json({
      success: true,
      message: "کد تأیید ارسال شد",
      // Expose code only in development
      ...(process.env.NODE_ENV === "development" ? { code } : {}),
    });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
