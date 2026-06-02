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
  if (isRateLimited(`contact:${ip}`, 5, 60 * 60_000)) {
    return limitExceeded("تعداد پیام‌های ارسالی شما بیش از حد مجاز است. یک ساعت دیگر تلاش کنید.");
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);
    await prisma.contactMessage.create({ data });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
