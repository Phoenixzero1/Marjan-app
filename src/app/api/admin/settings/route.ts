import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function requireAdmin() {
  const session = await auth();
  return session?.user?.id && ADMIN_ROLES.includes(session.user.role ?? "") ? session : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group") ?? "";

  const where = group ? { group } : {};
  const settings = await prisma.siteSettings.findMany({ where, orderBy: { key: "asc" } });

  // Return as a key->value map for convenience
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
  return NextResponse.json({ settings, map });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const parsed = z.record(z.string(), z.string()).safeParse(body.settings);
  if (!parsed.success) return NextResponse.json({ error: "داده‌های نامعتبر" }, { status: 400 });

  const group = body.group ?? "general";

  // Upsert each key
  const updates = Object.entries(parsed.data).map(([key, value]) =>
    prisma.siteSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value, group },
    })
  );

  await Promise.all(updates);
  return NextResponse.json({ success: true });
}
