export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayment } from "@/lib/zarinpal";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const authority = searchParams.get("Authority");
  const status = searchParams.get("Status");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!authority || status !== "OK") {
    return NextResponse.redirect(`${appUrl}/payment/failed?reason=cancelled`);
  }

  const payment = await prisma.payment.findUnique({ where: { authority } });
  if (!payment) {
    return NextResponse.redirect(`${appUrl}/payment/failed?reason=not_found`);
  }

  if (payment.status === "PAID") {
    return NextResponse.redirect(
      `${appUrl}/payment/success?orderId=${payment.orderId}&refId=${payment.refId}`
    );
  }

  const result = await verifyPayment(payment.amount, authority);

  if (result.success) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { authority },
        data: {
          status: "PAID",
          refId: result.refId,
          paidAt: new Date(),
          gatewayResponse: { refId: result.refId, cardHash: result.cardHash },
        },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" },
      }),
    ]);
    return NextResponse.redirect(
      `${appUrl}/payment/success?orderId=${payment.orderId}&refId=${result.refId}`
    );
  } else {
    // Mark payment failed + cancel the order + return stock
    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
      include: { items: true },
    });

    await prisma.$transaction([
      prisma.payment.update({
        where: { authority },
        data: { status: "FAILED", gatewayResponse: { error: result.error } },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "CANCELLED" },
      }),
      // Restore stock for each item
      ...(order?.items ?? []).map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQty: { increment: item.quantity },
            saleCount: { decrement: item.quantity },
          },
        })
      ),
    ]);

    return NextResponse.redirect(
      `${appUrl}/payment/failed?reason=verification_failed`
    );
  }
}

