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

// ─── Test 9: Product specs ─────────────────────────────────────────────────
async function testProductSpecs() {
  console.log("\n📋 Test 9: Product specs (create → fetch → delete)");

  let productId = "";
  let specId = "";

  await run("Create product for specs test", async () => {
    const p = await prisma.product.create({
      data: { name: "E2E Specs Product " + Date.now(), slug: "e2e-specs-" + Date.now(), price: 100000, status: "DRAFT" },
    });
    productId = p.id;
  });

  await run("Add spec to product", async () => {
    const spec = await prisma.productSpec.create({
      data: { productId, key: "رنگ", value: "مشکی", sortOrder: 0 },
    });
    specId = spec.id;
    if (!spec.id) throw new Error("Spec not created");
  });

  await run("Fetch specs for product", async () => {
    const specs = await prisma.productSpec.findMany({ where: { productId } });
    if (specs.length !== 1) throw new Error(`Expected 1 spec, got ${specs.length}`);
    if (specs[0].key !== "رنگ") throw new Error("Spec key mismatch");
  });

  await run("Delete spec", async () => {
    await prisma.productSpec.delete({ where: { id: specId } });
    const count = await prisma.productSpec.count({ where: { productId } });
    if (count !== 0) throw new Error("Spec still exists after delete");
  });

  // Cleanup
  await prisma.product.delete({ where: { id: productId } }).catch(() => {});
}

// ─── Test 10: Product Q&A ──────────────────────────────────────────────────
async function testProductQA() {
  console.log("\n❓ Test 10: Product Q&A (ask → answer → approve → show publicly)");

  let productId = "";
  let userId = "";
  let questionId = "";

  await run("Setup product and user", async () => {
    const [p, u] = await Promise.all([
      prisma.product.create({ data: { name: "E2E QA Product " + Date.now(), slug: "e2e-qa-" + Date.now(), price: 100000, status: "PUBLISHED" } }),
      prisma.user.upsert({ where: { email: "e2e-qa@marjan.ir" }, update: {}, create: { firstName: "E2E", lastName: "QA", email: "e2e-qa@marjan.ir", role: "CUSTOMER", status: "ACTIVE" } }),
    ]);
    productId = p.id;
    userId = u.id;
  });

  await run("Customer asks question", async () => {
    const q = await prisma.productQuestion.create({
      data: { productId, userId, question: "آیا این محصول ضد آب است؟", isApproved: false },
    });
    questionId = q.id;
    if (q.isApproved) throw new Error("Question should not be auto-approved");
  });

  await run("Admin answers question", async () => {
    const answered = await prisma.productQuestion.update({
      where: { id: questionId },
      data: { answer: "بله، کاملاً ضد آب است.", answeredAt: new Date(), isApproved: true },
    });
    if (!answered.answer) throw new Error("Answer not saved");
    if (!answered.isApproved) throw new Error("Not approved after answer");
  });

  await run("Approved Q&A visible on product page", async () => {
    const count = await prisma.productQuestion.count({
      where: { productId, isApproved: true, answer: { not: null } },
    });
    if (count !== 1) throw new Error(`Expected 1 approved answer, got ${count}`);
  });

  // Cleanup
  await prisma.productQuestion.delete({ where: { id: questionId } }).catch(() => {});
  await prisma.product.delete({ where: { id: productId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: "e2e-qa@marjan.ir" } }).catch(() => {});
}

