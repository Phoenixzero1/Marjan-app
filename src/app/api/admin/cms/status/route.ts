export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { SETTINGS_TAG } from "@/lib/settings";

const STATUS_KEYS = [
  "registration_closed",
  "orders_closed",
  "orders_closed_message",
  "emergency_banner",
  "emergency_banner_message",
] as const;

const schema = z.object({
  registration_closed: z.boolean().optional(),
  orders_closed: z.boolean().optional(),
  orders_closed_message: z.string().optional(),
  emergency_banner: z.boolean().optional(),
  emergency_banner_message: z.string().optional(),
});

export async function GET(req: NextRequest) {
  // Public: return current site status (for middleware / frontend checks)
  const rows = await prisma.siteSettings.findMany({
    where: { key: { in: [...STATUS_KEYS] } },
    select: { key: true, value: true },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return NextResponse.json({
    registrationClosed: map.registration_closed === "true",
    ordersClosed: map.orders_closed === "true",
    ordersClosedMessage: map.orders_closed_message ?? "سفارش‌گیری موقتاً متوقف شده است",
    emergencyBanner: map.emergency_banner === "true",
    emergencyBannerMessage: map.emergency_banner_message ?? "",
  });
}

export async function POST(req: NextRequest) {
  if (!(await requirePermission("MANAGE_SETTINGS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const updates = Object.entries(parsed.data).filter(([, v]) => v !== undefined);
  await Promise.all(updates.map(([key, value]) =>
    prisma.siteSettings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value), group: "status" },
    })
  ));

  revalidateTag(SETTINGS_TAG);
  return NextResponse.json({ success: true });
}
