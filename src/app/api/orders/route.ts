export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function generateOrderNum(): string {
  const date = new Date();
  const jalali = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `ORD-${jalali}-${random}`;
}

const orderSchema = z.object({
  addressId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    sizeLabel: z.string().optional(),
    quantity: z.number().min(1),
  })),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  shippingMethod: z.string().optional(),
  paymentMethod: z.enum(["gateway", "wallet"]).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Ù†ÛŒØ§Ø² Ø¨Ù‡ ÙˆØ±ÙˆØ¯ Ø¯Ø§Ø±ÛŒØ¯" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 10;

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: { name: true, images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
        payment: { select: { status: true, refId: true } },
      },
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ orders, pagination: { total, page, limit } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Ù†ÛŒØ§Ø² Ø¨Ù‡ ÙˆØ±ÙˆØ¯ Ø¯Ø§Ø±ÛŒØ¯" }, { status: 401 });

  try {
    const body = await req.json();
    const data = orderSchema.parse(body);

    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { sizes: true },
    });

    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Ù…Ø­ØµÙˆÙ„ ${item.productId} Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯`);
      const sizePrice = item.sizeLabel
        ? product.sizes.find((s) => s.label === item.sizeLabel)?.price ?? product.price
        : product.price;
      const total = sizePrice * item.quantity;
      subtotal += total;
      return { productId: item.productId, sizeLabel: item.sizeLabel, quantity: item.quantity, unitPrice: sizePrice, totalPrice: total };
    });

    // Apply coupon discount
    let discountAmount = 0;
    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode.toUpperCase() },
      });
      if (coupon && coupon.isActive) {
        const raw = coupon.discountType === "percent"
          ? Math.round((subtotal * coupon.discountValue) / 100)
          : coupon.discountValue;
        discountAmount = Math.min(Math.round(raw), subtotal);
        await prisma.coupon.update({
          where: { code: data.couponCode.toUpperCase() },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const taxBase = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(taxBase * 0.1);
    const totalAmount = Math.max(0, taxBase + taxAmount);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNum(),
        userId: session.user.id,
        addressId: data.addressId,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        couponCode: data.couponCode,
        notes: data.notes,
        shippingMethod: data.shippingMethod ?? "standard",
        items: { create: orderItems },
      },
      include: { items: true },
    });

    // 100% discount — skip payment gateway, auto-complete
    if (totalAmount === 0) {
      await prisma.$transaction([
        prisma.order.update({ where: { id: order.id }, data: { status: "PROCESSING" } }),
        prisma.payment.create({
          data: { orderId: order.id, amount: 0, status: "PAID", gateway: "free", paidAt: new Date() },
        }),
      ]);
      return NextResponse.json({ success: true, order: { ...order, status: "PROCESSING" }, isFree: true }, { status: 201 });
    }

    // Wallet payment
    if (data.paymentMethod === "wallet") {
      const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
      if (!wallet || wallet.balance < totalAmount) {
        await prisma.order.delete({ where: { id: order.id } });
        return NextResponse.json({ error: "موجودی کیف پول کافی نیست" }, { status: 400 });
      }
      await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: session.user.id },
          data: { balance: { decrement: totalAmount } },
        }),
        prisma.walletTx.create({
          data: {
            walletId: wallet.id,
            amount: -totalAmount,
            type: "purchase",
            description: `پرداخت سفارش ${order.orderNumber}`,
            refId: order.id,
          },
        }),
        prisma.order.update({ where: { id: order.id }, data: { status: "PROCESSING" } }),
        prisma.payment.create({
          data: { orderId: order.id, amount: totalAmount, status: "PAID", gateway: "wallet", paidAt: new Date() },
        }),
      ]);
      return NextResponse.json({ success: true, order: { ...order, status: "PROCESSING" }, isWalletPaid: true }, { status: 201 });
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    const message = err instanceof Error ? err.message : "Ø®Ø·Ø§ÛŒ Ø³Ø±ÙˆØ±";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
