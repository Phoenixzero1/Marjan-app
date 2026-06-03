import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"];

async function requireAdmin() {
  const session = await auth();
  return session?.user?.id && ADMIN_ROLES.includes(session.user.role ?? "") ? session : null;
}

const schema = z.object({
  name: z.string().min(2, "نام الزامی است"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف انگلیسی، اعداد و خط تیره"),
});

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const categories = await prisma.blogCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const existing = await prisma.blogCategory.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است" }, { status: 409 });

  const category = await prisma.blogCategory.create({ data: parsed.data });
  return NextResponse.json({ category }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  const count = await prisma.blogPost.count({ where: { categoryId: id } });
  if (count > 0) return NextResponse.json({ error: `این دسته دارای ${count} مقاله است. ابتدا مقالات را منتقل کنید.` }, { status: 409 });

  await prisma.blogCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