// ─── Test 11: Return flow ──────────────────────────────────────────────────
async function testReturnFlow() {
  console.log("\n↩️  Test 11: Return flow (request → admin approves → wallet refund)");

  let userId = "";
  let orderId = "";
  let returnId = "";

  await run("Setup user and delivered order", async () => {
    const u = await prisma.user.upsert({
      where: { email: "e2e-return@marjan.ir" },
      update: {},
      create: { firstName: "E2E", lastName: "Return", email: "e2e-return@marjan.ir", role: "CUSTOMER", status: "ACTIVE" },
    });
    userId = u.id;
    const order = await prisma.order.create({
      data: { userId, status: "DELIVERED", subtotal: 300000, totalAmount: 300000, deliveredAt: new Date() },
    });
    orderId = order.id;
  });

  await run("User requests return", async () => {
    const ret = await prisma.returnRequest.create({
      data: { orderId, userId, reason: "کالا معیوب است", status: "PENDING" },
    });
    returnId = ret.id;
    if (ret.status !== "PENDING") throw new Error("Status should be PENDING");
  });

  await run("Admin approves return", async () => {
    const approved = await prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: "APPROVED", adminNote: "مرجوعی تأیید شد" },
    });
    if (approved.status !== "APPROVED") throw new Error("Status not APPROVED");
  });

  await run("Wallet refund created", async () => {
    await prisma.wallet.upsert({
      where: { userId },
      update: { balance: { increment: 300000 } },
      create: { userId, balance: 300000 },
    });
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < 300000) throw new Error("Wallet not credited");
  });

  await run("Wallet transaction logged", async () => {
    const tx = await prisma.walletTx.create({
      data: { walletId: (await prisma.wallet.findUnique({ where: { userId } }))!.id, amount: 300000, type: "REFUND", description: "مرجوعی سفارش" },
    });
    if (!tx.id) throw new Error("Wallet transaction not created");
    await prisma.walletTx.delete({ where: { id: tx.id } }).catch(() => {});
  });

  // Cleanup
  await prisma.returnRequest.delete({ where: { id: returnId } }).catch(() => {});
  await prisma.order.delete({ where: { id: orderId } }).catch(() => {});
  await prisma.wallet.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: "e2e-return@marjan.ir" } }).catch(() => {});
}

// ─── Test 12: CMS (pages, banners, menus, site status) ────────────────────
async function testCms() {
  console.log("\n🖥️  Test 12: CMS (pages → banners → menus → site status)");

  const slug = "e2e-test-page-" + Date.now();

  await run("Create static page", async () => {
    const page = await prisma.page.upsert({
      where: { slug },
      update: {},
      create: { slug, title: "E2E Test Page", content: "<p>E2E content</p>", isActive: true },
    });
    if (!page.id) throw new Error("Page not created");
  });

  await run("Update page content", async () => {
    const updated = await prisma.page.update({
      where: { slug },
      data: { content: "<p>Updated content</p>" },
    });
    if (updated.content !== "<p>Updated content</p>") throw new Error("Content not updated");
  });

  await run("Create banner", async () => {
    const banner = await prisma.banner.create({
      data: { title: "E2E Banner", type: "HERO", isActive: true },
    });
    if (!banner.id) throw new Error("Banner not created");
    await prisma.banner.delete({ where: { id: banner.id } }).catch(() => {});
  });

  await run("Create menu item", async () => {
    const item = await prisma.menuItem.create({
      data: { menu: "HEADER", label: "E2E Link", url: "/e2e", sortOrder: 99 },
    });
    if (!item.id) throw new Error("Menu item not created");
    await prisma.menuItem.delete({ where: { id: item.id } }).catch(() => {});
  });

  await run("Site status toggle (registration_closed)", async () => {
    await prisma.siteSettings.upsert({
      where: { key: "registration_closed" },
      update: { value: "true" },
      create: { key: "registration_closed", value: "true", group: "status" },
    });
    const s = await prisma.siteSettings.findUnique({ where: { key: "registration_closed" } });
    if (s?.value !== "true") throw new Error("Status not toggled");
    await prisma.siteSettings.update({ where: { key: "registration_closed" }, data: { value: "false" } });
  });

  // Cleanup
  await prisma.page.delete({ where: { slug } }).catch(() => {});
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
    await testProductSpecs();
    await testProductQA();
    await testReturnFlow();
    await testCms();
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
