import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  code: z.string().length(6, "کد باید ۶ رقمی باشد"),
  purpose: z.enum(["register", "login", "reset"]),
});

export async function POST(req: Request) {
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
