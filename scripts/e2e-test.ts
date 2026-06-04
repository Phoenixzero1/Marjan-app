/**
 * Marjan E2E Test Script
 * Run with: npx ts-node scripts/e2e-test.ts
 *
 * Tests 8 workflows using the Prisma client directly (no HTTP).
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const results: { name: string; status: "PASS" | "FAIL"; error?: string }[] = [];

function pass(name: string) {
  results.push({ name, status: "PASS" });
  console.log(`  ✅ PASS  ${name}`);
}

function fail(name: string, error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  results.push({ name, status: "FAIL", error: msg });
  console.error(`  ❌ FAIL  ${name}: ${msg}`);
}

async function run(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    pass(name);
  } catch (e) {
    fail(name, e);
  }
}

// ─── Test 1: Product lifecycle ─────────────────────────────────────────────
async function testProductLifecycle() {
  console.log("\n📦 Test 1: Product lifecycle (create → edit → soft delete → restore)");

  let productId = "";

  await run("Create product", async () => {
    const p = await prisma.product.create({
      data: {
        name: "E2E Test Product " + Date.now(),
        slug: "e2e-test-product-" + Date.now(),
        price: 100000,
        status: "DRAFT",
      },
    });
    productId = p.id;
    if (!p.id) throw new Error("No id returned");
  });

  await run("Edit product", async () => {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { price: 200000, status: "PUBLISHED" },
    });
    if (updated.price !== 200000) throw new Error("Price not updated");
  });

  await run("Soft delete product", async () => {
    const deleted = await prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });
    if (!deleted.deletedAt) throw new Error("deletedAt not set");
  });

  await run("Product hidden from published list", async () => {
    const count = await prisma.product.count({ where: { id: productId, deletedAt: null } });
    if (count !== 0) throw new Error("Soft-deleted product still appears in live list");
  });

  await run("Restore product from trash", async () => {
    await prisma.product.update({ where: { id: productId }, data: { deletedAt: null } });
    const restored = await prisma.product.findUnique({ where: { id: productId } });
    if (restored?.deletedAt !== null) throw new Error("deletedAt still set after restore");
  });

  await run("Permanently delete product", async () => {
    await prisma.product.delete({ where: { id: productId } });
    const gone = await prisma.product.findUnique({ where: { id: productId } });
    if (gone) throw new Error("Product still exists after hard delete");
  });
}

// ─── Test 2: Category lifecycle ────────────────────────────────────────────
async function testCategoryLifecycle() {
  console.log("\n🗂️  Test 2: Category lifecycle (create → edit → delete)");

  let catId = "";

  await run("Create category", async () => {
    const c = await prisma.category.create({
      data: { name: "E2E Category " + Date.now(), slug: "e2e-cat-" + Date.now() },
    });
    catId = c.id;
  });

  await run("Edit category", async () => {
    const updated = await prisma.category.update({
      where: { id: catId },
      data: { description: "E2E description" },
    });
    if (updated.description !== "E2E description") throw new Error("Description not updated");
  });

  await run("Delete category", async () => {
    await prisma.category.delete({ where: { id: catId } });
    const gone = await prisma.category.findUnique({ where: { id: catId } });
    if (gone) throw new Error("Category still exists after delete");
  });
}

// ─── Test 3: Blog post lifecycle ───────────────────────────────────────────
async function testBlogLifecycle() {
  console.log("\n📝 Test 3: Blog post lifecycle (create → publish → soft delete)");

  let postId = "";

  await run("Create blog post", async () => {
    const p = await prisma.blogPost.create({
      data: {
        title: "E2E Blog Post " + Date.now(),
        slug: "e2e-blog-" + Date.now(),
        content: "Test content",
        isPublished: false,
      },
    });
    postId = p.id;
  });

  await run("Publish blog post", async () => {
    const updated = await prisma.blogPost.update({
      where: { id: postId },
      data: { isPublished: true, publishedAt: new Date() },
    });
    if (!updated.isPublished) throw new Error("isPublished not set");
  });

  await run("Blog post visible in published list", async () => {
    const count = await prisma.blogPost.count({ where: { id: postId, isPublished: true, deletedAt: null } });
    if (count !== 1) throw new Error("Published post not found in list");
  });

  await run("Soft delete blog post", async () => {
    const deleted = await prisma.blogPost.update({
      where: { id: postId },
      data: { deletedAt: new Date(), isPublished: false },
    });
    if (!deleted.deletedAt) throw new Error("deletedAt not set");
  });

  await run("Blog post hidden after soft delete", async () => {
    const count = await prisma.blogPost.count({ where: { id: postId, deletedAt: null } });
    if (count !== 0) throw new Error("Soft-deleted post still visible");
  });

  // Cleanup
  await prisma.blogPost.delete({ where: { id: postId } }).catch(() => {});
}

// ─── Test 4: Media upload simulation ───────────────────────────────────────
async function testMedia() {
  console.log("\n🖼️  Test 4: Media record lifecycle (create → reference check → delete)");

  let mediaId = "";
  const testUrl = "/uploads/e2e-test-" + Date.now() + ".jpg";

  await run("Create media record", async () => {
    const m = await prisma.media.create({
      data: {
        filename: "e2e-test.jpg",
        originalName: "e2e-test.jpg",
        url: testUrl,
        mimeType: "image/jpeg",
        size: 12345,
        folder: "test",
      },
    });
    mediaId = m.id;
  });

  await run("Media record in database", async () => {
    const m = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!m) throw new Error("Media not found");
  });

  await run("Delete media record", async () => {
    await prisma.media.delete({ where: { id: mediaId } });
    const gone = await prisma.media.findUnique({ where: { id: mediaId } });
    if (gone) throw new Error("Media still exists after delete");
  });
}

// ─── Test 5: Coupon lifecycle ──────────────────────────────────────────────
async function testCoupon() {
  console.log("\n🎫 Test 5: Coupon lifecycle (create → validate → expire)");

  let couponId = "";
  const code = "E2ETEST" + Date.now().toString().slice(-6);

  await run("Create coupon", async () => {
    const c = await prisma.coupon.create({
      data: {
        code,
        discountType: "PERCENT",
        discountValue: 10,
        minOrderAmount: 100000,
        maxUsageCount: 5,
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    couponId = c.id;
  });

  await run("Validate coupon is active and not expired", async () => {
    const c = await prisma.coupon.findFirst({
      where: { code, isActive: true, expiresAt: { gt: new Date() } },
    });
    if (!c) throw new Error("Active coupon not found");
  });

  await run("Expire coupon", async () => {
    await prisma.coupon.update({
      where: { id: couponId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const expired = await prisma.coupon.findFirst({
      where: { code, isActive: true, expiresAt: { gt: new Date() } },
    });
    if (expired) throw new Error("Expired coupon still appears as valid");
  });

  // Cleanup
  await prisma.coupon.delete({ where: { id: couponId } }).catch(() => {});
}

// ─── Test 6: Order status + tracking ──────────────────────────────────────
async function testOrder() {
  console.log("\n🚚 Test 6: Order status workflow (PENDING → CONFIRMED → SHIPPED → DELIVERED)");

  let orderId = "";
  let userId = "";

  await run("Find or create test user", async () => {
    let user = await prisma.user.findFirst({ where: { email: "e2e-test@marjan.ir" } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: "E2E",
          lastName: "Test",
          email: "e2e-test@marjan.ir",
          role: "CUSTOMER",
          status: "ACTIVE",
        },
      });
    }
    userId = user.id;
  });

  await run("Create order", async () => {
    const order = await prisma.order.create({
      data: {
        userId,
        status: "PENDING",
        subtotal: 500000,
        totalAmount: 500000,
      },
    });
    orderId = order.id;
  });

  const statusFlow: Array<"CONFIRMED" | "SHIPPED" | "DELIVERED"> = ["CONFIRMED", "SHIPPED", "DELIVERED"];
  for (const status of statusFlow) {
    await run(`Status → ${status}`, async () => {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(status === "SHIPPED" ? { trackingCode: "E2E-TRACK-001" } : {}),
          ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        },
      });
      if (updated.status !== status) throw new Error(`Status not updated to ${status}`);
    });
  }

  await run("Tracking code persisted", async () => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.trackingCode) throw new Error("Tracking code not found");
  });

  // Cleanup
  await prisma.order.delete({ where: { id: orderId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: "e2e-test@marjan.ir" } }).catch(() => {});
}

// ─── Test 7: Settings change ───────────────────────────────────────────────
async function testSettings() {
  console.log("\n⚙️  Test 7: Settings change (save → verify load)");

  const testKey = "e2e_test_setting";
  const testValue = "e2e_value_" + Date.now();

  await run("Save setting", async () => {
    await prisma.siteSettings.upsert({
      where: { key: testKey },
      update: { value: testValue },
      create: { key: testKey, value: testValue, group: "test" },
    });
  });

  await run("Load setting", async () => {
    const s = await prisma.siteSettings.findUnique({ where: { key: testKey } });
    if (!s) throw new Error("Setting not found");
    if (s.value !== testValue) throw new Error(`Value mismatch: expected ${testValue}, got ${s.value}`);
  });

  // Cleanup
  await prisma.siteSettings.delete({ where: { key: testKey } }).catch(() => {});
}

// ─── Test 8: Maintenance mode ──────────────────────────────────────────────
async function testMaintenanceMode() {
  console.log("\n🔧 Test 8: Maintenance mode (enable → verify → disable)");

  await run("Enable maintenance mode", async () => {
    await prisma.siteSettings.upsert({
      where: { key: "maintenance_mode" },
      update: { value: "true" },
      create: { key: "maintenance_mode", value: "true", group: "maintenance" },
    });
  });

  await run("Maintenance mode is ON in DB", async () => {
    const s = await prisma.siteSettings.findUnique({ where: { key: "maintenance_mode" } });
    if (s?.value !== "true") throw new Error("maintenance_mode not set to true");
  });

  await run("Disable maintenance mode", async () => {
    await prisma.siteSettings.update({
      where: { key: "maintenance_mode" },
      data: { value: "false" },
    });
    const s = await prisma.siteSettings.findUnique({ where: { key: "maintenance_mode" } });
    if (s?.value !== "false") throw new Error("maintenance_mode not disabled");
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║       Marjan E2E Test Suite           ║");
  console.log("╚═══════════════════════════════════════╝");

  try {
    await testProductLifecycle();
    await testCategoryLifecycle();
    await testBlogLifecycle();
    await testMedia();
    await testCoupon();
    await testOrder();
    await testSettings();
    await testMaintenanceMode();
  } finally {
    await prisma.$disconnect();
  }

  // Report
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log("\n╔═══════════════════════════════════════╗");
  console.log(`║  Results: ${passed} passed, ${failed} failed${" ".repeat(Math.max(0, 20 - String(passed + failed).length))}║`);
  console.log("╚═══════════════════════════════════════╝");

  if (failed > 0) {
    console.log("\n❌ Failed tests:");
    results.filter((r) => r.status === "FAIL").forEach((r) => {
      console.log(`  • ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed!\n");
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
