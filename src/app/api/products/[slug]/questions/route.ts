export const dynamic = 'force-dynamic'
﻿import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ question: z.string().min(5, "سوال باید حداقل ۵ کاراکتر باشد") });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });

  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const question = await prisma.productQuestion.create({
    data: { productId: product.id, userId: session.user.id, question: parsed.data.question },
  });

  return NextResponse.json({ question, message: "سوال شما ثبت شد و پس از بررسی نمایش داده می‌شود" }, { status: 201 });
}