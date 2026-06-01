# Marjan — راهنمای راه‌اندازی

## پیش‌نیازها
- Node.js 20+
- PostgreSQL 15+
- (اختیاری) حساب Zarinpal برای پرداخت

## مراحل راه‌اندازی

### ۱. نصب وابستگی‌ها
```bash
cd marjan-app
npm install
```

### ۲. تنظیم محیط
```bash
cp .env.example .env
```
فایل `.env` را با مقادیر واقعی پر کنید:
- `DATABASE_URL` — رشته اتصال PostgreSQL
- `AUTH_SECRET` — یک رشته تصادفی ۳۲+ کاراکتری
- `ZARINPAL_MERCHANT_ID` — کد پذیرندگی زرین‌پال

### ۳. راه‌اندازی دیتابیس
```bash
# ایجاد جداول
npx prisma db push

# یا با migration
npm run db:migrate

# بارگذاری داده‌های اولیه
npm run db:seed
```

### ۴. اجرای برنامه
```bash
# حالت توسعه
npm run dev

# حالت تولید
npm run build
npm start
```

### ۵. مشاهده دیتابیس
```bash
npm run db:studio
```
---

## اطلاعات ورود پیش‌فرض (بعد از seed)
| نقش | ایمیل | رمز |
|-----|-------|-----|
| Super Admin | admin@marjan.ir | admin123456 |
| Customer | user@example.com | user123456 |

---

## ساختار پروژه
```
src/
├── app/
│   ├── api/              # API Routes (RESTful)
│   │   ├── auth/         # NextAuth + register
│   │   ├── products/     # محصولات
│   │   ├── categories/   # دسته‌بندی‌ها
│   │   ├── orders/       # سفارشات
│   │   ├── invoices/     # فاکتورها
│   │   ├── payment/      # Zarinpal
│   │   ├── contact/      # پیام تماس
│   │   └── admin/        # پنل ادمین APIs
│   ├── (pages)/
│   │   ├── page.tsx      # صفحه اصلی
│   │   ├── products/     # فروشگاه
│   │   ├── invoice/      # فاکتورساز
│   │   ├── dashboard/    # داشبورد کاربر
│   │   ├── admin/        # پنل مدیریت
│   │   ├── blog/         # وبلاگ
│   │   ├── about/        # درباره ما
│   │   ├── contact/      # تماس
│   │   └── faq/          # سوالات متداول
├── components/
│   ├── layout/           # Navbar, Megamenu, Footer, Cart
│   ├── shop/             # ProductCard
│   └── auth/             # AuthModal
├── lib/
│   ├── prisma.ts         # Prisma Client (singleton)
│   ├── auth.ts           # NextAuth config
│   ├── zarinpal.ts       # درگاه پرداخت
│   └── utils.ts          # توابع کمکی
├── store/
│   └── cart.ts           # Zustand cart store
└── types/
    └── next-auth.d.ts    # Type augmentation
prisma/
├── schema.prisma         # Database schema
├── seed.ts               # Seed data
└── migrations/           # DB migrations
```

---

## درگاه پرداخت Zarinpal
- تست: `ZARINPAL_SANDBOX=true`
- برای دریافت `MERCHANT_ID` به [zarinpal.com](https://zarinpal.com) مراجعه کنید
- آدرس callback: `ZARINPAL_CALLBACK_URL=https://yourdomain.com/api/payment/verify`

## دیپلوی روی سرور ابری
```bash
# Vercel
vercel --prod

# یا روی VPS با PM2
npm run build
pm2 start npm --name marjan -- start
```

## متغیرهای محیطی الزامی در تولید
```
DATABASE_URL=postgresql://...
AUTH_SECRET=<long-random-string>
AUTH_URL=https://yourdomain.com
ZARINPAL_MERCHANT_ID=<your-id>
ZARINPAL_SANDBOX=false
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```
