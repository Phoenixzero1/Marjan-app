export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// ── helpers ──────────────────────────────────────────────────────────────────
function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function orderNum() { return `MRJ-${Date.now()}-${rnd(1000,9999)}`; }

// ── static data ───────────────────────────────────────────────────────────────
const CUSTOMER_NAMES = [
  { f: "علی", l: "رضایی" }, { f: "مریم", l: "کریمی" }, { f: "حسن", l: "محمدپور" },
  { f: "زهرا", l: "احمدی" }, { f: "محمد", l: "جوادی" }, { f: "فاطمه", l: "صادقی" },
  { f: "رضا", l: "موسوی" }, { f: "نگار", l: "حسینی" }, { f: "امیر", l: "شریفی" },
  { f: "سارا", l: "تهرانی" }, { f: "مهدی", l: "نجفی" }, { f: "لیلا", l: "کمالی" },
  { f: "سعید", l: "رحیمی" }, { f: "آرزو", l: "عباسی" }, { f: "کاوه", l: "مرادی" },
  { f: "شیرین", l: "قاسمی" }, { f: "بهزاد", l: "ولی‌پور" }, { f: "ناهید", l: "زارع" },
];

const PRODUCTS_DATA = [
  { name: "شیر توپی برنجی DN50", slug: "shiir-toopi-berenj-dn50", sku: "VLV-BR-50", price: 850_000, cat: "shiir-aalaat", brand: "iran-naaveh", stock: 48 },
  { name: "شیر پروانه‌ای DN80 (باترفلای)", slug: "shiir-parvaanehii-dn80", sku: "VLV-BF-80", price: 1_200_000, cat: "shiir-aalaat", brand: "nortest", stock: 32 },
  { name: "شیر فلکه سه اینچ", slug: "shiir-falake-3inch", sku: "VLV-GL-3", price: 2_100_000, cat: "shiir-aalaat", brand: "iran-naaveh", stock: 15 },
  { name: "شیر یکطرفه DN40", slug: "shiir-yektarafe-dn40", sku: "VLV-CH-40", price: 760_000, cat: "shiir-aalaat", brand: "pishro", stock: 55 },
  { name: "شیر اطمینان ۶ بار", slug: "shiir-etminaan-6bar", sku: "VLV-SF-6B", price: 540_000, cat: "shiir-aalaat", brand: "pishro", stock: 40 },
  { name: "لوله مانیسمان ۲ اینچ (شاخه ۶ متری)", slug: "loole-manismaan-2inch", sku: "PPE-SML-2", price: 450_000, cat: "loole-etesaalaat", brand: "nortest", stock: 120 },
  { name: "لوله گالوانیزه ۱ اینچ (شاخه ۶ متری)", slug: "loole-galvaniize-1inch", sku: "PPE-GV-1", price: 280_000, cat: "loole-etesaalaat", brand: "nortest", stock: 200 },
  { name: "لوله پلیکا ۱۱۰ میلیمتر", slug: "loole-plica-110mm", sku: "PPE-PVC-110", price: 380_000, cat: "loole-etesaalaat", brand: "pishro", stock: 80 },
  { name: "اتصال سه‌راهی برنجی ½ اینچ", slug: "etesaal-seraahi-berenj-half", sku: "FIT-TEE-H", price: 95_000, cat: "etesaalaat-berenj", brand: "iran-naaveh", stock: 300 },
  { name: "اتصال مغزی زانویی ۹۰ درجه ¾ اینچ", slug: "etesaal-mogzi-zaanoii-90", sku: "FIT-ELB-90", price: 45_000, cat: "etesaalaat-berenj", brand: "iran-naaveh", stock: 500 },
  { name: "مهره ماسوره برنجی ½ اینچ", slug: "mohre-maasure-berenj-half", sku: "FIT-UNI-H", price: 28_000, cat: "etesaalaat-berenj", brand: "pishro", stock: 800 },
  { name: "واشر لاستیکی ۳ اینچ (بسته ۱۰ عدد)", slug: "vaasher-laastik-3inch", sku: "FIT-GSK-3", price: 12_000, cat: "etesaalaat-berenj", brand: "pishro", stock: 1000 },
  { name: "پمپ آب خانگی ۲ اسب بخار", slug: "pomp-aab-khaanegi-2hp", sku: "PMP-DOM-2HP", price: 3_800_000, cat: "pomp-tajhizaat", brand: "nortest", stock: 12 },
  { name: "پمپ سیرکولاتور گرمایش مرکزی", slug: "pomp-serkiulaator", sku: "PMP-CRC-01", price: 4_200_000, cat: "pomp-tajhizaat", brand: "iran-naaveh", stock: 8 },
  { name: "فیلتر آب صنعتی Y-Type DN50", slug: "filtr-aab-sanati-ytype-dn50", sku: "FLT-Y-50", price: 1_650_000, cat: "pomp-tajhizaat", brand: "iran-naaveh", stock: 22 },
];

