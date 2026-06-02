import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isRateLimited, getClientIp, limitExceeded } from "@/lib/rateLimit";

const schema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  code: z.string().length(6, "کد باید ۶ رقمی باشد"),
  purpose: z.enum(["register", "login", "reset"]),
});

export async function POST(req: NextRequest) {
  // Block IPs hammering the endpoint from rotating phones
  const ip = getClientIp(req);
  if (isRateLimited(`otp-verify:ip:${ip}`, 10, 10 * 60_000)) {
    return limitExceeded("تعداد تلاش‌های تأیید OTP بیش از حد مجاز است. ۱۰ دقیقه صبر کنید.");
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

    const { phone, code, purpose } = parsed.data;

    // Per-phone limit: max 5 verify attempts per phone per 10 minutes (brute-force guard)
    if (isRateLimited(`otp-verify:phone:${phone}`, 5, 10 * 60_000)) {
      return limitExceeded("تعداد تلاش‌های تأیید برای این شماره بیش از حد است. ۱۰ دقیقه صبر کنید.");
    }

    const otp = await prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        purpose,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "کد تأیید نامعتبر یا منقضی شده است" },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    // For register/reset purpose: mark phone as verified on user record
    if (purpose === "register" || purpose === "reset") {
      await prisma.user.updateMany({
        where: { phone },
        data: { phoneVerified: new Date(), status: "ACTIVE" },
      });
    }

    return NextResponse.json({ success: true, verified: true });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
