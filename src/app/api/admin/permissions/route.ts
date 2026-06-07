export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission, ALL_PERMISSIONS, ROLE_PERMISSIONS, sessionHasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";
import { z } from "zod";

/** GET /api/admin/permissions?userId=xxx  â†’  { permissions: [{permission, granted, isDefault}] } */
export async function GET(req: NextRequest) {
  const session = await requirePermission("MANAGE_ROLES");
  if (!session) return NextResponse.json({ error: "Ø¯Ø³ØªØ±Ø³ÛŒ Ù…Ù…Ù†ÙˆØ¹" }, { status: 403 });

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª" }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, permissions: { select: { permission: true, granted: true } } },
  });
  if (!target) return NextResponse.json({ error: "Ú©Ø§Ø±Ø¨Ø± ÛŒØ§ÙØª Ù†Ø´Ø¯" }, { status: 404 });

  const overrides = target.permissions;
  const roleDefaults: string[] = ROLE_PERMISSIONS[target.role] ?? [];

  const result = ALL_PERMISSIONS.map((p) => {
    const override = overrides.find((o) => o.permission === p);
    const isDefault = override === undefined;
    const granted = override ? override.granted : roleDefaults.includes(p);
    return { permission: p, granted, isDefault };
  });

  return NextResponse.json({ permissions: result, role: target.role });
}

/** PATCH /api/admin/permissions  â†’  set override for a permission */
export async function PATCH(req: NextRequest) {
  const session = await requirePermission("MANAGE_ROLES");
  if (!session) return NextResponse.json({ error: "Ø¯Ø³ØªØ±Ø³ÛŒ Ù…Ù…Ù†ÙˆØ¹" }, { status: 403 });

  const body = await req.json();
  const parsed = z.object({
    userId: z.string(),
    permission: z.enum(ALL_PERMISSIONS as [string, ...string[]]),
    granted: z.boolean().nullable(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ø¯Ø§Ø¯Ù‡â€ŒÙ‡Ø§ÛŒ Ù†Ø§Ù…Ø¹ØªØ¨Ø±" }, { status: 400 });

  const { userId, permission, granted } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return NextResponse.json({ error: "Ú©Ø§Ø±Ø¨Ø± ÛŒØ§ÙØª Ù†Ø´Ø¯" }, { status: 404 });
  if (target.role === "SUPER_ADMIN") return NextResponse.json({ error: "Ù†Ù…ÛŒâ€ŒØªÙˆØ§Ù† Ø¯Ø³ØªØ±Ø³ÛŒ Ù…Ø¯ÛŒØ± Ø§Ø±Ø´Ø¯ Ø±Ø§ Ù…Ø­Ø¯ÙˆØ¯ Ú©Ø±Ø¯" }, { status: 403 });

  if (granted === null) {
    // Remove override â†’ revert to role default
    await prisma.userPermission.deleteMany({ where: { userId, permission } });
  } else {
    await prisma.userPermission.upsert({
      where: { userId_permission: { userId, permission } },
      update: { granted },
      create: { userId, permission, granted },
    });
  }

  audit({
    userId: (session.user as { id: string }).id,
    action: "PERMISSION_CHANGE",
    entity: "UserPermission",
    entityId: userId,
    newValue: { permission, granted },
    ip: getClientIp(req),
    ua: req.headers.get("user-agent"),
  });

  return NextResponse.json({ success: true });
}

/** DELETE /api/admin/permissions  â†’  reset all overrides for a user */
export async function DELETE(req: NextRequest) {
  const session = await requirePermission("MANAGE_ROLES");
  if (!session) return NextResponse.json({ error: "Ø¯Ø³ØªØ±Ø³ÛŒ Ù…Ù…Ù†ÙˆØ¹" }, { status: 403 });

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª" }, { status: 400 });

  await prisma.userPermission.deleteMany({ where: { userId } });

  audit({
    userId: (session.user as { id: string }).id,
    action: "PERMISSIONS_RESET",
    entity: "UserPermission",
    entityId: userId,
    ip: getClientIp(req),
    ua: req.headers.get("user-agent"),
  });

  return NextResponse.json({ success: true });
}
