import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  buttonText: z.string().optional().nullable(),
  buttonLink: z.string().optional().nullable(),
  type: z.enum(["hero", "promo"]).default("hero"),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

// Public GET — used by homepage
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "hero";
  const isAdmin = !!(await requirePermission("MANAGE_SETTINGS"));

  const banners = await prisma.banner.findMany({
    where: isAdmin ? { type } : { type, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  if (!(await requirePermission("MANAGE_SETTINGS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const banner = await prisma.banner.create({ data: parsed.data });
  return NextResponse.json({ banner }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await requirePermission("MANAGE_SETTINGS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id الزامی است" }, { status: 400 });

  const parsed = schema.partial().safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const banner = await prisma.banner.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ banner });
}

export async function DELETE(req: NextRequest) {
  if (!(await requirePermission("MANAGE_SETTINGS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id الزامی است" }, { status: 400 });

  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