const CATEGORIES_DATA = [
  { name: "شیرآلات صنعتی", slug: "shiir-aalaat", icon: "ti-valve" },
  { name: "لوله و اتصالات", slug: "loole-etesaalaat", icon: "ti-pipe" },
  { name: "اتصالات برنجی", slug: "etesaalaat-berenj", icon: "ti-hexagon" },
  { name: "پمپ و تجهیزات", slug: "pomp-tajhizaat", icon: "ti-engine" },
];

const BRANDS_DATA = [
  { name: "ایران‌ناوه", slug: "iran-naaveh", country: "ایران" },
  { name: "نورتس", slug: "nortest", country: "ایران" },
  { name: "پیشرو", slug: "pishro", country: "ایران" },
];

const FAQ_DATA = [
  { q: "مدت زمان تحویل سفارشات چقدر است؟", a: "بسته به موقعیت جغرافیایی، معمولاً ۲ تا ۵ روز کاری. تهران ۱-۲ روز، سایر شهرها ۳-۵ روز." },
  { q: "آیا امکان بازگشت کالا وجود دارد؟", a: "بله، تا ۷ روز پس از دریافت کالا امکان مرجوعی وجود دارد. کالا باید در بسته‌بندی اصلی و سالم باشد." },
  { q: "روش‌های پرداخت کدامند؟", a: "پرداخت آنلاین از طریق درگاه زرین‌پال، کارت به کارت، و پرداخت در محل (تهران). پرداخت سازمانی نیز انجام می‌شود." },
  { q: "آیا فاکتور رسمی صادر می‌کنید؟", a: "بله، برای کلیه سفارشات فاکتور رسمی با امضا و مهر شرکت صادر می‌شود. درخواست فاکتور سازمانی را هنگام ثبت سفارش ذکر کنید." },
  { q: "حداقل مقدار سفارش برای خرید عمده چیست؟", a: "برای خرید عمده حداقل ۱۰۰ عدد از یک محصول یا ۵ میلیون تومان ارزش سفارش کل. با تیم فروش ما تماس بگیرید." },
  { q: "آیا محصولات گارانتی دارند؟", a: "بله، تمام محصولات ۱ تا ۲ سال گارانتی کارخانه دارند. در صورت بروز نقص کارخانه‌ای، رایگان تعویض می‌شوند." },
  { q: "چگونه می‌توانم وضعیت سفارشم را پیگیری کنم؟", a: "از طریق بخش «سفارشات من» در پروفایل خود یا با کد رهگیری که پس از ارسال ایمیل/پیامک می‌شود." },
  { q: "آیا محصولات با قیمت عمده‌فروشی ارائه می‌شوند؟", a: "بله، برای خریداران عمده، نمایندگان، و پیمانکاران قیمت‌های ویژه در نظر گرفته می‌شود. فرم نمایندگی را پر کنید." },
  { q: "آیا نصب محصولات هم انجام می‌دهید؟", a: "نصب در تهران و حومه انجام می‌شود. هزینه نصب جداگانه محاسبه می‌شود. با پشتیبانی تماس بگیرید." },
  { q: "اگر محصول ناقص بود چه کار کنم؟", a: "بلافاصله با پشتیبانی تماس بگیرید. عکس نقص را ارسال کنید. در صورت تأیید، کالا رایگان تعویض یا مبلغ بازگشت داده می‌شود." },
  { q: "آیا خرید سازمانی با شرایط اعتباری انجام می‌شود؟", a: "برای شرکت‌ها و پیمانکاران معتبر، شرایط اعتباری ۳۰ تا ۶۰ روزه در نظر گرفته می‌شود. ثبت‌نام سازمانی الزامی است." },
  { q: "محدوده جغرافیایی ارسال کجاست؟", a: "به سراسر ایران ارسال می‌شود. برای مناطق دورافتاده، هزینه و زمان ارسال ممکن است بیشتر باشد." },
];

