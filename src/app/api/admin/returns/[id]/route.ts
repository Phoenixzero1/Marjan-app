export const dynamic = 'force-dynamic'
﻿import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().optional(),
  refundAmount: z.number().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requirePermission("MANAGE_RETURNS"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { action, adminNote, refundAmount } = parsed.data;

  const returnReq = await prisma.returnRequest.findUnique({
    where: { id },
    include: { order: { select: { totalAmount: true } } },
  });
  if (!returnReq) return NextResponse.json({ error: "درخواست یافت نشد" }, { status: 404 });
  if (returnReq.status !== "PENDING") return NextResponse.json({ error: "این درخواست قبلاً پردازش شده" }, { status: 409 });

  const amount = refundAmount ?? returnReq.refundAmount ?? returnReq.order.totalAmount;

  const updated = await prisma.returnRequest.update({
    where: { id },
    data: { status: action, adminNote, refundAmount: amount },
  });

  // If approved: refund to wallet
  if (action === "APPROVED") {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId: returnReq.userId },
        update: { balance: { increment: amount } },
        create: { userId: returnReq.userId, balance: amount },
      });

      await tx.walletTx.create({
        data: {
          walletId: wallet.id,
          amount,
          type: "REFUND",
          description: `بازپرداخت مرجوعی — درخواست #${id.slice(-6)}`,
          refId: returnReq.orderId,
        },
      });

      // Notify user
      await tx.notification.create({
        data: {
          userId: returnReq.userId,
          type: "PAYMENT",
          title: "مرجوعی تأیید شد",
          body: `مبلغ ${amount.toLocaleString("fa-IR")} تومان به کیف پول شما واریز شد.`,
        },
      });

      // Update order status to RETURNED
      await tx.order.update({
        where: { id: returnReq.orderId },
        data: { status: "RETURNED" },
      });
    });
  } else {
    // Notify user of rejection
    await prisma.notification.create({
      data: {
        userId: returnReq.userId,
        type: "SYSTEM",
        title: "درخواست مرجوعی رد شد",
        body: adminNote ? `دلیل: ${adminNote}` : "درخواست مرجوعی شما تأیید نشد.",
      },
    });
  }

  return NextResponse.json({ returnRequest: updated });
}