export const dynamic = 'force-dynamic'
﻿import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2).optional(),
  phone: z.string().regex(/^09\d{9}$/).optional(),
  province: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  address: z.string().min(5).optional(),
  postalCode: z.string().regex(/^\d{10}$/).optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const existing = await prisma.address.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) return NextResponse.json({ error: "آدرس یافت نشد" }, { status: 404 });

    if (parsed.data.isDefault) {
      await prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
    }

    const address = await prisma.address.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ address });
  } catch {
    return NextResponse.json({ error: "خطا در بروزرسانی آدرس" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.address.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "آدرس یافت نشد" }, { status: 404 });

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ success: true });
}