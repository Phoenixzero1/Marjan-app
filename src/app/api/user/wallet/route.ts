export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ balance: 0, transactions: [] });
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
    return NextResponse.json({
      balance: wallet?.balance ?? 0,
      transactions: wallet?.transactions ?? [],
    });
  } catch {
    return NextResponse.json({ balance: 0, transactions: [] });
  }
}
