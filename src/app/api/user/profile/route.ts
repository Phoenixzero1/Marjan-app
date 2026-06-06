import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(2, "نام الزامی است"),
  lastName: z.string().min(2, "نام خانوادگی الزامی است"),
  email: z.string().email("ایمیل معتبر نیست").optional().or(z.literal("")),
  nationalCode: z.string().length(10, "کد ملی باید ۱۰ رقم باشد").optional().or(z.literal("")),
  companyName: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      avatarUrl: true, nationalCode: true, companyName: true, city: true,
      postalCode: true, role: true, status: true, createdAt: true, lastLoginAt: true,
      _count: { select: { orders: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { firstName, lastName, email, nationalCode, companyName, city, postalCode } = parsed.data;

  try {
    if (email) {
      const existing = await prisma.user.findFirst({ where: { email, id: { not: session.user.id } } });
      if (existing) return NextResponse.json({ error: "این ایمیل توسط کاربر دیگری استفاده شده است" }, { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { firstName, lastName, email: email || null, nationalCode: nationalCode || null, companyName: companyName || null, city: city || null, postalCode: postalCode || null },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
    });

    return NextResponse.json({ user, message: "پروفایل با موفقیت بروزرسانی شد" });
  } catch {
    return NextResponse.json({ error: "خطا در بروزرسانی پروفایل" }, { status: 500 });
  }
}
