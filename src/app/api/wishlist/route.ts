export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ items: [] });

  const items = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          brand: { select: { name: true } },
          sizes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Ù„Ø·ÙØ§Ù‹ ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "Ø´Ù†Ø§Ø³Ù‡ Ù…Ø­ØµÙˆÙ„ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª" }, { status: 400 });

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { userId_productId: { userId: session.user.id, productId } } });
    return NextResponse.json({ removed: true });
  }

  const item = await prisma.wishlist.create({
    data: { userId: session.user.id, productId },
  });

  return NextResponse.json({ item, added: true });
}
