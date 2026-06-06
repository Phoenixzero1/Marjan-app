import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";
import { revalidateTag } from "next/cache";
import { SETTINGS_TAG } from "@/lib/settings";export async function GET(req: NextRequest) {
  if (!(await requirePermission("MANAGE_SETTINGS"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group") ?? "";

  const where = group ? { group } : {};
  const settings = await prisma.siteSettings.findMany({ where, orderBy: { key: "asc" } });

  // Return as a key->value map for convenience
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
  return NextResponse.json({ settings, map });
}

export async function POST(req: NextRequest) {
  const session = await requirePermission("MANAGE_SETTINGS");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const parsed = z.record(z.string(), z.string()).safeParse(body.settings);
  if (!parsed.success) return NextResponse.json({ error: "داده‌های نامعتبر" }, { status: 400 });

  const group = body.group ?? "general";

  // Capture old values for audit
  const keys = Object.keys(parsed.data);
  const oldSettings = await prisma.siteSettings.findMany({ where: { key: { in: keys } } });
  const oldMap = Object.fromEntries(oldSettings.map((s) => [s.key, s.value]));

  const updates = Object.entries(parsed.data).map(([key, value]) =>
    prisma.siteSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value, group },
    })
  );

  await Promise.all(updates);
  revalidateTag(SETTINGS_TAG);
  audit({ userId: session.user.id, action: "SETTINGS_UPDATE", entity: "SiteSettings", newValue: parsed.data, oldValue: oldMap, ip: getClientIp(req), ua: req.headers.get("user-agent") });
  return NextResponse.json({ success: true });
}
