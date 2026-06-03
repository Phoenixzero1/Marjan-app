import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"];

async function requireAdmin() {
  const session = await auth();
  return session?.user?.id && ADMIN_ROLES.includes(session.user.role ?? "") ? session : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "40"));
  const folder = searchParams.get("folder") ?? "";
  const q = searchParams.get("q") ?? "";
  const mimeType = searchParams.get("mimeType") ?? "";

  const where: Record<string, unknown> = {};
  if (folder) where.folder = folder;
  if (q) where.originalName = { contains: q, mode: "insensitive" };
  if (mimeType === "image") where.mimeType = { startsWith: "image/" };
  if (mimeType === "pdf") where.mimeType = "application/pdf";

  const [total, items] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "فایل یافت نشد" }, { status: 404 });

  // Delete physical file
  try {
    const filePath = path.join(process.cwd(), "public", media.url);
    await unlink(filePath);
  } catch {
    // File may already be gone — continue with DB deletion
  }

  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
