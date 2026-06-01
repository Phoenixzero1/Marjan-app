import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const schema = z.object({
  identifier: z
    .string()
    .min(1, "این فیلد الزامی است")
    .refine(
      (v) => /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(v) || /^09\d{9}$/.test(v),
      "ایمیل یا شماره موبایل معتبر نیست"
    ),
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

    const { identifier } = parsed.data;
    const isEmail = identifier.includes("@");

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier },
      select: { id: true, email: true, phone: true, firstName: true },
    });

    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate secure token (64 hex chars)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.upsert({
      where: { identifier_token: { identifier: user.id, token } },
      update: { expires },
      create: { identifier: user.id, token, expires },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}&id=${user.id}`;

    if (isEmail && user.email) {
      // In production: send email via SMTP
      // await sendEmail(user.email, "بازیابی رمز عبور مارجان", resetUrl)
      console.log(`[Password Reset] Email: ${user.email} | URL: ${resetUrl}`);
    } else if (user.phone) {
      // In production: send SMS with reset link
      // await sendSms(user.phone, `لینک بازیابی رمز: ${resetUrl}`)
      console.log(`[Password Reset] Phone: ${user.phone} | URL: ${resetUrl}`);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
