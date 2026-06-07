export const dynamic = 'force-dynamic'
﻿import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requirePermission("MANAGE_BLOG"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = params;

  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!post) return NextResponse.json({ error: "مقاله یافت نشد" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requirePermission("MANAGE_BLOG");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = params;

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    const { slug, isPublished, ...rest } = parsed.data;

    if (slug) {
      const existing = await prisma.blogPost.findUnique({ where: { slug } });
      if (existing && existing.id !== id) return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است" }, { status: 409 });
    }

    const current = await prisma.blogPost.findUnique({ where: { id }, select: { isPublished: true, publishedAt: true, title: true } });
    const setPublishedAt = isPublished && !current?.isPublished && !current?.publishedAt
      ? { publishedAt: new Date() }
      : {};

    const post = await prisma.blogPost.update({
      where: { id },
      data: { ...rest, ...(slug ? { slug } : {}), ...(isPublished !== undefined ? { isPublished } : {}), ...setPublishedAt },
      include: { category: { select: { id: true, name: true } } },
    });

    const action = isPublished && !current?.isPublished ? "BLOG_POST_PUBLISH" : "BLOG_POST_UPDATE";
    audit({ userId: session.user.id, action, entity: "BlogPost", entityId: id, oldValue: { title: current?.title, isPublished: current?.isPublished }, newValue: { title: post.title, isPublished: post.isPublished }, ip: getClientIp(req), ua: req.headers.get("user-agent") });
    return NextResponse.json({ post });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requirePermission("MANAGE_BLOG");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = params;

  try {
    const before = await prisma.blogPost.findUnique({ where: { id }, select: { title: true, slug: true, isPublished: true } });
    await prisma.blogPost.update({ where: { id }, data: { deletedAt: new Date(), isPublished: false } });
    audit({ userId: session.user.id, action: "BLOG_POST_DELETE", entity: "BlogPost", entityId: id, oldValue: before, ip: getClientIp(req), ua: req.headers.get("user-agent") });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "خطا در حذف مقاله" }, { status: 500 });
  }
}