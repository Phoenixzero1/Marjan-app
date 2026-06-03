import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"];

async function requireAdmin() {
  const session = await auth();
  return session?.user?.id && ADMIN_ROLES.includes(session.user.role ?? "") ? session : null;
}

/** Gather every URL currently referenced by any model. */
async function getReferencedUrls(): Promise<Set<string>> {
  const [productImages, blogPosts, categories, brands, users] = await Promise.all([
    prisma.productImage.findMany({ select: { url: true } }),
    prisma.blogPost.findMany({ select: { imageUrl: true } }),
    prisma.category.findMany({ select: { imageUrl: true } }),
    prisma.brand.findMany({ select: { logoUrl: true } }),
    prisma.user.findMany({ select: { avatarUrl: true } }),
  ]);

  const urls = new Set<string>();
  productImages.forEach((r) => urls.add(r.url));
  blogPosts.forEach((r) => { if (r.imageUrl) urls.add(r.imageUrl); });
  categories.forEach((r) => { if (r.imageUrl) urls.add(r.imageUrl); });
  brands.forEach((r) => { if (r.logoUrl) urls.add(r.logoUrl); });
  users.forEach((r) => { if (r.avatarUrl) urls.add(r.avatarUrl); });
  return urls;
}

// GET — return unused files + storage stats
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const [allMedia, referenced] = await Promise.all([
    prisma.media.findMany({ orderBy: { createdAt: "desc" } }),
    getReferencedUrls(),
  ]);

  const unused = allMedia.filter((m) => !referenced.has(m.url));

  const totalSize = allMedia.reduce((s, m) => s + m.size, 0);
  const unusedSize = unused.reduce((s, m) => s + m.size, 0);

  return NextResponse.json({
    totalCount: allMedia.length,
    totalSize,
    unusedCount: unused.length,
    unusedSize,
    unused,
  });
}

// DELETE — bulk delete all unused files from disk + DB
export async function DELETE() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const [allMedia, referenced] = await Promise.all([
    prisma.media.findMany(),
    getReferencedUrls(),
  ]);

  const unused = allMedia.filter((m) => !referenced.has(m.url));
  if (unused.length === 0) return NextResponse.json({ deleted: 0, freedBytes: 0 });

  let freedBytes = 0;
  let deleted = 0;

  for (const media of unused) {
    try {
      await unlink(path.join(process.cwd(), "public", media.url));
    } catch { /* file may already be missing */ }
    await prisma.media.delete({ where: { id: media.id } }).catch(() => {});
    freedBytes += media.size;
    deleted++;
  }

  return NextResponse.json({ deleted, freedBytes });
}
