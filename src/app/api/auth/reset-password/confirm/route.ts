export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isRateLimited, getClientIp, limitExceeded } from "@/lib/rateLimit";

const schema = z.object({
  userId: z.string().min(1, "Ø´Ù†Ø§Ø³Ù‡ Ú©Ø§Ø±Ø¨Ø± Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª"),
  token: z.string().min(1, "ØªÙˆÚ©Ù† Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª"),
  password: z.string().min(6, "Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø­Ø¯Ø§Ù‚Ù„ Û¶ Ú©Ø§Ø±Ø§Ú©ØªØ±"),
});

export async function POST(req: NextRequest) {
  // Rate limit: max 5 confirm attempts per IP per 15 minutes
  const ip = getClientIp(req);
  if (isRateLimited(`reset-confirm:${ip}`, 5, 15 * 60_000)) {
    return limitExceeded("ØªØ¹Ø¯Ø§Ø¯ ØªÙ„Ø§Ø´â€ŒÙ‡Ø§ÛŒ ØªØºÛŒÛŒØ± Ø±Ù…Ø² Ø¨ÛŒØ´ Ø§Ø² Ø­Ø¯ Ø§Ø³Øª. Û±Ûµ Ø¯Ù‚ÛŒÙ‚Ù‡ ØµØ¨Ø± Ú©Ù†ÛŒØ¯.");
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

    const { userId, token, password } = parsed.data;

    // Per-user limit: max 3 confirm attempts per userId per 15 minutes
    if (isRateLimited(`reset-confirm:user:${userId}`, 3, 15 * 60_000)) {
      return limitExceeded("ØªØ¹Ø¯Ø§Ø¯ ØªÙ„Ø§Ø´â€ŒÙ‡Ø§ÛŒ ØªØºÛŒÛŒØ± Ø±Ù…Ø² Ø¨Ø±Ø§ÛŒ Ø§ÛŒÙ† Ø­Ø³Ø§Ø¨ Ø¨ÛŒØ´ Ø§Ø² Ø­Ø¯ Ø§Ø³Øª. Û±Ûµ Ø¯Ù‚ÛŒÙ‚Ù‡ ØµØ¨Ø± Ú©Ù†ÛŒØ¯.");
    }

    const record = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: userId, token } },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Ù„ÛŒÙ†Ú© Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ù†Ø§Ù…Ø¹ØªØ¨Ø± Ø§Ø³Øª" },
        { status: 400 }
      );
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: userId, token } },
      });
      return NextResponse.json(
        { error: "Ù„ÛŒÙ†Ú© Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ù…Ù†Ù‚Ø¶ÛŒ Ø´Ø¯Ù‡ Ø§Ø³Øª. Ù„Ø·ÙØ§Ù‹ Ù…Ø¬Ø¯Ø¯Ø§Ù‹ Ø¯Ø±Ø®ÙˆØ§Ø³Øª Ø¯Ù‡ÛŒØ¯." },
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

    return NextResponse.json({ success: true, message: "Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª ØªØºÛŒÛŒØ± Ú©Ø±Ø¯" });
  } catch {
    return NextResponse.json({ error: "Ø®Ø·Ø§ÛŒ Ø³Ø±ÙˆØ±" }, { status: 500 });
  }
}
