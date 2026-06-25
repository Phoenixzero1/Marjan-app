export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isRateLimited, getClientIp, limitExceeded } from "@/lib/rateLimit";

const schema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª"),
  code: z.string().length(6, "Ú©Ø¯ Ø¨Ø§ÛŒØ¯ Û¶ Ø±Ù‚Ù…ÛŒ Ø¨Ø§Ø´Ø¯"),
  purpose: z.enum(["register", "login", "reset"]),
});

export async function POST(req: NextRequest) {
  // Block IPs hammering the endpoint from rotating phones
  const ip = getClientIp(req);
  if (isRateLimited(`otp-verify:ip:${ip}`, 3, 10 * 60_000)) {
    return limitExceeded("ØªØ¹Ø¯Ø§Ø¯ ØªÙ„Ø§Ø´â€ŒÙ‡Ø§ÛŒ ØªØ£ÛŒÛŒØ¯ OTP Ø¨ÛŒØ´ Ø§Ø² Ø­Ø¯ Ù…Ø¬Ø§Ø² Ø§Ø³Øª. Û±Û° Ø¯Ù‚ÛŒÙ‚Ù‡ ØµØ¨Ø± Ú©Ù†ÛŒØ¯.");
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

    const { phone, code, purpose } = parsed.data;

    // Per-phone limit: max 5 verify attempts per phone per 10 minutes (brute-force guard)
    if (isRateLimited(`otp-verify:phone:${phone}`, 3, 10 * 60_000)) {
      return limitExceeded("ØªØ¹Ø¯Ø§Ø¯ ØªÙ„Ø§Ø´â€ŒÙ‡Ø§ÛŒ ØªØ£ÛŒÛŒØ¯ Ø¨Ø±Ø§ÛŒ Ø§ÛŒÙ† Ø´Ù…Ø§Ø±Ù‡ Ø¨ÛŒØ´ Ø§Ø² Ø­Ø¯ Ø§Ø³Øª. Û±Û° Ø¯Ù‚ÛŒÙ‚Ù‡ ØµØ¨Ø± Ú©Ù†ÛŒØ¯.");
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
        { error: "Ú©Ø¯ ØªØ£ÛŒÛŒØ¯ Ù†Ø§Ù…Ø¹ØªØ¨Ø± ÛŒØ§ Ù…Ù†Ù‚Ø¶ÛŒ Ø´Ø¯Ù‡ Ø§Ø³Øª" },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    // For register/reset purpose: mark the specific user's phone as verified
    if (purpose === "register" || purpose === "reset") {
      const user = await prisma.user.findFirst({
        where: { phone },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { phoneVerified: new Date(), status: "ACTIVE" },
        });
      }
    }

    return NextResponse.json({ success: true, verified: true });
  } catch {
    return NextResponse.json({ error: "Ø®Ø·Ø§ÛŒ Ø³Ø±ÙˆØ±" }, { status: 500 });
  }
}
