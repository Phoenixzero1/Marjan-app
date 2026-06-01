import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminHash = await bcrypt.hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@marjan.ir" },
    update: {},
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
    update: {},
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

  // FAQs
  const faqs = [
    { question: "آیا محصولات شما دارای گارانتی هستند؟", answer: "بله، تمامی محصولات ما از برندهای معتبر با گارانتی اصالت تامین می‌شوند.", sortOrder: 1 },
    { question: "زمان ارسال سفارش‌ها چقدر است؟", answer: "برای سفارش‌های با موجودی کافی، زمان ارسال ۲۴ تا ۷۲ ساعت کاری است.", sortOrder: 2 },
    { question: "آیا می‌توانم سفارش خود را مرجوع کنم؟", answer: "محصولات سالم و بدون استفاده را تا ۷ روز پس از دریافت می‌توانید مرجوع نمایید.", sortOrder: 3 },
  ];
  for (const faq of faqs) {
    await prisma.faq.create({ data: faq });
  }
  console.log("✅ FAQs created");

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

  console.log("\n✨ Database seeded successfully!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin: admin@marjan.ir / admin123456");
  console.log("   User:  user@example.com / user123456");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