const NEWSLETTER_EMAILS = [
  "info@plumber-co.ir", "rezaei.ali@gmail.com", "tehran.build@gmail.com",
  "maryam.k@yahoo.com", "hasan.m@outlook.com", "zahra.a@gmail.com",
  "mohamad.j@gmail.com", "fatemeh.s@yahoo.com", "reza.m@gmail.com",
  "negar.h@gmail.com", "amir.sh@gmail.com", "sara.t@gmail.com",
  "mehdi.n@gmail.com", "leila.k@yahoo.com", "saeed.r@gmail.com",
  "arzu.a@gmail.com", "kaveh.m@gmail.com", "shirin.q@gmail.com",
  "behzad.v@gmail.com", "nahid.z@yahoo.com", "office@irantechco.ir",
  "procurement@buildmaster.ir", "purchase@plumbtech.co", "admin@arya-trading.ir",
];

const ORG_REQUESTS = [
  { company: "شرکت تاسیسات البرز", contact: "مهندس کریمی", phone: "02134567890", cat: "تاسیسات", amt: "۵۰ تا ۱۰۰ میلیون تومان", desc: "نیاز به تأمین شیرآلات و لوله‌کشی برای پروژه مسکونی ۱۲ واحدی در کرج داریم." },
  { company: "پیمانکاری ساختمان نوین", contact: "آقای حسینی", phone: "09121234567", cat: "ساختمانی", amt: "۲۰ تا ۵۰ میلیون تومان", desc: "خرید لوله مانیسمان و اتصالات برنجی برای پروژه اداری تهران." },
  { company: "مجموعه هتل‌های پارسیان", contact: "خانم موسوی", phone: "02188887766", cat: "هتلداری", amt: "بیش از ۲۰۰ میلیون تومان", desc: "تأمین سیستم آب‌رسانی و تاسیسات مجتمع هتل ۱۰۰ اتاقه." },
  { company: "شرکت صنعتی فولاد آذر", contact: "مهندس احمدی", phone: "04133334455", cat: "صنعتی", amt: "۱۰۰ تا ۲۰۰ میلیون تومان", desc: "تأمین شیرآلات صنعتی و پمپ‌های صنعتی برای کارخانه فولادسازی." },
  { company: "شهرداری منطقه ۵ تهران", contact: "آقای رضایی", phone: "02144556677", cat: "شهرداری", amt: "بیش از ۵۰۰ میلیون تومان", desc: "تأمین لوله و اتصالات برای پروژه آب‌رسانی شهری." },
  { company: "گروه ساختمانی مهر", contact: "خانم نجفی", phone: "09351234567", cat: "ساختمانی", amt: "۵۰ تا ۱۰۰ میلیون تومان", desc: "نیاز به شیرآلات و پمپ برای مجتمع مسکونی ۲۰۰ واحدی." },
];

