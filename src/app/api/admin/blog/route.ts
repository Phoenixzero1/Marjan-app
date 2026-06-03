import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"];

async function requireAdmin() {
  const session = await auth();
  return session?.user?.id && ADMIN_ROLES.includes(session.user.role ?? "") ? session : null;
}

const postSchema = z.object({
  title: z.string().min(2, "عنوان الزامی است"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف انگلیسی، اعداد و خط تیره"),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(1, "محتوا الزامی است"),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isPublished: z.boolean().default(false),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const q = searchParams.get("q");
  const categoryId = searchParams.get("categoryId");
  const published = searchParams.get("published");

  const where: Record<string, unknown> = { deletedAt: null };
  if (q) where.OR = [
    { title: { contains: q, mode: "insensitive" } },
    { excerpt: { contains: q, mode: "insensitive" } },
  ];
  if (categoryId) where.categoryId = categoryId;
  if (published === "true") where.isPublished = true;
  if (published === "false") where.isPublished = false;

  const [posts, total] = await prisma.$transaction([
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return NextResponse.json({ posts, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  try {
    const body = await req.json();
    const data = postSchema.parse(body);

    const existing = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
    if (existing) return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است" }, { status: 409 });

    const post = await prisma.blogPost.create({
      data: {
        ...data,
        authorId: session.user.id,
        publishedAt: data.isPublished ? new Date() : null,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    audit({ userId: session.user.id, action: data.isPublished ? "BLOG_POST_PUBLISH" : "BLOG_POST_CREATE", entity: "BlogPost", entityId: post.id, newValue: { title: post.title, slug: post.slug, isPublished: post.isPublished }, ip: getClientIp(req), ua: req.headers.get("user-agent") });
    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
