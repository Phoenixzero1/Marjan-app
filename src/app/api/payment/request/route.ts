import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requestPayment } from "@/lib/zarinpal";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "نیاز به ورود دارید" }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId)
    return NextResponse.json({ error: "شناسه سفارش الزامی است" }, { status: 400 });

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: session.user.id } });
  if (!order)
    return NextResponse.json({ error: "سفارش پیدا نشد" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const callbackUrl = process.env.ZARINPAL_CALLBACK_URL ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify`;

  const result = await requestPayment(
    order.totalAmount,
    `پرداخت سفارش ${order.orderNumber}`,
    callbackUrl,
    user?.phone ?? undefined,
    user?.email ?? undefined
  );

  if (!result.success)
    return NextResponse.json({ error: result.error }, { status: 500 });

  await prisma.payment.upsert({
    where: { orderId },
    create: { orderId, amount: order.totalAmount, authority: result.authority, gateway: "zarinpal" },
    update: { authority: result.authority, status: "PENDING" },
  });

  return NextResponse.json({ paymentUrl: result.paymentUrl });
}