const REVIEW_TITLES = [
  "محصول عالی", "کیفیت خوب", "راضی هستم", "توصیه می‌کنم", "قیمت مناسب",
  "ارسال سریع", "بهتر از انتظار", "محصول اصل", "کیفیت قابل قبول", "خوب بود",
];
const REVIEW_CONTENTS = [
  "محصول دقیقاً مطابق توضیحات بود. کیفیت عالی و قیمت مناسب. حتماً دوباره خرید می‌کنم.",
  "ارسال سریع و بسته‌بندی عالی. محصول به خوبی کار می‌کند. ممنون از مرجان شاپ.",
  "برای پروژه صنعتی استفاده کردم. کیفیت استاندارد و مناسب. پیشنهاد می‌دهم.",
  "قیمت از بازار ارزان‌تر بود. تحویل در موعد مقرر. راضی هستم.",
  "دومین بار است از این فروشگاه خرید می‌کنم. همیشه کیفیت خوب دارند.",
  "مقاوم و با دوام. برای لوله‌کشی صنعتی عالی است. گارانتی هم داشت.",
  "کمی دیر رسید ولی کیفیت خوب بود. پشتیبانی هم پاسخگو بود.",
  "با اتصالات دیگر سازگاری کامل داشت. محصول اصل کارخانه است.",
];
const LOG_ACTIONS = [
  "ورود کاربر", "ثبت سفارش", "پرداخت انجام شد", "تغییر وضعیت سفارش", "ویرایش محصول",
  "افزودن محصول", "حذف کاربر", "تغییر تنظیمات", "درخواست مرجوعی", "صدور فاکتور",
  "ارسال پیامک", "خطا در پرداخت", "تلاش ورود ناموفق", "بارگذاری تصویر", "پشتیبان‌گیری",
];

