export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const KEYS = ["slider_autoplay", "slider_interval", "slider_arrows", "slider_dots"] as const;

function parseSettings(rows: { key: string; value: string }[]) {
  const get = (key: string, def: string) => rows.find((r) => r.key === key)?.value ?? def;
  return {
    autoPlay: get("slider_autoplay", "true") === "true",
    interval: parseInt(get("slider_interval", "5000")),
    showArrows: get("slider_arrows", "true") === "true",
    showDots: get("slider_dots", "true") === "true",
  };
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  try {
    const rows = await prisma.siteSettings.findMany({ where: { key: { in: [...KEYS] } } });
    return NextResponse.json(parseSettings(rows));
  } catch {
    return NextResponse.json({ autoPlay: true, interval: 5000, showArrows: true, showDots: true });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });
  try {
    const body = await req.json();
    const updates = [
      { key: "slider_autoplay", value: String(body.autoPlay ?? true) },
      { key: "slider_interval", value: String(body.interval ?? 5000) },
      { key: "slider_arrows", value: String(body.showArrows ?? true) },
      { key: "slider_dots", value: String(body.showDots ?? true) },
    ];
    await prisma.$transaction(
      updates.map((u) =>
        prisma.siteSettings.upsert({
          where: { key: u.key },
          update: { value: u.value },
          create: { key: u.key, value: u.value, group: "slider" },
        })
      )
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
