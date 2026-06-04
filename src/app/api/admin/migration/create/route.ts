import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { generateInstallerHtml, generateInstallerApi, generateInstallMd, generateEnvExample } from "@/lib/installer-template";
import archiver from "archiver";
import { createHash } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const PACKAGES_DIR = path.join(process.cwd(), "migration-packages");

export async function POST(req: NextRequest) {
  const session = await requirePermission("MANAGE_BACKUP");
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const log = async (msg: string, type: "info" | "ok" | "error" | "warn" = "info") => {
    const data = JSON.stringify({ type, msg, ts: new Date().toISOString() });
    await writer.write(encoder.encode(`data: ${data}\n\n`));
  };

  const done = async (packageId: string, size: number, counts: Record<string, number>) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "done", packageId, size, counts })}\n\n`));
    await writer.close();
  };

  const fail = async (error: string) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "fail", error })}\n\n`));
    await writer.close();
  };

  // Run in background
  (async () => {
    try {
      if (!existsSync(PACKAGES_DIR)) await mkdir(PACKAGES_DIR, { recursive: true });

      await log("شروع صادرات پایگاه داده...");

      // Export all tables
      const [
        users, products, categories, blogPosts, blogCategories, orders, orderItems,
        payments, coupons, brands, reviews, notifications, siteSettings, systemLogs,
        backupRecords, newsletter, mediaFiles,
      ] = await Promise.all([
        prisma.user.findMany({ select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, status: true, createdAt: true } }),
        prisma.product.findMany({ where: { deletedAt: null } }),
        prisma.category.findMany({ where: { deletedAt: null } }),
        prisma.blogPost.findMany({ where: { deletedAt: null } }),
        prisma.blogCategory.findMany(),
        prisma.order.findMany({ where: { deletedAt: null } }),
        prisma.orderItem.findMany(),
        prisma.payment.findMany(),
        prisma.coupon.findMany(),
        prisma.brand.findMany(),
        prisma.review.findMany(),
        prisma.notification.findMany({ take: 1000, orderBy: { createdAt: "desc" } }),
        prisma.siteSettings.findMany(),
        prisma.systemLog.findMany({ take: 500, orderBy: { createdAt: "desc" } }),
        prisma.backupRecord.findMany(),
        prisma.newsletter.findMany(),
        prisma.media.findMany(),
      ]);

      const tables: Record<string, unknown[]> = {
        User: users, Product: products, Category: categories,
        BlogPost: blogPosts, BlogCategory: blogCategories,
        Order: orders, OrderItem: orderItems, Payment: payments,
        Coupon: coupons, Brand: brands, Review: reviews,
        Notification: notifications, SiteSettings: siteSettings,
        SystemLog: systemLogs, BackupRecord: backupRecords,
        Newsletter: newsletter, Media: mediaFiles,
      };

      const counts: Record<string, number> = {};
      for (const [table, rows] of Object.entries(tables)) {
        counts[table] = rows.length;
        await log(`✅ ${table} صادر شد (${rows.length} رکورد)`, "ok");
      }

      const packageDate = new Date().toISOString().slice(0, 10);
      const packageId = `marjan-migration-${Date.now()}`;

      await log("ساخت فایل‌های پکیج...");

      const dbExport = JSON.stringify({ exportedAt: new Date().toISOString(), tables }, null, 0);
      const installerHtml = generateInstallerHtml({ packageDate, recordCounts: counts, appName: "Marjan" });
      const installerApi = generateInstallerApi();
      const installMd = generateInstallMd("Marjan", packageDate);
      const envExample = generateEnvExample();

      // Compute checksums
      const checksums: Record<string, string> = {
        "db-export.json": createHash("md5").update(dbExport).digest("hex"),
        "installer.html": createHash("md5").update(installerHtml).digest("hex"),
        "installer-api.js": createHash("md5").update(installerApi).digest("hex"),
        "INSTALL.md": createHash("md5").update(installMd).digest("hex"),
        ".env.example": createHash("md5").update(envExample).digest("hex"),
      };

      await log("ساخت آرشیو ZIP...");

      const zipPath = path.join(PACKAGES_DIR, `${packageId}.zip`);

      await new Promise<void>((resolve, reject) => {
        const output = require("fs").createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        output.on("close", resolve);
        archive.on("error", reject);
        archive.pipe(output);
        archive.append(dbExport, { name: "db-export.json" });
        archive.append(installerHtml, { name: "installer.html" });
        archive.append(installerApi, { name: "installer-api.js" });
        archive.append(installMd, { name: "INSTALL.md" });
        archive.append(envExample, { name: ".env.example" });
        archive.append(JSON.stringify(checksums, null, 2), { name: "checksums.json" });
        archive.finalize();
      });

      const stat = require("fs").statSync(zipPath);
      const sizeMB = (stat.size / 1024 / 1024).toFixed(2);

      await log(`پکیج آماده شد — ${sizeMB}MB`, "ok");

      // Save metadata
      await writeFile(
        path.join(PACKAGES_DIR, `${packageId}.json`),
        JSON.stringify({ id: packageId, date: new Date().toISOString(), sizeByte: stat.size, counts, zipPath }, null, 2)
      );

      await done(packageId, stat.size, counts);
    } catch (err) {
      await fail(String(err));
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
