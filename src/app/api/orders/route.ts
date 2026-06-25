export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Crypto-safe unique order number — negligible collision probability
function generateOrderNum(): string {
  const d = new Date();
  const prefix = `ORD-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  const hex = Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `${prefix}-${hex}`;
}

const orderSchema = z.object({
  addressId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    sizeLabel: z.string().optional(),
    quantity: z.number().min(1).max(100),
  })).min(1),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  shippingMethod: z.string().optional(),
  paymentMethod: z.enum(["gateway", "wallet"]).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "نیاز به ورود دارید" }, { status: 401 });

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
    return NextResponse.json({ error: "نیاز به ورود دارید" }, { status: 401 });

  try {
    const body = await req.json();
    const data = orderSchema.parse(body);

    // ── 1. Fetch products (PUBLISHED only) ──────────────────────────────────
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: "PUBLISHED" },
      include: { sizes: true },
    });

    // Check all requested products exist, are published, have enough stock
    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`محصول درخواستی موجود نیست یا منتشر نشده`);
      if (product.stockQty < item.quantity)
        throw new Error(`موجودی «${product.name}» کافی نیست`);
    }

    // ── 2. Build order items + subtotal ─────────────────────────────────────
    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const sizePrice = item.sizeLabel
        ? product.sizes.find((s) => s.label === item.sizeLabel)?.price ?? product.price
        : product.price;
      const lineTotal = sizePrice * item.quantity;
      subtotal += lineTotal;
      return { productId: item.productId, sizeLabel: item.sizeLabel, quantity: item.quantity, unitPrice: sizePrice, totalPrice: lineTotal };
    });

    // ── 3. Validate & apply coupon ───────────────────────────────────────────
    let discountAmount = 0;
    let validatedCouponCode: string | undefined;
    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode.toUpperCase() },
      });

      if (!coupon || !coupon.isActive)
        throw new Error("کد تخفیف نامعتبر یا غیرفعال است");

      // Expiry
      if ((coupon as { expiresAt?: Date | null }).expiresAt &&
          (coupon as { expiresAt: Date }).expiresAt < new Date())
        throw new Error("کد تخفیف منقضی شده است");

      // Total usage limit
      const maxUsage = (coupon as { maxUsageCount?: number | null }).maxUsageCount;
      if (maxUsage != null && coupon.usedCount >= maxUsage)
        throw new Error("ظرفیت این کد تخفیف پر شده است");

      // Per-user usage limit
      const maxPerUser = (coupon as { maxUsagePerUser?: number | null }).maxUsagePerUser;
      if (maxPerUser != null) {
        const userUsage = await prisma.order.count({
          where: { userId: session.user.id, couponCode: coupon.code },
        });
        if (userUsage >= maxPerUser)
          throw new Error("شما قبلاً از این کد تخفیف استفاده کرده‌اید");
      }

      // Minimum order amount
      const minOrder = (coupon as { minOrderAmount?: number | null }).minOrderAmount;
      if (minOrder != null && subtotal < minOrder)
        throw new Error(`حداقل مبلغ سفارش برای این کد ${minOrder.toLocaleString("fa-IR")} تومان است`);

      const raw = coupon.discountType === "percent"
        ? Math.round((subtotal * coupon.discountValue) / 100)
        : coupon.discountValue;
      discountAmount = Math.min(Math.round(raw), subtotal);
      validatedCouponCode = coupon.code;
    }

    const taxBase     = Math.max(0, subtotal - discountAmount);
    const taxAmount   = Math.round(taxBase * 0.1);
    const totalAmount = Math.max(0, taxBase + taxAmount);

    // ── 4. Create order + decrement stock atomically ─────────────────────────
    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock with optimistic check (prevents overselling)
      for (const item of orderItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stockQty: { gte: item.quantity } },
          data: { stockQty: { decrement: item.quantity }, saleCount: { increment: item.quantity } },
        });
        if (updated.count === 0) {
          const p = products.find((x) => x.id === item.productId)!;
          throw new Error(`موجودی «${p.name}» در لحظه ثبت کافی نبود`);
        }
      }

      // Increment coupon used count
      if (validatedCouponCode) {
        await tx.coupon.update({
          where: { code: validatedCouponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return tx.order.create({
        data: {
          orderNumber: generateOrderNum(),
          userId: session.user.id,
          addressId: data.addressId,
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          couponCode: validatedCouponCode,
          notes: data.notes,
          shippingMethod: data.shippingMethod ?? "standard",
          items: { create: orderItems },
        },
        include: { items: true },
      });
    });

    // ── 5. Handle free / wallet / gateway payment ────────────────────────────

    // 100% discount — auto-complete without gateway
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
        // Roll back stock (order is already committed — mark CANCELLED instead of delete)
        await prisma.$transaction([
          prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } }),
          ...orderItems.map((item) =>
            prisma.product.update({
              where: { id: item.productId },
              data: { stockQty: { increment: item.quantity }, saleCount: { decrement: item.quantity } },
            })
          ),
        ]);
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

    // Gateway payment — return order for frontend to redirect
    return NextResponse.json({ success: true, order }, { status: 201 });

  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    const message = err instanceof Error ? err.message : "خطای سرور";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
