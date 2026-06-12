export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });

  const { id } = await params;
  try {
    const existing = await prisma.address.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) return NextResponse.json({ error: "آدرس یافت نشد" }, { status: 404 });

    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } }),
      prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "خطا در تنظیم آدرس پیش‌فرض" }, { status: 500 });
  }
}