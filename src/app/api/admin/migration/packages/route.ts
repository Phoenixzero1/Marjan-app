import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { readdir, readFile, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const PACKAGES_DIR = path.join(process.cwd(), "migration-packages");

export async function GET() {
  if (!(await requirePermission("MANAGE_BACKUP")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  if (!existsSync(PACKAGES_DIR)) return NextResponse.json({ packages: [] });

  try {
    const files = await readdir(PACKAGES_DIR);
    const metaFiles = files.filter((f) => f.endsWith(".json"));
    const packages = await Promise.all(
      metaFiles.map(async (f) => {
        try {
          const content = await readFile(path.join(PACKAGES_DIR, f), "utf-8");
          return JSON.parse(content);
        } catch { return null; }
      })
    );

    return NextResponse.json({
      packages: packages.filter(Boolean).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    });
  } catch {
    return NextResponse.json({ packages: [] });
  }
}
