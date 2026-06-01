import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const schema = z.object({
  userId: z.string().min(1, "شناسه کاربر الزامی است"),
  token: z.string().min(1, "توکن الزامی است"),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" },
        { status: 400 }
      );
    }

    const { userId, token, password } = parsed.data;

    const record = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: userId, token } },
    });

    if (!record) {
      return NextResponse.json(
        { error: "لینک بازیابی نامعتبر است" },
        { status: 400 }
      );
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: userId, token } },
      });
      return NextResponse.json(
        { error: "لینک بازیابی منقضی شده است. لطفاً مجدداً درخواست دهید." },
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

    return NextResponse.json({ success: true, message: "رمز عبور با موفقیت تغییر کرد" });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