export async function POST() {
  if (!(await requirePermission("VIEW_ADMIN")))
    return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const report: string[] = [];

  // ── 1. Categories ─────────────────────────────────────────────────────────
  const catMap: Record<string, string> = {};
  for (const c of CATEGORIES_DATA) {
    const rec = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug, iconClass: c.icon, isActive: true },
    });
    catMap[c.slug] = rec.id;
  }
  report.push(`✓ ${CATEGORIES_DATA.length} دسته‌بندی`);

  // ── 2. Brands ──────────────────────────────────────────────────────────────
  const brandMap: Record<string, string> = {};
  for (const b of BRANDS_DATA) {
    const rec = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name },
      create: { name: b.name, slug: b.slug, country: b.country, isActive: true },
    });
    brandMap[b.slug] = rec.id;
  }
  report.push(`✓ ${BRANDS_DATA.length} برند`);

  // ── 3. Products ────────────────────────────────────────────────────────────
  const prodMap: Record<string, string> = {};
  for (const p of PRODUCTS_DATA) {
    const rec = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { price: p.price, stockQty: p.stock, status: "PUBLISHED" },
      create: {
        name: p.name, slug: p.slug, sku: p.sku, price: p.price,
        comparePrice: Math.round(p.price * 1.1),
        stockQty: p.stock, status: "PUBLISHED",
        categoryId: catMap[p.cat] ?? null,
        brandId: brandMap[p.brand] ?? null,
        isFeatured: p.price > 1_000_000,
        isNew: p.stock > 50,
        taxPercent: 10,
        lowStockAlert: 5,
      },
    });
    prodMap[p.slug] = rec.id;
  }
  report.push(`✓ ${PRODUCTS_DATA.length} محصول`);

  const allProductIds = Object.values(prodMap);

  // ── 4. Demo Customers ──────────────────────────────────────────────────────
  const existingUsersCount = await prisma.user.count({ where: { role: "CUSTOMER" } });
  const userIds: string[] = [];

  if (existingUsersCount < 15) {
    for (const n of CUSTOMER_NAMES) {
      const email = `${n.l.toLowerCase().replace(/\s/g, "")}.${n.f.toLowerCase().replace(/\s/g, "")}@demo.marjan.ir`;
      const phone = `091${rnd(10000000, 99999999)}`;
      try {
        const u = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            firstName: n.f, lastName: n.l, email, phone,
            role: "CUSTOMER", status: "ACTIVE",
            emailVerified: new Date(),
            createdAt: daysAgo(rnd(30, 365)),
          },
        });
        userIds.push(u.id);
      } catch { /* phone conflict — skip */ }
    }
    report.push(`✓ ${userIds.length} مشتری نمونه`);
  } else {
    const existingUsers = await prisma.user.findMany({ where: { role: "CUSTOMER" }, select: { id: true }, take: 18 });
    userIds.push(...existingUsers.map(u => u.id));
    report.push(`↩ مشتریان موجود استفاده شد (${userIds.length} نفر)`);
  }

  // ── 5. Orders + Payments ───────────────────────────────────────────────────
  const existingOrders = await prisma.order.count();
  let newOrdersCount = 0;

  if (existingOrders < 55 && userIds.length > 0) {
    const statuses = [
      ...Array(28).fill("DELIVERED"),
      ...Array(10).fill("SHIPPED"),
      ...Array(8).fill("PROCESSING"),
      ...Array(5).fill("CONFIRMED"),
      ...Array(4).fill("PENDING"),
    ] as const;

    for (let i = 0; i < 55; i++) {
      const uid = pick(userIds);
      const prodId1 = pick(allProductIds);
      const prodId2 = pick(allProductIds);
      const prod1 = PRODUCTS_DATA.find(p => prodMap[p.slug] === prodId1)!;
      const prod2 = PRODUCTS_DATA.find(p => prodMap[p.slug] === prodId2);

      const qty1 = rnd(1, 4);
      const qty2 = rnd(1, 3);
      const sub1 = (prod1?.price ?? 850_000) * qty1;
      const sub2 = prod2 && prodId2 !== prodId1 ? (prod2.price * qty2) : 0;
      const subtotal = sub1 + sub2;
      const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.1) : 0;
      const shipping = rnd(50_000, 250_000);
      const tax = Math.round(subtotal * 0.1);
      const total = subtotal - discount + shipping + tax;

      const status = statuses[i] as "DELIVERED" | "SHIPPED" | "PROCESSING" | "CONFIRMED" | "PENDING";
      const createdAt = daysAgo(rnd(0, 90));

      const order = await prisma.order.create({
        data: {
          orderNumber: orderNum(),
          userId: uid,
          status,
          subtotal, discountAmount: discount, shippingCost: shipping,
          taxAmount: tax, totalAmount: total,
          shippingMethod: pick(["پیک موتوری", "پست پیشتاز", "باربری", "ارسال رایگان"]),
          trackingCode: status === "SHIPPED" || status === "DELIVERED" ? `RH${rnd(10000000, 99999999)}` : null,
          deliveredAt: status === "DELIVERED" ? new Date(createdAt.getTime() + rnd(2, 7) * 86400000) : null,
          createdAt, updatedAt: createdAt,
          items: {
            create: [
              { productId: prodId1, quantity: qty1, unitPrice: prod1?.price ?? 850_000, totalPrice: sub1 },
              ...(prod2 && prodId2 !== prodId1 ? [{ productId: prodId2, quantity: qty2, unitPrice: prod2.price, totalPrice: sub2 }] : []),
            ],
          },
        },
      });

      // Payment for confirmed+ orders
      if (["DELIVERED", "SHIPPED", "PROCESSING", "CONFIRMED"].includes(status)) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: total,
            status: "PAID",
            gateway: pick(["zarinpal", "mellat", "pasargad"]),
            refId: `REF${rnd(10000000, 99999999)}`,
            paidAt: new Date(createdAt.getTime() + rnd(5, 60) * 60000),
            createdAt, updatedAt: createdAt,
          },
        });
      }

      newOrdersCount++;
    }
    report.push(`✓ ${newOrdersCount} سفارش + پرداخت`);
  } else {
    report.push(`↩ سفارشات کافی موجود است (${existingOrders} سفارش)`);
  }

  // ── 6. Reviews ──────────────────────────────────────────────────────────────
  const existingReviews = await prisma.review.count();
  if (existingReviews < 35 && userIds.length > 0) {
    let reviewCount = 0;
    for (let i = 0; i < 40; i++) {
      await prisma.review.create({
        data: {
          productId: pick(allProductIds),
          userId: pick(userIds),
          rating: pick([3, 4, 4, 4, 5, 5, 5]),
          title: pick(REVIEW_TITLES),
          content: pick(REVIEW_CONTENTS),
          isApproved: Math.random() > 0.3,
          createdAt: daysAgo(rnd(1, 90)),
        },
      });
      reviewCount++;
    }
    report.push(`✓ ${reviewCount} نظر محصول`);
  } else {
    report.push(`↩ نظرات کافی موجود است`);
  }

  // ── 7. FAQs ────────────────────────────────────────────────────────────────
  const existingFaqs = await prisma.faq.count();
  if (existingFaqs < 10) {
    for (let i = 0; i < FAQ_DATA.length; i++) {
      await prisma.faq.create({
        data: { question: FAQ_DATA[i].q, answer: FAQ_DATA[i].a, sortOrder: i, isActive: true },
      });
    }
    report.push(`✓ ${FAQ_DATA.length} سوال متداول`);
  } else {
    report.push(`↩ FAQها موجود است`);
  }

  // ── 8. Newsletter Subscribers ───────────────────────────────────────────────
  let newsletterCount = 0;
  for (const email of NEWSLETTER_EMAILS) {
    try {
      await prisma.newsletter.upsert({
        where: { email },
        update: {},
        create: { email, isActive: true, createdAt: daysAgo(rnd(1, 180)) },
      });
      newsletterCount++;
    } catch { /* skip */ }
  }
  report.push(`✓ ${newsletterCount} خبرنامه`);

  // ── 9. Coupons ──────────────────────────────────────────────────────────────
  const coupons = [
    { code: "SUMMER10", type: "percent", val: 10, min: 500_000, max: 200, desc: "تخفیف ۱۰٪ تابستانه" },
    { code: "MARJAN15", type: "percent", val: 15, min: 1_000_000, max: 100, desc: "تخفیف ویژه مرجان" },
    { code: "FIRST20", type: "percent", val: 20, min: 300_000, max: 500, desc: "تخفیف اولین خرید" },
    { code: "CASH50K", type: "fixed", val: 50_000, min: 800_000, max: 150, desc: "۵۰ هزار تومان تخفیف نقدی" },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code, discountType: c.type, discountValue: c.val,
        minOrderAmount: c.min, maxUsageCount: c.max,
        description: c.desc, isActive: true,
        expiresAt: new Date(Date.now() + 90 * 86400000),
        usedCount: rnd(5, 80),
      },
    });
  }
  report.push(`✓ ${coupons.length} کوپن تخفیف`);

  // ── 10. System Logs ─────────────────────────────────────────────────────────
  const existingLogs = await prisma.systemLog.count();
  if (existingLogs < 80) {
    const levels = ["INFO","INFO","INFO","WARNING","WARNING","ERROR","CRITICAL"] as ("INFO"|"WARNING"|"ERROR"|"CRITICAL")[];
    const ips = ["185.220.101.14", "10.0.0.1", "192.168.1.5", "5.200.1.130", "78.38.45.12"];
    for (let i = 0; i < 80; i++) {
      await prisma.systemLog.create({
        data: {
          level: pick(levels),
          action: pick(LOG_ACTIONS),
          userId: userIds.length ? pick(userIds) : null,
          ipAddress: pick(ips),
          details: { sessionId: `sess_${rnd(10000, 99999)}`, module: pick(["orders","auth","payment","products"]) },
          createdAt: daysAgo(rnd(0, 30)),
        },
      });
    }
    report.push(`✓ ۸۰ لاگ سیستم`);
  } else {
    report.push(`↩ لاگ‌ها کافی است`);
  }

  // ── 11. Return Requests ─────────────────────────────────────────────────────
  const existingReturns = await prisma.returnRequest.count();
  if (existingReturns < 6 && userIds.length > 0) {
    const deliveredOrders = await prisma.order.findMany({
      where: { status: "DELIVERED" }, select: { id: true, userId: true, totalAmount: true }, take: 6,
    });
    for (const o of deliveredOrders) {
      await prisma.returnRequest.create({
        data: {
          orderId: o.id, userId: o.userId,
          reason: pick(["کالا معیوب بود", "تفاوت با تصویر سایت", "کالا آسیب دیده رسید", "سایز اشتباه ارسال شد"]),
          description: "درخواست مرجوعی توسط مشتری ثبت شد. لطفاً بررسی شود.",
          status: pick(["PENDING", "APPROVED", "REJECTED"]),
          refundAmount: o.totalAmount,
          createdAt: daysAgo(rnd(1, 20)),
        },
      });
    }
    report.push(`✓ ${deliveredOrders.length} درخواست مرجوعی`);
  } else {
    report.push(`↩ مرجوعی‌ها موجود است`);
  }

  // ── 12. Org Requests ───────────────────────────────────────────────────────
  const existingOrg = await prisma.orgRequest.count();
  if (existingOrg < 5) {
    for (const r of ORG_REQUESTS) {
      await prisma.orgRequest.create({
        data: {
          companyName: r.company, contactName: r.contact, phone: r.phone,
          category: r.cat, estimatedAmount: r.amt, description: r.desc,
          status: pick(["PENDING", "PENDING", "REVIEWING", "APPROVED"]),
          createdAt: daysAgo(rnd(1, 60)),
        },
      });
    }
    report.push(`✓ ${ORG_REQUESTS.length} درخواست سازمانی`);
  } else {
    report.push(`↩ درخواست‌های سازمانی موجود است`);
  }

  // ── 13. Product Questions ──────────────────────────────────────────────────
  const existingQuestions = await prisma.productQuestion.count();
  if (existingQuestions < 10 && userIds.length > 0) {
    const questions = [
      "آیا این محصول با لوله‌های ۲ اینچ سازگار است؟",
      "مقاومت فشاری این شیر چقدر است؟",
      "آیا گارانتی بین‌المللی دارد؟",
      "برای سیستم گرمایش از کف مناسب است؟",
      "آیا رنگ دیگری هم موجود است؟",
      "حداکثر دمای کاری این محصول چقدر است؟",
      "آیا اتصالات جانبی هم موجود است؟",
      "برای آب شور مناسب است؟",
      "آیا می‌توان به صورت عمده سفارش داد؟",
      "گواهی استاندارد ایران دارد؟",
    ];
    for (let i = 0; i < questions.length; i++) {
      await prisma.productQuestion.create({
        data: {
          productId: pick(allProductIds),
          userId: pick(userIds),
          question: questions[i],
          answer: i % 3 === 0 ? "بله، این محصول برای این کاربرد مناسب است. برای اطمینان با پشتیبانی تماس بگیرید." : null,
          answeredAt: i % 3 === 0 ? daysAgo(rnd(1, 10)) : null,
          isApproved: true,
          createdAt: daysAgo(rnd(1, 60)),
        },
      });
    }
    report.push(`✓ ${questions.length} سوال محصول`);
  } else {
    report.push(`↩ سوالات محصول موجود است`);
  }

  // ── 14. Invoices ────────────────────────────────────────────────────────────
  const existingInvoices = await prisma.invoice.count();
  if (existingInvoices < 10 && userIds.length > 0) {
    for (let i = 0; i < 12; i++) {
      const itemQty = rnd(1, 3);
      const itemPrice = rnd(200_000, 3_000_000);
      const subtotal = itemQty * itemPrice;
      const tax = Math.round(subtotal * 0.1);
      const total = subtotal + tax;
      const uid = pick(userIds);
      const user = await prisma.user.findUnique({ where: { id: uid }, select: { firstName: true, lastName: true, phone: true } });
      await prisma.invoice.create({
        data: {
          userId: uid,
          invoiceNumber: `INV-${Date.now()}-${rnd(100, 999)}`,
          type: pick(["OFFICIAL", "CONTRACTOR"]),
          buyerName: user ? `${user.firstName} ${user.lastName}` : "مشتری",
          buyerPhone: user?.phone ?? "09120000000",
          sellerName: "مرجان شاپ",
          sellerPhone: "02188776655",
          sellerAddress: "تهران، ولنجک، بلوار دانشجو",
          issueDate: new Date().toLocaleDateString("fa-IR"),
          items: [{ name: pick(PRODUCTS_DATA).name, qty: itemQty, price: itemPrice, total: itemQty * itemPrice }],
          subtotal, totalAmount: total, taxPct: 10,
          createdAt: daysAgo(rnd(1, 60)),
        },
      });
    }
    report.push(`✓ ۱۲ فاکتور`);
  } else {
    report.push(`↩ فاکتورها موجود است`);
  }

  // ── 15. Wallet for top users ───────────────────────────────────────────────
  if (userIds.length > 0) {
    let walletCount = 0;
    for (const uid of userIds.slice(0, 5)) {
      const existing = await prisma.wallet.findUnique({ where: { userId: uid } });
      if (!existing) {
        const bal = rnd(100_000, 2_000_000);
        const wallet = await prisma.wallet.create({
          data: { userId: uid, balance: bal },
        });
        await prisma.walletTx.create({
          data: {
            walletId: wallet.id,
            amount: bal,
            type: "CREDIT",
            description: "شارژ اولیه کیف پول — داده آزمایشی",
          },
        });
        walletCount++;
      }
    }
    if (walletCount > 0) report.push(`✓ ${walletCount} کیف پول`);
  }

  // ── 16. Contact Messages (if few) ─────────────────────────────────────────
  const existingContacts = await prisma.contactMessage.count();
  if (existingContacts < 5) {
    const msgs = [
      { name: "علی رضایی", phone: "09121234567", subject: "سوال درباره شیرآلات", message: "سلام، آیا شیر توپی DN50 در موجودی دارید؟ قیمت عمده برای ۵۰ عدد چقدر می‌شود؟" },
      { name: "مریم کریمی", phone: "09359876543", subject: "مشکل در ثبت سفارش", message: "سلام، چند بار سعی کردم سفارش ثبت کنم ولی خطا می‌دهد. لطفاً پیگیری کنید." },
      { name: "حسن محمدپور", phone: "09017654321", subject: "درخواست نمایندگی", message: "در اصفهان فعالیت دارم و مایل به اخذ نمایندگی هستم. شرایط همکاری را اعلام کنید." },
      { name: "زهرا احمدی", phone: "09351239876", subject: "استعلام قیمت پمپ", message: "قیمت پمپ آب خانگی ۲ اسب بخار چقدر است؟ آیا نصب هم دارید؟" },
    ];
    for (const m of msgs) {
      await prisma.contactMessage.create({ data: { ...m, isRead: Math.random() > 0.5 } });
    }
    report.push(`✓ ۴ پیام تماس`);
  } else {
    report.push(`↩ پیام‌های تماس موجود است`);
  }

  return NextResponse.json({
    message: "✅ داده‌های آزمایشی با موفقیت ایجاد شدند",
    summary: report,
    totalRevenue: `~${newOrdersCount * 1_800_000 / 1_000_000}M تومان`,
  });
}
