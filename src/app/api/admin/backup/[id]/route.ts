export const dynamic = 'force-dynamic'
﻿import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { readFile, unlink } from "fs/promises";

// GET — download a backup file
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requirePermission("MANAGE_BACKUP"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await params;
  const record = await prisma.backupRecord.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  if (record.status !== "completed") return NextResponse.json({ error: "فایل موجود نیست" }, { status: 404 });

  try {
    const file = await readFile(record.filePath);
    const contentType = record.format === "sql" ? "application/sql" : "application/json";
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${record.filename}"`,
        "Content-Length": String(file.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "فایل پشتیبان در دیسک یافت نشد" }, { status: 404 });
  }
}

// DELETE — remove a backup record and its file
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requirePermission("MANAGE_BACKUP"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { id } = await params;
  const record = await prisma.backupRecord.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  // Delete file from disk (ignore if missing)
  unlink(record.filePath).catch(() => {});

  await prisma.backupRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}