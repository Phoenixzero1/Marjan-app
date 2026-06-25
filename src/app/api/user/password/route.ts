import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { isRateLimited, getClientIp, limitExceeded } from "@/lib/rateLimit";

const schema = z.object({
  currentPassword: z.string().min(1, "رمز عبور فعلی الزامی است"),
  newPassword: z.string().min(6, "رمز جدید حداقل ۶ کاراکتر باشد"),
});

export async function POST(req: NextRequest) {
  // 5 attempts per IP per 15 minutes to prevent credential stuffing
  const ip = getClientIp(req);
  if (isRateLimited(`pw-change:${ip}`, 5, 15 * 60_000)) {
    return limitExceeded("تعداد تلاش‌های تغییر رمز بیش از حد مجاز است. ۱۵ دقیقه دیگر امتحان کنید.");
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });

  // Per-user limit: 3 per 15 minutes (covers multiple IPs same account)
  if (isRateLimited(`pw-change:user:${session.user.id}`, 3, 15 * 60_000)) {
    return limitExceeded("تعداد تلاش‌های تغییر رمز برای این حساب بیش از حد است. ۱۵ دقیقه صبر کنید.");
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
    return NextResponse.json({ error: "حساب شما از طریق OAuth ایجاد شده و رمز عبور ندارد" }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "رمز عبور فعلی اشتباه است" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } });

  return NextResponse.json({ message: "رمز عبور با موفقیت تغییر کرد" });
}
