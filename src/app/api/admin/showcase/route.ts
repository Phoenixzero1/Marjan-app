import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

const KEY = "featured_showcase";

export async function GET() {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { key: KEY } });
    const config = row ? JSON.parse(row.value) : { slides: [] };
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ slides: [] });
  }
}

export async function POST(req: Request) {
  try { await requireAdmin(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    await prisma.siteSettings.upsert({
      where: { key: KEY },
      create: { key: KEY, value: JSON.stringify(body) },
      update: { value: JSON.stringify(body) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
