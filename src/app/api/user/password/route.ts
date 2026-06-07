export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { isRateLimited, getClientIp, limitExceeded } from "@/lib/rateLimit";

const schema = z.object({
  currentPassword: z.string().min(1, "Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± ÙØ¹Ù„ÛŒ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª"),
  newPassword: z.string().min(6, "Ø±Ù…Ø² Ø¬Ø¯ÛŒØ¯ Ø­Ø¯Ø§Ù‚Ù„ Û¶ Ú©Ø§Ø±Ø§Ú©ØªØ± Ø¨Ø§Ø´Ø¯"),
});

export async function POST(req: NextRequest) {
  // 5 attempts per IP per 15 minutes to prevent credential stuffing
  const ip = getClientIp(req);
  if (isRateLimited(`pw-change:${ip}`, 5, 15 * 60_000)) {
    return limitExceeded("ØªØ¹Ø¯Ø§Ø¯ ØªÙ„Ø§Ø´â€ŒÙ‡Ø§ÛŒ ØªØºÛŒÛŒØ± Ø±Ù…Ø² Ø¨ÛŒØ´ Ø§Ø² Ø­Ø¯ Ù…Ø¬Ø§Ø² Ø§Ø³Øª. Û±Ûµ Ø¯Ù‚ÛŒÙ‚Ù‡ Ø¯ÛŒÚ¯Ø± Ø§Ù…ØªØ­Ø§Ù† Ú©Ù†ÛŒØ¯.");
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Ù„Ø·ÙØ§Ù‹ ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯" }, { status: 401 });

  // Per-user limit: 3 per 15 minutes (covers multiple IPs same account)
  if (isRateLimited(`pw-change:user:${session.user.id}`, 3, 15 * 60_000)) {
    return limitExceeded("ØªØ¹Ø¯Ø§Ø¯ ØªÙ„Ø§Ø´â€ŒÙ‡Ø§ÛŒ ØªØºÛŒÛŒØ± Ø±Ù…Ø² Ø¨Ø±Ø§ÛŒ Ø§ÛŒÙ† Ø­Ø³Ø§Ø¨ Ø¨ÛŒØ´ Ø§Ø² Ø­Ø¯ Ø§Ø³Øª. Û±Ûµ Ø¯Ù‚ÛŒÙ‚Ù‡ ØµØ¨Ø± Ú©Ù†ÛŒØ¯.");
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Ø­Ø³Ø§Ø¨ Ø´Ù…Ø§ Ø§Ø² Ø·Ø±ÛŒÙ‚ OAuth Ø§ÛŒØ¬Ø§Ø¯ Ø´Ø¯Ù‡ Ùˆ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ù†Ø¯Ø§Ø±Ø¯" }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± ÙØ¹Ù„ÛŒ Ø§Ø´ØªØ¨Ø§Ù‡ Ø§Ø³Øª" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } });

  return NextResponse.json({ message: "Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª ØªØºÛŒÛŒØ± Ú©Ø±Ø¯" });
}
