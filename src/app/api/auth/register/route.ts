import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().regex(/^09\d{9}$/),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  // Rate limit: max 5 registrations per IP per 10 minutes
  const ip = getClientIp(req);
  if (isRateLimited(`register:${ip}`, 5, 15 * 60_000)) {
    return NextResponse.json(
      { error: "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً ۱۰ دقیقه صبر کنید." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const exists = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (exists) {
      return NextResponse.json({ error: "این شماره یا ایمیل قبلاً ثبت شده است" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || null,
        passwordHash,
        status: "ACTIVE",
        role: "CUSTOMER",
      },
      select: { id: true, phone: true, firstName: true, lastName: true },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
