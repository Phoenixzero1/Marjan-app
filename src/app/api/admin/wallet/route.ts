export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!(await requirePermission("VIEW_FINANCE"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "";

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeWallets, totalBalanceAgg, monthChargeAgg] = await Promise.all([
    prisma.wallet.count(),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.walletTx.aggregate({
      _sum: { amount: true },
      where: { type: "DEPOSIT", createdAt: { gte: startOfMonth } },
    }),
  ]);

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (q) {
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, txs] = await Promise.all([
    prisma.walletTx.count({ where }),
    prisma.walletTx.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        wallet: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      activeWallets,
      totalBalance: totalBalanceAgg._sum.balance ?? 0,
      monthCharge: monthChargeAgg._sum.amount ?? 0,
    },
    transactions: txs.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      refId: tx.refId,
      createdAt: tx.createdAt.toISOString(),
      user: tx.wallet?.user ?? null,
      walletBalance: tx.wallet?.balance ?? 0,
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  if (!(await requirePermission("MANAGE_SETTINGS"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const { userId, amount, type, description } = body;
  if (!userId || !amount || !type) return NextResponse.json({ error: "داده‌های ناقص" }, { status: 400 });
  if (!["DEPOSIT", "WITHDRAWAL"].includes(type)) return NextResponse.json({ error: "نوع تراکنش نادرست" }, { status: 400 });

  const amtInt = Math.abs(parseInt(String(amount)));
  if (isNaN(amtInt) || amtInt <= 0) return NextResponse.json({ error: "مبلغ نادرست" }, { status: 400 });

  const wallet = await prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 },
  });

  if (type === "WITHDRAWAL" && wallet.balance < amtInt) {
    return NextResponse.json({ error: "موجودی کافی نیست" }, { status: 400 });
  }

  const newBalance = type === "DEPOSIT" ? wallet.balance + amtInt : wallet.balance - amtInt;

  await prisma.$transaction([
    prisma.wallet.update({ where: { userId }, data: { balance: newBalance } }),
    prisma.walletTx.create({
      data: {
        walletId: wallet.id,
        type,
        amount: amtInt,
        description: description || (type === "DEPOSIT" ? "شارژ توسط ادمین" : "برداشت توسط ادمین"),
      },
    }),
  ]);

  return NextResponse.json({ success: true, newBalance });
}
