export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "Ø¯Ø³ØªØ±Ø³ÛŒ Ù…Ù…Ù†ÙˆØ¹" }, { status: 403 });

  const unanswered = req.nextUrl.searchParams.get("unanswered") === "true";
  const questions = await prisma.productQuestion.findMany({
    where: unanswered ? { answer: null } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      product: { select: { name: true, slug: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  });
  return NextResponse.json({ questions });
}

export async function PATCH(req: NextRequest) {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "Ø¯Ø³ØªØ±Ø³ÛŒ Ù…Ù…Ù†ÙˆØ¹" }, { status: 403 });

  const body = await req.json();
  const schema = z.object({ id: z.string(), answer: z.string().min(2), isApproved: z.boolean().optional() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  try {
    const question = await prisma.productQuestion.update({
      where: { id: parsed.data.id },
      data: { answer: parsed.data.answer, answeredAt: new Date(), isApproved: parsed.data.isApproved ?? true },
    });
    return NextResponse.json({ question });
  } catch {
    return NextResponse.json({ error: "Ø®Ø·Ø§ Ø¯Ø± Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø³ÙˆØ§Ù„" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requirePermission("EDIT_PRODUCTS")))
    return NextResponse.json({ error: "Ø¯Ø³ØªØ±Ø³ÛŒ Ù…Ù…Ù†ÙˆØ¹" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª" }, { status: 400 });
  await prisma.productQuestion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
