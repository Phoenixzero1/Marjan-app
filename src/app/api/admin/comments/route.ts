import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"];

async function requireAdmin() {
  const session = await auth();
  return session?.user?.id && ADMIN_ROLES.includes(session.user.role ?? "") ? session : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "reviews"; // "reviews" | "blog"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const approved = searchParams.get("approved") ?? "";
  const q = searchParams.get("q") ?? "";

  if (tab === "blog") {
    const where: Record<string, unknown> = {};
    if (approved === "true") where.isApproved = true;
    if (approved === "false") where.isApproved = false;
    if (q) where.OR = [
      { content: { contains: q, mode: "insensitive" } },
      { authorName: { contains: q, mode: "insensitive" } },
    ];

    const [total, comments] = await Promise.all([
      prisma.blogComment.count({ where }),
      prisma.blogComment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { post: { select: { id: true, title: true, slug: true } } },
      }),
    ]);

    const [pendingCount] = await Promise.all([
      prisma.blogComment.count({ where: { isApproved: false } }),
    ]);

    return NextResponse.json({ items: comments, total, page, pages: Math.ceil(total / limit), pendingCount });
  }

  // Reviews
  const where: Record<string, unknown> = {};
  if (approved === "true") where.isApproved = true;
  if (approved === "false") where.isApproved = false;
  if (q) where.OR = [
    { title: { contains: q, mode: "insensitive" } },
    { content: { contains: q, mode: "insensitive" } },
  ];

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  const pendingCount = await prisma.review.count({ where: { isApproved: false } });

  return NextResponse.json({ items: reviews, total, page, pages: Math.ceil(total / limit), pendingCount });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id, tab, isApproved } = await req.json();
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  if (tab === "blog") {
    const comment = await prisma.blogComment.update({ where: { id }, data: { isApproved } });
    return NextResponse.json({ comment });
  }

  const review = await prisma.review.update({ where: { id }, data: { isApproved } });
  return NextResponse.json({ review });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id, tab } = await req.json();
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  if (tab === "blog") {
    await prisma.blogComment.delete({ where: { id } });
  } else {
    await prisma.review.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
