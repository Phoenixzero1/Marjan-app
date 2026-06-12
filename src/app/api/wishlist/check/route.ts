export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ inWishlist: false });

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ inWishlist: false });

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
    select: { id: true },
  });

  return NextResponse.json({ inWishlist: !!existing });
}
