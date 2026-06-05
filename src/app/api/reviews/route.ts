import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  productId: z.string().min(1, "شناسه محصول الزامی است"),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { productId, rating, title, content } = parsed.data;

  // Check user purchased this product
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: session.user.id, status: { in: ["DELIVERED", "CONFIRMED"] } },
    },
  });

  // Allow review even without purchase but flag it
  const existing = await prisma.review.findFirst({
    where: { productId, userId: session.user.id },
  });

  const review = existing
    ? await prisma.review.update({
        where: { id: existing.id },
        data: { rating, title: title ?? null, content: content ?? null, isApproved: false },
      })
    : await prisma.review.create({
        data: {
          productId,
          userId: session.user.id,
          reviewerName: undefined,
          rating,
          title: title ?? null,
          content: content ?? null,
          isApproved: !!purchased,
        },
      });

  return NextResponse.json({
    review,
    message: review.isApproved
      ? "نظر شما با موفقیت ثبت شد"
      : "نظر شما ثبت شد و پس از تأیید نمایش داده خواهد شد",
  });
}

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "شناسه محصول الزامی است" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });

  const avg = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return NextResponse.json({ reviews, avgRating: avg, count: reviews.length });
}
