export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { isRateLimited, getClientIp, limitExceeded } from "@/lib/rateLimit";

const schema = z.object({
  identifier: z
    .string()
    .min(1, "Ø§ÛŒÙ† ÙÛŒÙ„Ø¯ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª")
    .refine(
      (v) => /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(v) || /^09\d{9}$/.test(v),
      "Ø§ÛŒÙ…ÛŒÙ„ ÛŒØ§ Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª"
    ),
});

export async function POST(req: NextRequest) {
  // Rate limit: max 3 reset requests per IP per 15 minutes
  const ip = getClientIp(req);
  if (isRateLimited(`reset-request:${ip}`, 3, 15 * 60_000)) {
    return limitExceeded("ØªØ¹Ø¯Ø§Ø¯ Ø¯Ø±Ø®ÙˆØ§Ø³Øªâ€ŒÙ‡Ø§ÛŒ Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ø±Ù…Ø² Ø¨ÛŒØ´ Ø§Ø² Ø­Ø¯ Ø§Ø³Øª. Û±Ûµ Ø¯Ù‚ÛŒÙ‚Ù‡ ØµØ¨Ø± Ú©Ù†ÛŒØ¯.");
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ÙˆØ±ÙˆØ¯ÛŒ Ù†Ø§Ù…Ø¹ØªØ¨Ø±" },
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
      // await sendEmail(user.email, "Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ù…Ø§Ø±Ø¬Ø§Ù†", resetUrl)
      console.log(`[Password Reset] Email: ${user.email} | URL: ${resetUrl}`);
    } else if (user.phone) {
      // In production: send SMS with reset link
      // await sendSms(user.phone, `Ù„ÛŒÙ†Ú© Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ø±Ù…Ø²: ${resetUrl}`)
      console.log(`[Password Reset] Phone: ${user.phone} | URL: ${resetUrl}`);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ø®Ø·Ø§ÛŒ Ø³Ø±ÙˆØ±" }, { status: 500 });
  }
}
