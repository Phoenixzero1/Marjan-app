export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { spawn } from "child_process";
import { mkdir, writeFile, stat } from "fs/promises";
import path from "path";

const PG_DUMP_PATH = "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe";
const BACKUP_DIR = path.join(process.cwd(), "backups");
const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

function parseDatabaseUrl(url: string) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error("Invalid DATABASE_URL");
  return { user: match[1], password: match[2], host: match[3], port: match[4], database: match[5] };
}

function runPgDump(dbInfo: ReturnType<typeof parseDatabaseUrl>, outFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, PGPASSWORD: dbInfo.password };
    const proc = spawn(PG_DUMP_PATH, [
      "-h", dbInfo.host, "-p", dbInfo.port, "-U", dbInfo.user,
      "-d", dbInfo.database, "--no-password", "-f", outFile,
    ], { env });
    let stderr = "";
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`pg_dump ${code}: ${stderr}`)));
    proc.on("error", reject);
  });
}

// GET â€” called by system cron or Windows Task Scheduler every 24h
// Protected by CRON_SECRET header or query param
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if backup is due
  const last = await prisma.backupRecord.findFirst({
    where: { status: "completed" },
    orderBy: { createdAt: "desc" },
  });

  if (last && Date.now() - last.createdAt.getTime() < AUTO_BACKUP_INTERVAL_MS) {
    return NextResponse.json({ skipped: true, reason: "Last backup is less than 24 hours old" });
  }

  await mkdir(BACKUP_DIR, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const filename = `marjan-auto-${dateStr}.sql`;
  const filePath = path.join(BACKUP_DIR, filename);

  let sizeByte = 0;
  let status = "completed";
  let errorMsg = "";

  try {
    const dbInfo = parseDatabaseUrl(process.env.DATABASE_URL ?? "");
    await runPgDump(dbInfo, filePath);
    const s = await stat(filePath);
    sizeByte = s.size;
  } catch (err) {
    // Fallback: simple JSON backup of critical tables
    status = "failed";
    errorMsg = (err as Error).message;
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        auto: true,
        users: await prisma.user.count(),
        orders: await prisma.order.count(),
        products: await prisma.product.count(),
      };
      const json = JSON.stringify(data, null, 2);
      const fallbackPath = filePath.replace(".sql", "-meta.json");
      await writeFile(fallbackPath, json, "utf8");
      sizeByte = Buffer.byteLength(json, "utf8");
      status = "failed";
    } catch { /* ignore */ }
  }

  await prisma.backupRecord.create({
    data: { filename, filePath, format: "sql", sizeByte, tableCount: 0, status, createdBy: null },
  });

  await prisma.siteSettings.upsert({
    where: { key: "last_backup_at" },
    update: { value: new Date().toISOString() },
    create: { key: "last_backup_at", value: new Date().toISOString(), group: "system" },
  });

  return NextResponse.json({ success: status === "completed", status, sizeByte, error: errorMsg || undefined });
}
