import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  menu: z.enum(["header", "footer"]),
  label: z.string().min(1),
  url: z.string().min(1),
  newTab: z.boolean().default(false),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

const DEFAULT_HEADER = [
  { menu: "header", label: "خانه", url: "/", sortOrder: 0 },
  { menu: "header", label: "محصولات", url: "/products", sortOrder: 1 },
  { menu: "header", label: "وبلاگ", url: "/blog", sortOrder: 2 },
  { menu: "header", label: "درباره ما", url: "/about", sortOrder: 3 },
  { menu: "header", label: "تماس با ما", url: "/contact", sortOrder: 4 },
];

const DEFAULT_FOOTER = [
  { menu: "footer", label: "محصولات", url: "/products", sortOrder: 0 },
  { menu: "footer", label: "وبلاگ", url: "/blog", sortOrder: 1 },
  { menu: "footer", label: "درباره ما", url: "/about", sortOrder: 2 },
  { menu: "footer", label: "تماس با ما", url: "/contact", sortOrder: 3 },
  { menu: "footer", label: "قوانین", url: "/terms", sortOrder: 4 },
  { menu: "footer", label: "حریم خصوصی", url: "/privacy", sortOrder: 5 },
];

// Public GET — returns menu items for header or footer
export async function GET(req: NextRequest) {
  const menu = req.nextUrl.searchParams.get("menu") ?? "header";
  const isAdmin = !!(await requirePermission("MANAGE_SETTINGS"));

  let items = await prisma.menuItem.findMany({
    where: isAdmin ? { menu } : { menu, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Seed defaults on first load
  if (items.length === 0 && !isAdmin) {
    const defaults = menu === "footer" ? DEFAULT_FOOTER : DEFAULT_HEADER;
    await prisma.menuItem.createMany({ data: defaults });
    items = await prisma.menuItem.findMany({ where: { menu, isActive: true }, orderBy: { sortOrder: "asc" } });
  }

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await requirePermission("MANAGE_SETTINGS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const body = await req.json();
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const item = await prisma.menuItem.create({ data: parsed.data });
  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await requirePermission("MANAGE_SETTINGS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id الزامی است" }, { status: 400 });

  const parsed = itemSchema.partial().safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const item = await prisma.menuItem.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
  if (!(await requirePermission("MANAGE_SETTINGS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id الزامی است" }, { status: 400 });

  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
