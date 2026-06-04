import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";
import { revalidateTag } from "next/cache";
import { SETTINGS_TAG } from "@/lib/settings";
import { z } from "zod";

const schema = z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
  estimated: z.string().optional(),
});

export async function GET() {
  if (!(await requirePermission("MANAGE_SETTINGS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const rows = await prisma.siteSettings.findMany({
    where: { key: { in: ["maintenance_mode", "maintenance_message", "maintenance_estimated"] } },
    select: { key: true, value: true },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return NextResponse.json({
    enabled: map.maintenance_mode === "true",
    message: map.maintenance_message ?? "",
    estimated: map.maintenance_estimated ?? "",
  });
}

export async function POST(req: NextRequest) {
  const session = await requirePermission("MANAGE_SETTINGS");
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "داده‌های نامعتبر" }, { status: 400 });

  const { enabled, message, estimated } = parsed.data;

  await Promise.all([
    prisma.siteSettings.upsert({ where: { key: "maintenance_mode" }, update: { value: String(enabled) }, create: { key: "maintenance_mode", value: String(enabled), group: "maintenance" } }),
    ...(message !== undefined ? [prisma.siteSettings.upsert({ where: { key: "maintenance_message" }, update: { value: message }, create: { key: "maintenance_message", value: message, group: "maintenance" } })] : []),
    ...(estimated !== undefined ? [prisma.siteSettings.upsert({ where: { key: "maintenance_estimated" }, update: { value: estimated }, create: { key: "maintenance_estimated", value: estimated, group: "maintenance" } })] : []),
  ]);

  revalidateTag(SETTINGS_TAG, "max");

  audit({
    userId: (session.user as { id: string }).id,
    action: enabled ? "MAINTENANCE_ENABLED" : "MAINTENANCE_DISABLED",
    entity: "SiteSettings",
    newValue: { enabled, message, estimated },
    ip: getClientIp(req),
    ua: req.headers.get("user-agent"),
  });

  // Set a cookie the proxy reads to enforce maintenance mode — no DB hit on every request
  const res = NextResponse.json({ success: true, enabled });
  res.cookies.set("maintenance_mode", String(enabled), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: enabled ? 365 * 24 * 60 * 60 : 0, // clear immediately when disabling
  });
  return res;
}
