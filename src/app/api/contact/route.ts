export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isRateLimited, getClientIp, limitExceeded } from "@/lib/rateLimit";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  subject: z.string().optional(),
  message: z.string().min(10),
});

export async function POST(req: NextRequest) {
  // Rate limit: max 5 contact messages per IP per hour
  const ip = getClientIp(req);
  if (isRateLimited(`contact:${ip}`, 10, 60 * 60_000)) {
    return limitExceeded("ØªØ¹Ø¯Ø§Ø¯ Ù¾ÛŒØ§Ù…â€ŒÙ‡Ø§ÛŒ Ø§Ø±Ø³Ø§Ù„ÛŒ Ø´Ù…Ø§ Ø¨ÛŒØ´ Ø§Ø² Ø­Ø¯ Ù…Ø¬Ø§Ø² Ø§Ø³Øª. ÛŒÚ© Ø³Ø§Ø¹Øª Ø¯ÛŒÚ¯Ø± ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.");
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);
    await prisma.contactMessage.create({ data });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Ø®Ø·Ø§ÛŒ Ø³Ø±ÙˆØ±" }, { status: 500 });
  }
}
