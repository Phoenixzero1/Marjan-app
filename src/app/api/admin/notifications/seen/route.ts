export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const VALID_SECTIONS = ["orders", "comments", "blog", "returns", "sessions", "logs"] as const;
type Section = typeof VALID_SECTIONS[number];

const FALLBACK = { orders: 0, comments: 0, blog: 0, returns: 0, sessions: 0, logs: 0 };

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json(FALLBACK);

    const rows = await prisma.adminSeenSection.findMany({
      where: { userId },
      select: { section: true, seenCount: true },
    });

    const result: Record<string, number> = { ...FALLBACK };
    for (const row of rows) {
      if (row.section in result) result[row.section] = row.seenCount;
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}

export async function PUT(req: NextRequest) {
  try {
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
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
