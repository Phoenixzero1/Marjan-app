export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

import { prisma } from "@/lib/prisma";// POST — restore from a JSON backup file
// Accepts multipart/form-data with a "file" field
export async function POST(req: NextRequest) {
  const session = await requirePermission("MANAGE_BACKUP");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "فایل پشتیبان ارسال نشده" }, { status: 400 });
    if (!file.name.endsWith(".json")) {
      return NextResponse.json({ error: "فقط فایل‌های JSON پشتیبان پشتیبانی می‌شوند" }, { status: 400 });
    }
    const text = await file.text();
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "فایل پشتیبان معتبر نیست" }, { status: 400 });
  }

  if (!body.version || !body.exportedAt) {
    return NextResponse.json({ error: "فرمت فایل پشتیبان شناسایی نشد" }, { status: 400 });
  }

  const restored: string[] = [];
  const skipped: string[] = [];

  // Restore site settings (safe to upsert)
  if (Array.isArray(body.siteSettings)) {
    for (const s of body.siteSettings as { key: string; value: string; group: string }[]) {
      await prisma.siteSettings.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value, group: s.group ?? "general" },
      }).catch(() => {});
    }
    restored.push("siteSettings");
  }

  // Restore blog categories
  if (Array.isArray(body.blogCategories)) {
    for (const c of body.blogCategories as { id: string; name: string; slug: string }[]) {
      await prisma.blogCategory.upsert({
        where: { id: c.id },
        update: { name: c.name, slug: c.slug },
        create: { id: c.id, name: c.name, slug: c.slug },
      }).catch(() => skipped.push(`blogCategory:${c.id}`));
    }
    restored.push("blogCategories");
  }

  // Restore blog posts (no foreign key to authors required — authorId is optional)
  if (Array.isArray(body.blogPosts)) {
    for (const p of body.blogPosts as {
      id: string; title: string; slug: string; content: string;
      excerpt?: string; categoryId?: string; imageUrl?: string;
      isPublished: boolean; viewCount: number; tags: string[];
      metaTitle?: string; metaDesc?: string; publishedAt?: string; createdAt?: string;
    }[]) {
      await prisma.blogPost.upsert({
        where: { id: p.id },
        update: { title: p.title, slug: p.slug, content: p.content, isPublished: p.isPublished },
        create: {
          id: p.id, title: p.title, slug: p.slug, content: p.content,
          excerpt: p.excerpt, categoryId: p.categoryId, imageUrl: p.imageUrl,
          isPublished: p.isPublished, viewCount: p.viewCount ?? 0,
          tags: p.tags ?? [], metaTitle: p.metaTitle, metaDesc: p.metaDesc,
          publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
          createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
        },
      }).catch(() => skipped.push(`blogPost:${p.id}`));
    }
    restored.push("blogPosts");
  }

  // Restore newsletter subscribers
  if (Array.isArray(body.newsletter)) {
    for (const n of body.newsletter as { id: string; email: string; isActive: boolean }[]) {
      await prisma.newsletter.upsert({
        where: { email: n.email },
        update: { isActive: n.isActive },
        create: { id: n.id, email: n.email, isActive: n.isActive },
      }).catch(() => skipped.push(`newsletter:${n.email}`));
    }
    restored.push("newsletter");
  }

  // Log the restore action
  await prisma.systemLog.create({
    data: {
      userId: session.user.id,
      level: "WARNING",
      action: "BACKUP_RESTORE",
      details: { restored, skipped: skipped.length, backupDate: body.exportedAt },
    },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    restored,
    skippedCount: skipped.length,
    message: `${restored.length} جدول بازیابی شد. ${skipped.length} رکورد به دلیل تعارض نادیده گرفته شد.`,
  });
}
