export const dynamic = 'force-dynamic'
﻿import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { readFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import { createHash } from "crypto";
import path from "path";

const PACKAGES_DIR = path.join(process.cwd(), "migration-packages");

// GET — download ZIP
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requirePermission("MANAGE_BACKUP")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { id } = params;
  const zipPath = path.join(PACKAGES_DIR, `${id}.zip`);
  if (!zipPath.startsWith(PACKAGES_DIR)) return NextResponse.json({ error: "مسیر نامعتبر" }, { status: 400 });
  if (!existsSync(zipPath)) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  try {
    const file = await readFile(zipPath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${id}.zip"`,
        "Content-Length": String(file.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "خطا در خواندن فایل" }, { status: 500 });
  }
}

// DELETE — remove package
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requirePermission("MANAGE_BACKUP")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { id } = params;
  const zipPath = path.join(PACKAGES_DIR, `${id}.zip`);
  const metaPath = path.join(PACKAGES_DIR, `${id}.json`);

  if (!zipPath.startsWith(PACKAGES_DIR)) return NextResponse.json({ error: "مسیر نامعتبر" }, { status: 400 });

  await Promise.all([
    unlink(zipPath).catch(() => {}),
    unlink(metaPath).catch(() => {}),
  ]);

  return NextResponse.json({ success: true });
}

// PATCH — verify checksums
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requirePermission("MANAGE_BACKUP")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { id } = params;
  const zipPath = path.join(PACKAGES_DIR, `${id}.zip`);
  const metaPath = path.join(PACKAGES_DIR, `${id}.json`);

  if (!zipPath.startsWith(PACKAGES_DIR)) return NextResponse.json({ error: "مسیر نامعتبر" }, { status: 400 });
  if (!existsSync(zipPath)) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  try {
    const zipBuf = await readFile(zipPath);
    const currentMd5 = createHash("md5").update(zipBuf).digest("hex");
    const meta = existsSync(metaPath) ? JSON.parse(await readFile(metaPath, "utf-8")) : {};
    const sizeByte = zipBuf.length;
    const ok = meta.sizeByte === sizeByte;

    return NextResponse.json({
      ok,
      sizeByte,
      expectedSize: meta.sizeByte,
      md5: currentMd5,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "خطا در بررسی" }, { status: 500 });
  }
}