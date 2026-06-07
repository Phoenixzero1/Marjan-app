export const dynamic = 'force-dynamic'
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
  { slug: "about", title: "Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ù…Ø§", content: "<h2>Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ù…Ø§Ø±Ø¬Ø§Ù†</h2><p>Ø¨ÛŒØ´ Ø§Ø² Û±Ûµ Ø³Ø§Ù„ ØªØ¬Ø±Ø¨Ù‡ Ø¯Ø± ØªØ£Ù…ÛŒÙ† Ù„ÙˆØ§Ø²Ù… Ø³Ø§Ø®ØªÙ…Ø§Ù†ÛŒ Ùˆ ØªØ£Ø³ÛŒØ³Ø§ØªÛŒ...</p>" },
  { slug: "terms", title: "Ù‚ÙˆØ§Ù†ÛŒÙ† Ùˆ Ù…Ù‚Ø±Ø±Ø§Øª", content: "<h2>Ù‚ÙˆØ§Ù†ÛŒÙ† Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø§Ø² Ø®Ø¯Ù…Ø§Øª Ù…Ø§Ø±Ø¬Ø§Ù†</h2><p>Ø¨Ø§ Ø®Ø±ÛŒØ¯ Ø§Ø² Ø§ÛŒÙ† ÙØ±ÙˆØ´Ú¯Ø§Ù‡ØŒ Ø´Ù…Ø§ Ù‚ÙˆØ§Ù†ÛŒÙ† Ø²ÛŒØ± Ø±Ø§ Ù…ÛŒâ€ŒÙ¾Ø°ÛŒØ±ÛŒØ¯...</p>" },
  { slug: "privacy", title: "Ø­Ø±ÛŒÙ… Ø®ØµÙˆØµÛŒ", content: "<h2>Ø³ÛŒØ§Ø³Øª Ø­Ø±ÛŒÙ… Ø®ØµÙˆØµÛŒ</h2><p>Ù…Ø§ Ø¨Ù‡ Ø­Ø±ÛŒÙ… Ø®ØµÙˆØµÛŒ Ø´Ù…Ø§ Ø§Ø­ØªØ±Ø§Ù… Ù…ÛŒâ€ŒÚ¯Ø°Ø§Ø±ÛŒÙ…...</p>" },
];

export async function GET(req: NextRequest) {
  const isAdmin = await requirePermission("MANAGE_SETTINGS");
  const slug = req.nextUrl.searchParams.get("slug");

  if (!isAdmin && !slug) return NextResponse.json({ error: "Ø¯Ø³ØªØ±Ø³ÛŒ Ù…Ù…Ù†ÙˆØ¹" }, { status: 403 });

  if (slug) {
    // Public endpoint â€” return single page by slug
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page || !page.isActive) return NextResponse.json({ error: "ØµÙØ­Ù‡ ÛŒØ§ÙØª Ù†Ø´Ø¯" }, { status: 404 });
    return NextResponse.json({ page });
  }

  // Admin â€” list all pages; seed defaults if empty
  let pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  if (pages.length === 0) {
    await prisma.page.createMany({ data: DEFAULT_PAGES });
    pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  }
  return NextResponse.json({ pages });
}

export async function PUT(req: NextRequest) {
  if (!(await requirePermission("MANAGE_SETTINGS")))
    return NextResponse.json({ error: "Ø¯Ø³ØªØ±Ø³ÛŒ Ù…Ù…Ù†ÙˆØ¹" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { slug, ...rest } = parsed.data;
  try {
    const page = await prisma.page.upsert({ where: { slug }, update: rest, create: parsed.data });
    return NextResponse.json({ page });
  } catch {
    return NextResponse.json({ error: "Ø®Ø·Ø§ Ø¯Ø± Ø°Ø®ÛŒØ±Ù‡ ØµÙØ­Ù‡" }, { status: 500 });
  }
}
