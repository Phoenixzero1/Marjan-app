import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isRateLimited, getClientIp, limitExceeded } from "@/lib/rateLimit";

const schema = z.object({
  userId: z.string().min(1, "شناسه کاربر الزامی است"),
  token: z.string().min(1, "توکن الزامی است"),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر"),
});

export async function POST(req: NextRequest) {
  // Rate limit: max 5 confirm attempts per IP per 15 minutes
  const ip = getClientIp(req);
  if (isRateLimited(`reset-confirm:${ip}`, 5, 15 * 60_000)) {
    return limitExceeded("تعداد تلاش‌های تغییر رمز بیش از حد است. ۱۵ دقیقه صبر کنید.");
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

    const { userId, token, password } = parsed.data;

    // Per-user limit: max 3 confirm attempts per userId per 15 minutes
    if (isRateLimited(`reset-confirm:user:${userId}`, 3, 15 * 60_000)) {
      return limitExceeded("تعداد تلاش‌های تغییر رمز برای این حساب بیش از حد است. ۱۵ دقیقه صبر کنید.");
    }

    const record = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: userId, token } },
    });

    if (!record) {
      return NextResponse.json(
        { error: "لینک بازیابی نامعتبر است" },
        { status: 400 }
      );
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: userId, token } },
      });
      return NextResponse.json(
        { error: "لینک بازیابی منقضی شده است. لطفاً مجدداً درخواست دهید." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier: userId, token } },
      }),
    ]);

    return NextResponse.json({ success: true, message: "رمز عبور با موفقیت تغییر کرد" });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
