import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function requireAdmin() {
  const session = await auth();
  return session?.user?.id && ADMIN_ROLES.includes(session.user.role ?? "") ? session : null;
}

// GET: return record counts for each table + last backup time
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const [
    users, products, categories, orders, payments,
    coupons, blogPosts, blogCategories, reviews,
    blogComments, media, newsletter, siteSettings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.coupon.count(),
    prisma.blogPost.count(),
    prisma.blogCategory.count(),
    prisma.review.count(),
    prisma.blogComment.count(),
    prisma.media.count(),
    prisma.newsletter.count(),
    prisma.siteSettings.count(),
  ]);

  const lastBackupSetting = await prisma.siteSettings.findUnique({ where: { key: "last_backup_at" } });

  return NextResponse.json({
    counts: {
      users, products, categories, orders, payments,
      coupons, blogPosts, blogCategories, reviews,
      blogComments, media, newsletter, siteSettings,
    },
    lastBackupAt: lastBackupSetting?.value ?? null,
  });
}

// POST: generate backup JSON for selected tables
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { tables } = await req.json() as { tables: string[] };
  if (!Array.isArray(tables) || tables.length === 0) {
    return NextResponse.json({ error: "حداقل یک جدول انتخاب کنید" }, { status: 400 });
  }

  const backup: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };

  const fetchers: Record<string, () => Promise<unknown>> = {
    users:          () => prisma.user.findMany({ omit: { passwordHash: true } as never }),
    products:       () => prisma.product.findMany({ include: { sizes: true } }),
    categories:     () => prisma.category.findMany(),
    orders:         () => prisma.order.findMany({ include: { items: true } }),
    payments:       () => prisma.payment.findMany(),
    coupons:        () => prisma.coupon.findMany(),
    blogPosts:      () => prisma.blogPost.findMany(),
    blogCategories: () => prisma.blogCategory.findMany(),
    reviews:        () => prisma.review.findMany(),
    blogComments:   () => prisma.blogComment.findMany(),
    media:          () => prisma.media.findMany(),
    newsletter:     () => prisma.newsletter.findMany(),
    siteSettings:   () => prisma.siteSettings.findMany(),
    addresses:      () => prisma.address.findMany(),
    brands:         () => prisma.brand.findMany(),
    faqs:           () => prisma.faq.findMany(),
  };

  for (const table of tables) {
    if (fetchers[table]) {
      backup[table] = await fetchers[table]();
    }
  }

  // Record last backup time
  await prisma.siteSettings.upsert({
    where: { key: "last_backup_at" },
    update: { value: new Date().toISOString() },
    create: { key: "last_backup_at", value: new Date().toISOString(), group: "system" },
  });

  const json = JSON.stringify(backup, null, 2);
  const filename = `marjan-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
