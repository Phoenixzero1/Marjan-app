import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().min(1),
  sizeId: z.string().optional().nullable(),
  quantity: z.number().int().min(1).max(100),
});

// GET — load cart from DB for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ items: [] });
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          sizes: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ items });
}

// POST — add or update cart item
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { productId, sizeId, quantity } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId, status: "PUBLISHED" },
    select: { id: true, stockQty: true },
  });
  if (!product) {
    return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
  }

  const resolvedSizeId = sizeId ?? null;

  // Prisma composite unique with nullable field requires findFirst + update/create pattern
  const existing = await prisma.cartItem.findFirst({
    where: { userId: session.user.id, productId, sizeId: resolvedSizeId },
  });

  const item = existing
    ? await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } })
    : await prisma.cartItem.create({
        data: { userId: session.user.id, productId, sizeId: resolvedSizeId, quantity },
      });

  return NextResponse.json({ item });
}

// DELETE — remove item from DB cart
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
  }

  const { productId, sizeId } = await req.json();

  await prisma.cartItem.deleteMany({
    where: {
      userId: session.user.id,
      productId,
      sizeId: sizeId ?? null,
    },
  });

  return NextResponse.json({ success: true });
}
