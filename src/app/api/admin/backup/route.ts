export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

import { prisma } from "@/lib/prisma";
import { spawn } from "child_process";
import { mkdir, writeFile, readFile, stat } from "fs/promises";
import path from "path";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const PG_DUMP_PATH = "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe";
const BACKUP_DIR = path.join(process.cwd(), "backups");function parseDatabaseUrl(url: string) {
  // postgresql://user:password@host:port/database
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error("Invalid DATABASE_URL");
  return { user: match[1], password: match[2], host: match[3], port: match[4], database: match[5] };
}

function runPgDump(dbInfo: ReturnType<typeof parseDatabaseUrl>, outFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, PGPASSWORD: dbInfo.password };
    const proc = spawn(PG_DUMP_PATH, [
      "-h", dbInfo.host,
      "-p", dbInfo.port,
      "-U", dbInfo.user,
      "-d", dbInfo.database,
      "--no-password",
      "-f", outFile,
    ], { env });

    let stderr = "";
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pg_dump exited ${code}: ${stderr}`));
    });
    proc.on("error", reject);
  });
}

async function generateJsonBackup(tables: string[]): Promise<Record<string, unknown>> {
  const fetchers: Record<string, () => Promise<unknown>> = {
    users:          () => prisma.user.findMany({ omit: { passwordHash: true } as never }),
    products:       () => prisma.product.findMany({ include: { sizes: true } }),
    categories:     () => prisma.category.findMany(),
    orders:         () => prisma.order.findMany({ include: { items: true } }),
    payments:       () => prisma.payment.findMany(),
    coupons:        () => prisma.coupon.findMany(),
    blogPosts:      () => prisma.blogPost.findMany(),
    blogCategories: () => prisma.blogCategory.findMany(),
    reviews:        () => prisma.review.findMany(),
    blogComments:   () => prisma.blogComment.findMany(),
    media:          () => prisma.media.findMany(),
    newsletter:     () => prisma.newsletter.findMany(),
    siteSettings:   () => prisma.siteSettings.findMany(),
    addresses:      () => prisma.address.findMany(),
    brands:         () => prisma.brand.findMany(),
    faqs:           () => prisma.faq.findMany(),
    sessions:       () => prisma.session.findMany(),
    notifications:  () => prisma.notification.findMany(),
  };

  const backup: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    version: "2.0",
    format: "json",
  };

  for (const table of tables) {
    if (fetchers[table]) {
      backup[table] = await fetchers[table]();
    }
  }
  return backup;
}

// GET — return counts + backup history
export async function GET() {
  if (!(await requirePermission("MANAGE_BACKUP"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const [
    users, products, categories, orders, payments,
    coupons, blogPosts, blogCategories, reviews,
    blogComments, media, newsletter, siteSettings,
  ] = await Promise.all([
    prisma.user.count(), prisma.product.count(), prisma.category.count(),
    prisma.order.count(), prisma.payment.count(), prisma.coupon.count(),
    prisma.blogPost.count(), prisma.blogCategory.count(), prisma.review.count(),
    prisma.blogComment.count(), prisma.media.count(), prisma.newsletter.count(),
    prisma.siteSettings.count(),
  ]);

  const history = await prisma.backupRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json({
    counts: {
      users, products, categories, orders, payments,
      coupons, blogPosts, blogCategories, reviews,
      blogComments, media, newsletter, siteSettings,
    },
    history,
  });
}

// POST — create a new backup
export async function POST(req: NextRequest) {
  const session = await requirePermission("MANAGE_BACKUP");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json() as { format?: string; tables?: string[] };
  const format = body.format === "sql" ? "sql" : "json";
  const tables: string[] = body.tables ?? [
    "users","products","categories","orders","payments","coupons",
    "blogPosts","blogCategories","reviews","blogComments","media",
    "newsletter","siteSettings","addresses","brands","faqs",
  ];

  await mkdir(BACKUP_DIR, { recursive: true });

  const dateStr = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const filename = `marjan-backup-${dateStr}.${format}`;
  const filePath = path.join(BACKUP_DIR, filename);

  let sizeByte = 0;

  try {
    if (format === "sql") {
      const dbInfo = parseDatabaseUrl(process.env.DATABASE_URL ?? "");
      await runPgDump(dbInfo, filePath);
      const s = await stat(filePath);
      sizeByte = s.size;
    } else {
      const data = await generateJsonBackup(tables);
      const json = JSON.stringify(data, null, 2);
      await writeFile(filePath, json, "utf8");
      sizeByte = Buffer.byteLength(json, "utf8");
    }
  } catch (err) {
    await prisma.backupRecord.create({
      data: { filename, filePath, format, sizeByte: 0, tableCount: tables.length, status: "failed", createdBy: session.user.id },
    });
    return NextResponse.json({ error: `خطا در تهیه پشتیبان: ${(err as Error).message}` }, { status: 500 });
  }

  const record = await prisma.backupRecord.create({
    data: { filename, filePath, format, sizeByte, tableCount: tables.length, status: "completed", createdBy: session.user.id },
  });

  // Also update legacy last_backup_at setting
  await prisma.siteSettings.upsert({
    where: { key: "last_backup_at" },
    update: { value: new Date().toISOString() },
    create: { key: "last_backup_at", value: new Date().toISOString(), group: "system" },
  });

  return NextResponse.json({ success: true, record });
}
