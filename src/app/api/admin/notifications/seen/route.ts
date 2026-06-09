export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const VALID_SECTIONS = ["orders", "comments", "blog"] as const;
type Section = typeof VALID_SECTIONS[number];

// GET /api/admin/notifications/seen
// Returns { orders: N, comments: N, blog: N } — seenCount per section for this admin
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 400 });

  const rows = await prisma.adminSeenSection.findMany({
    where: { userId },
    select: { section: true, seenCount: true },
  });

  const result: Record<string, number> = { orders: 0, comments: 0, blog: 0 };
  for (const row of rows) {
    if (row.section in result) result[row.section] = row.seenCount;
  }

  return NextResponse.json(result);
}

// PUT /api/admin/notifications/seen
// Body: { section: "orders" | "comments" | "blog", count: N }
// Sets seenCount = count so badge = max(0, rawCount - count) = 0
export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 400 });

  const body = await req.json();
  const section = body.section as Section;
  const count: number = typeof body.count === "number" ? body.count : 0;

  if (!VALID_SECTIONS.includes(section))
    return NextResponse.json({ error: "بخش نامعتبر" }, { status: 400 });

  await prisma.adminSeenSection.upsert({
    where: { userId_section: { userId, section } },
    update: { seenCount: count },
    create: { userId, section, seenCount: count },
  });

  return NextResponse.json({ ok: true });
}
