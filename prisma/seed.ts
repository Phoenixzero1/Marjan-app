import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminHash = await bcrypt.hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@marjan.ir" },
    update: { passwordHash: adminHash, role: "SUPER_ADMIN", status: "ACTIVE" },
    create: {
      firstName: "مدیر",
      lastName: "سیستم",
      email: "admin@marjan.ir",
      phone: "09121234567",
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Test customer
  const userHash = await bcrypt.hash("user123456", 12);
  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: { passwordHash: userHash, status: "ACTIVE" },
    create: {
      firstName: "علی",
      lastName: "رضایی",
      email: "user@example.com",
      phone: "09129876543",
      passwordHash: userHash,
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  // Brands
  const brands = [
    { name: "تبریز", slug: "tabriz", country: "ایران" },
    { name: "لگریس", slug: "legris", country: "فرانسه" },
    { name: "پیوند", slug: "peyond", country: "ایران" },
    { name: "ویر", slug: "weir", country: "آلمان" },
    { name: "کی‌پلاست", slug: "kiplast", country: "ایران" },
  ];
  for (const b of brands) {
    await prisma.brand.upsert({ where: { slug: b.slug }, update: {}, create: b });
  }
  console.log("✅ Brands created");

  // Categories
  const cats = [
    { name: "شیرآلات", slug: "valves", iconClass: "ti-circle-dotted", sortOrder: 1 },
    { name: "لوله‌ها", slug: "pipes", iconClass: "ti-minus", sortOrder: 2 },
    { name: "اتصالات", slug: "fittings", iconClass: "ti-git-merge", sortOrder: 3 },
    { name: "پمپ‌ها", slug: "pumps", iconClass: "ti-activity", sortOrder: 4 },
    { name: "لوازم بهداشتی", slug: "sanitary", iconClass: "ti-droplet", sortOrder: 5 },
    { name: "یراق‌آلات", slug: "hardware", iconClass: "ti-tool", sortOrder: 6 },
  ];
  const catMap: Record<string, string> = {};
  for (const c of cats) {
    const cat = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    catMap[c.slug] = cat.id;
  }
  console.log("✅ Categories created");

  // Sub-categories for valves
  const subCats = [
    { name: "شیر توپی", slug: "ball-valve", parentId: catMap["valves"], sortOrder: 1 },
    { name: "شیر سوزنی", slug: "needle-valve", parentId: catMap["valves"], sortOrder: 2 },
    { name: "شیر یک‌طرفه", slug: "check-valve", parentId: catMap["valves"], sortOrder: 3 },
  ];
  for (const sc of subCats) {
    await prisma.category.upsert({ where: { slug: sc.slug }, update: {}, create: sc });
  }

  // Get brand IDs
  const tabriz = await prisma.brand.findUnique({ where: { slug: "tabriz" } });
  const peyond = await prisma.brand.findUnique({ where: { slug: "peyond" } });
  const legris = await prisma.brand.findUnique({ where: { slug: "legris" } });

  // Products
  const products = [
    {
      name: "شیر توپی برنجی ۱ اینچ",
      slug: "ball-valve-brass-1inch",
      sku: "TB-V100",
      price: 1394000,
      comparePrice: 1650000,
      stockQty: 150,
      categoryId: catMap["valves"],
      brandId: tabriz?.id,
      status: "PUBLISHED" as const,
      isFeatured: true,
      isNew: false,
      description: "شیر توپی برنجی کامل با بدنه برنجی ۱ اینچ، مناسب برای سیستم‌های آب گرم و سرد، فشار کاری ۱۶ بار.",
      tags: ["شیر", "توپی", "برنجی", "۱ اینچ"],
    },
    {
      name: "لوله پلیکا PVC ۱۱۰ میلیمتر",
      slug: "pvc-pipe-110mm",
      sku: "PVC-110",
      price: 850000,
      comparePrice: null,
      stockQty: 200,
      categoryId: catMap["pipes"],
      brandId: peyond?.id,
      status: "PUBLISHED" as const,
      isFeatured: true,
      isNew: false,
      description: "لوله پلیکا PVC ۱۱۰ میلیمتر ۶ متری، مناسب برای سیستم‌های فاضلاب ساختمانی.",
      tags: ["لوله", "پلیکا", "PVC", "۱۱۰"],
    },
    {
      name: "زانو ۹۰ درجه پلیمری ۱/۲ اینچ",
      slug: "elbow-90-polymer-half-inch",
      sku: "EL-90-05",
      price: 45000,
      comparePrice: null,
      stockQty: 500,
      categoryId: catMap["fittings"],
      brandId: legris?.id,
      status: "PUBLISHED" as const,
      isFeatured: true,
      isNew: true,
      description: "زانو ۹۰ درجه پلیمری ۱/۲ اینچ، جنس PP، مناسب برای لوله‌کشی آب سرد.",
      tags: ["زانو", "۹۰ درجه", "پلیمری", "۱/۲ اینچ"],
    },
    {
      name: "شیر سوزنی استیل ۱ اینچ",
      slug: "needle-valve-steel-1inch",
      sku: "NV-ST-100",
      price: 2150000,
      comparePrice: 2400000,
      stockQty: 75,
      categoryId: catMap["valves"],
      brandId: tabriz?.id,
      status: "PUBLISHED" as const,
      isFeatured: true,
      isNew: false,
      description: "شیر سوزنی استیل ۳۱۶ ۱ اینچ، مناسب برای سیستم‌های صنعتی با فشار بالا.",
      tags: ["شیر", "سوزنی", "استیل", "صنعتی"],
    },
    {
      name: "لوله پنج‌لایه ۲۰ میلیمتر",
      slug: "multilayer-pipe-20mm",
      sku: "ML-20",
      price: 125000,
      comparePrice: null,
      stockQty: 300,
      categoryId: catMap["pipes"],
      brandId: peyond?.id,
      status: "PUBLISHED" as const,
      isFeatured: false,
      isNew: true,
      description: "لوله پنج‌لایه آلومینیوم ۲۰ میلیمتر، مناسب برای سیستم‌های گرمایش از کف و لوله‌کشی.",
      tags: ["لوله", "پنج‌لایه", "آلومینیوم", "۲۰mm"],
    },
    {
      name: "سه‌راهی برنجی ۱ اینچ",
      slug: "tee-brass-1inch",
      sku: "TEE-BR-100",
      price: 680000,
      comparePrice: 780000,
      stockQty: 120,
      categoryId: catMap["fittings"],
      brandId: tabriz?.id,
      status: "PUBLISHED" as const,
      isFeatured: true,
      isNew: false,
      description: "سه‌راهی برنجی ۱ اینچ با کیفیت عالی، مناسب برای تقسیم آب.",
      tags: ["سه‌راهی", "برنجی", "۱ اینچ"],
    },
    {
      name: "شیر مخلوط دوش استیل",
      slug: "shower-mixer-steel",
      sku: "SM-ST-001",
      price: 4500000,
      comparePrice: 5200000,
      stockQty: 45,
      categoryId: catMap["sanitary"],
      brandId: legris?.id,
      status: "PUBLISHED" as const,
      isFeatured: true,
      isNew: true,
      description: "شیر مخلوط دوش استیل با طراحی مدرن، مناسب برای حمام.",
      tags: ["شیر مخلوط", "دوش", "استیل", "بهداشتی"],
    },
    {
      name: "بوشن گالوانیزه ۱ اینچ",
      slug: "coupling-galvanized-1inch",
      sku: "CP-GV-100",
      price: 185000,
      comparePrice: null,
      stockQty: 300,
      categoryId: catMap["fittings"],
      brandId: peyond?.id,
      status: "PUBLISHED" as const,
      isFeatured: false,
      isNew: false,
      description: "بوشن گالوانیزه ۱ اینچ با کیفیت مناسب برای اتصال لوله‌های گالوانیزه.",
      tags: ["بوشن", "گالوانیزه", "۱ اینچ"],
    },
  ];

  for (const prod of products) {
    const p = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: prod,
    });
    // Add sizes for some products
    if (prod.slug.includes("ball-valve") || prod.slug.includes("needle-valve")) {
      const sizes = ["۱/۴\"", "۱/۲\"", "۳/۴\"", "۱\"", "۱¼\"", "۱½\"", "۲\""];
      const prices = [420000, 680000, 920000, 1394000, 1750000, 2100000, 2800000];
      for (let i = 0; i < sizes.length; i++) {
        await prisma.productSize.upsert({
          where: { id: `${p.id}-${i}` },
          update: {},
          create: { id: `${p.id}-${i}`, productId: p.id, label: sizes[i], unit: "INCH", price: prices[i] },
        });
      }
    }
    if (prod.slug.includes("elbow") || prod.slug.includes("tee") || prod.slug.includes("coupling")) {
      const sizes = ["۱/۴\"", "۱/۲\"", "۳/۴\"", "۱\"", "۲\""];
      for (let i = 0; i < sizes.length; i++) {
        await prisma.productSize.upsert({
          where: { id: `${p.id}-${i}` },
          update: {},
          create: { id: `${p.id}-${i}`, productId: p.id, label: sizes[i], unit: "INCH", price: prod.price * (1 + i * 0.3) },
        });
      }
    }
  }
  console.log("✅ Products created:", products.length);

  // FAQs — skip if already exist (no unique field to upsert on)
  const existingFaqs = await prisma.faq.count();
  if (existingFaqs === 0) {
    await prisma.faq.createMany({
      data: [
        { question: "آیا محصولات شما دارای گارانتی هستند؟", answer: "بله، تمامی محصولات ما از برندهای معتبر با گارانتی اصالت تامین می‌شوند.", sortOrder: 1 },
        { question: "زمان ارسال سفارش‌ها چقدر است؟", answer: "برای سفارش‌های با موجودی کافی، زمان ارسال ۲۴ تا ۷۲ ساعت کاری است.", sortOrder: 2 },
        { question: "آیا می‌توانم سفارش خود را مرجوع کنم؟", answer: "محصولات سالم و بدون استفاده را تا ۷ روز پس از دریافت می‌توانید مرجوع نمایید.", sortOrder: 3 },
      ],
    });
    console.log("✅ FAQs created");
  } else {
    console.log(`⏭️  FAQs already exist (${existingFaqs}), skipping`);
  }

  // Test coupon
  await prisma.coupon.upsert({
    where: { code: "TEST" },
    update: { isActive: true },
    create: {
      code: "TEST",
      description: "کوپن تست - تخفیف ۱۰۰٪",
      discountType: "percent",
      discountValue: 100,
      minOrderAmount: 0,
      maxUsageCount: 100,
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.coupon.upsert({
    where: { code: "MARJAN10" },
    update: { isActive: true },
    create: {
      code: "MARJAN10",
      description: "تخفیف ۱۰ درصدی مرجان",
      discountType: "percent",
      discountValue: 10,
      minOrderAmount: 500000,
      maxUsageCount: 500,
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Coupons created");

  // Blog categories
  const blogCats = [
    { name: "آموزش", slug: "tutorial" },
    { name: "مقایسه", slug: "comparison" },
    { name: "فنی", slug: "technical" },
    { name: "معرفی برند", slug: "brand" },
  ];
  for (const bc of blogCats) {
    await prisma.blogCategory.upsert({ where: { slug: bc.slug }, update: {}, create: bc });
  }
  console.log("✅ Blog categories created");

  // Site settings
  const settings = [
    { key: "site_name", value: "Marjan", group: "general" },
    { key: "site_phone", value: "021-44556677", group: "general" },
    { key: "site_email", value: "info@marjan.ir", group: "general" },
    { key: "site_address", value: "تهران، ولیعصر، پلاک ۱۲۳", group: "general" },
    { key: "free_shipping_threshold", value: "5000000", group: "shipping" },
    { key: "tax_rate", value: "10", group: "finance" },
  ];
  for (const s of settings) {
    await prisma.siteSettings.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log("✅ Site settings created");

  // Sample orders
  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    const customer = await prisma.user.findUnique({ where: { email: "user@example.com" } });
    const seedProds = await prisma.product.findMany({
      where: { slug: { in: ["ball-valve-brass-1inch", "pvc-pipe-110mm", "elbow-90-polymer-half-inch", "needle-valve-steel-1inch", "tee-brass-1inch", "shower-mixer-steel"] } },
    });
    const pm = Object.fromEntries(seedProds.map((p) => [p.slug, p]));

    if (customer) {
      const addr = await prisma.address.create({
        data: {
          userId: customer.id,
          label: "خانه",
          fullName: "علی رضایی",
          phone: "09129876543",
          province: "تهران",
          city: "تهران",
          address: "خیابان ولیعصر، کوچه گلستان، پلاک ۱۲",
          postalCode: "1234567890",
          isDefault: true,
        },
      });

      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;

      // Order 1: DELIVERED + PAID
      const o1 = await prisma.order.create({
        data: {
          orderNumber: "ORD-1001",
          userId: customer.id,
          addressId: addr.id,
          status: "DELIVERED",
          subtotal: 2788000,
          shippingCost: 50000,
          taxAmount: 278800,
          totalAmount: 3116800,
          trackingCode: "1234567890",
          shippingMethod: "پست پیشتاز",
          deliveredAt: new Date(now - 3 * day),
          createdAt: new Date(now - 12 * day),
          updatedAt: new Date(now - 3 * day),
        },
      });
      await prisma.orderItem.createMany({
        data: [
          { orderId: o1.id, productId: pm["ball-valve-brass-1inch"].id, sizeLabel: "۱\"", quantity: 2, unitPrice: 1394000, totalPrice: 2788000 },
        ],
      });
      await prisma.payment.create({
        data: { orderId: o1.id, amount: 3116800, status: "PAID", refId: "REF-87654321", paidAt: new Date(now - 12 * day) },
      });

      // Order 2: SHIPPED + PAID
      const o2 = await prisma.order.create({
        data: {
          orderNumber: "ORD-1002",
          userId: customer.id,
          addressId: addr.id,
          status: "SHIPPED",
          subtotal: 4975000,
          shippingCost: 0,
          taxAmount: 497500,
          totalAmount: 5472500,
          trackingCode: "9988776655",
          shippingMethod: "پیک موتوری",
          createdAt: new Date(now - 5 * day),
          updatedAt: new Date(now - 2 * day),
        },
      });
      await prisma.orderItem.createMany({
        data: [
          { orderId: o2.id, productId: pm["needle-valve-steel-1inch"].id, sizeLabel: "۱\"", quantity: 1, unitPrice: 2150000, totalPrice: 2150000 },
          { orderId: o2.id, productId: pm["tee-brass-1inch"].id, sizeLabel: "۱\"", quantity: 2, unitPrice: 680000, totalPrice: 1360000 },
          { orderId: o2.id, productId: pm["elbow-90-polymer-half-inch"].id, sizeLabel: "۱/۲\"", quantity: 10, unitPrice: 45000, totalPrice: 450000 },
          { orderId: o2.id, productId: pm["pvc-pipe-110mm"].id, quantity: 1, unitPrice: 850000, totalPrice: 850000 },
        ],
      });
      await prisma.payment.create({
        data: { orderId: o2.id, amount: 5472500, status: "PAID", refId: "REF-11223344", paidAt: new Date(now - 5 * day) },
      });

      // Order 3: CONFIRMED + PAID
      const o3 = await prisma.order.create({
        data: {
          orderNumber: "ORD-1003",
          userId: customer.id,
          addressId: addr.id,
          status: "CONFIRMED",
          subtotal: 4500000,
          shippingCost: 80000,
          taxAmount: 450000,
          totalAmount: 5030000,
          shippingMethod: "تیپاکس",
          createdAt: new Date(now - 2 * day),
          updatedAt: new Date(now - 1 * day),
        },
      });
      await prisma.orderItem.createMany({
        data: [
          { orderId: o3.id, productId: pm["shower-mixer-steel"].id, quantity: 1, unitPrice: 4500000, totalPrice: 4500000 },
        ],
      });
      await prisma.payment.create({
        data: { orderId: o3.id, amount: 5030000, status: "PAID", refId: "REF-55667788", paidAt: new Date(now - 2 * day) },
      });

      // Order 4: PENDING + PENDING payment
      const o4 = await prisma.order.create({
        data: {
          orderNumber: "ORD-1004",
          userId: customer.id,
          addressId: addr.id,
          status: "PENDING",
          subtotal: 1275000,
          shippingCost: 50000,
          taxAmount: 127500,
          totalAmount: 1452500,
          createdAt: new Date(now - 3 * 60 * 60 * 1000),
          updatedAt: new Date(now - 3 * 60 * 60 * 1000),
        },
      });
      await prisma.orderItem.createMany({
        data: [
          { orderId: o4.id, productId: pm["pvc-pipe-110mm"].id, quantity: 1, unitPrice: 850000, totalPrice: 850000 },
          { orderId: o4.id, productId: pm["elbow-90-polymer-half-inch"].id, sizeLabel: "۳/۴\"", quantity: 5, unitPrice: 45000, totalPrice: 225000 },
          { orderId: o4.id, productId: pm["ball-valve-brass-1inch"].id, sizeLabel: "۱/۲\"", quantity: 1, unitPrice: 680000, totalPrice: 680000 },
        ],
      });
      await prisma.payment.create({
        data: { orderId: o4.id, amount: 1452500, status: "PENDING" },
      });

      // Order 5: CANCELLED + FAILED payment
      const o5 = await prisma.order.create({
        data: {
          orderNumber: "ORD-1005",
          userId: admin.id,
          addressId: addr.id,
          status: "CANCELLED",
          subtotal: 2150000,
          shippingCost: 50000,
          taxAmount: 215000,
          totalAmount: 2415000,
          notes: "مشتری انصراف داد",
          createdAt: new Date(now - 8 * day),
          updatedAt: new Date(now - 7 * day),
        },
      });
      await prisma.orderItem.createMany({
        data: [
          { orderId: o5.id, productId: pm["needle-valve-steel-1inch"].id, sizeLabel: "۱\"", quantity: 1, unitPrice: 2150000, totalPrice: 2150000 },
        ],
      });
      await prisma.payment.create({
        data: { orderId: o5.id, amount: 2415000, status: "FAILED" },
      });

      // Order 6: RETURNED + REFUNDED payment
      const o6 = await prisma.order.create({
        data: {
          orderNumber: "ORD-1006",
          userId: customer.id,
          addressId: addr.id,
          status: "RETURNED",
          subtotal: 1394000,
          shippingCost: 50000,
          taxAmount: 139400,
          totalAmount: 1583400,
          notes: "محصول معیوب بود",
          createdAt: new Date(now - 20 * day),
          updatedAt: new Date(now - 15 * day),
        },
      });
      await prisma.orderItem.createMany({
        data: [
          { orderId: o6.id, productId: pm["ball-valve-brass-1inch"].id, sizeLabel: "۱\"", quantity: 1, unitPrice: 1394000, totalPrice: 1394000 },
        ],
      });
      await prisma.payment.create({
        data: { orderId: o6.id, amount: 1583400, status: "REFUNDED", refId: "REF-99001122", paidAt: new Date(now - 20 * day) },
      });

      console.log("✅ Sample orders created: 6");
    }
  } else {
    console.log(`⏭️  Orders already exist (${existingOrders}), skipping`);
  }

  console.log("\n✨ Database seeded successfully!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin: admin@marjan.ir / admin123456");
  console.log("   User:  user@example.com / user123456");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
