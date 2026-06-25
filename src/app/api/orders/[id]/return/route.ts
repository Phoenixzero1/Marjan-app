import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RETURN_WINDOW_DAYS = 7;

const schema = z.object({
  reason: z.string().min(3, "دلیل مرجوعی الزامی است"),
  description: z.string().optional(),
});

// GET — return request status for an order
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });

  const { id } = await params;
  const req = await prisma.returnRequest.findFirst({
    where: { orderId: id, userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ returnRequest: req });
}

// POST — submit a return request
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id, userId: session.user.id },
    select: { id: true, status: true, deliveredAt: true, totalAmount: true },
  });

  if (!order) return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });
  if (order.status !== "DELIVERED") return NextResponse.json({ error: "فقط سفارش‌های تحویل‌شده قابل مرجوع هستند" }, { status: 400 });

  if (order.deliveredAt) {
    const daysSince = (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > RETURN_WINDOW_DAYS) {
      return NextResponse.json({ error: `مهلت مرجوعی ${RETURN_WINDOW_DAYS} روز از تحویل است` }, { status: 400 });
    }
  }

  // Check for existing pending request
  const existing = await prisma.returnRequest.findFirst({
    where: { orderId: id, userId: session.user.id, status: "PENDING" },
  });
  if (existing) return NextResponse.json({ error: "درخواست مرجوعی قبلاً ثبت شده و در حال بررسی است" }, { status: 409 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const returnReq = await prisma.returnRequest.create({
    data: {
      orderId: id,
      userId: session.user.id,
      reason: parsed.data.reason,
      description: parsed.data.description,
      refundAmount: order.totalAmount,
    },
  });

  return NextResponse.json({ returnRequest: returnReq }, { status: 201 });
}
