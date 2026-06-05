import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

const DEFAULT_PAGES = [
  { slug: "about", title: "درباره ما", content: "<h2>درباره مارجان</h2><p>بیش از ۱۵ سال تجربه در تأمین لوازم ساختمانی و تأسیساتی...</p>" },
  { slug: "terms", title: "قوانین و مقررات", content: "<h2>قوانین استفاده از خدمات مارجان</h2><p>با خرید از این فروشگاه، شما قوانین زیر را می‌پذیرید...</p>" },
  { slug: "privacy", title: "حریم خصوصی", content: "<h2>سیاست حریم خصوصی</h2><p>ما به حریم خصوصی شما احترام می‌گذاریم...</p>" },
];

export async function GET(req: NextRequest) {
  const isAdmin = await requirePermission("MANAGE_SETTINGS");
  const slug = req.nextUrl.searchParams.get("slug");

  if (!isAdmin && !slug) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  if (slug) {
    // Public endpoint — return single page by slug
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page || !page.isActive) return NextResponse.json({ error: "صفحه یافت نشد" }, { status: 404 });
    return NextResponse.json({ page });
  }

  // Admin — list all pages; seed defaults if empty
  let pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  if (pages.length === 0) {
    await prisma.page.createMany({ data: DEFAULT_PAGES });
    pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  }
  return NextResponse.json({ pages });
}

export async function PUT(req: NextRequest) {
  if (!(await requirePermission("MANAGE_SETTINGS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { slug, ...rest } = parsed.data;
  const page = await prisma.page.upsert({
    where: { slug },
    update: rest,
    create: parsed.data,
  });

  return NextResponse.json({ page });
}
