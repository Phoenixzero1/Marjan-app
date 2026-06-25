export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const schema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª"),
  purpose: z.enum(["register", "login", "reset"]),
});

// Cryptographically secure 6-digit OTP
function generateOtp(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000)).padStart(6, "0");
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(`otp:${ip}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: "ØªØ¹Ø¯Ø§Ø¯ Ø¯Ø±Ø®ÙˆØ§Ø³Øªâ€ŒÙ‡Ø§ÛŒ OTP Ø¨ÛŒØ´ Ø§Ø² Ø­Ø¯ Ø§Ø³Øª. Û±Û° Ø¯Ù‚ÛŒÙ‚Ù‡ ØµØ¨Ø± Ú©Ù†ÛŒØ¯." }, { status: 429 });
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
        { error: "ØªØ¹Ø¯Ø§Ø¯ Ø¯Ø±Ø®ÙˆØ§Ø³Øªâ€ŒÙ‡Ø§ÛŒ OTP Ø¨ÛŒØ´ Ø§Ø² Ø­Ø¯ Ù…Ø¬Ø§Ø² Ø§Ø³Øª. Û±Û° Ø¯Ù‚ÛŒÙ‚Ù‡ ØµØ¨Ø± Ú©Ù†ÛŒØ¯." },
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
      // await sendSms(phone, `Ú©Ø¯ ØªØ£ÛŒÛŒØ¯ Ù…Ø§Ø±Ø¬Ø§Ù†: ${code}`)
    }

    return NextResponse.json({
      success: true,
      message: "کد تأیید ارسال شد",
      // Code is NEVER sent in response — only logged to server console in dev
    });
  } catch {
    return NextResponse.json({ error: "Ø®Ø·Ø§ÛŒ Ø³Ø±ÙˆØ±" }, { status: 500 });
  }
}
