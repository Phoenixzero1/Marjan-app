export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST() {
  if (!(await requirePermission("VIEW_ADMIN")))
    return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const created: string[] = [];

  // ── 1. Contact Messages ─────────────────────────────────────────────────
  const existingContacts = await prisma.contactMessage.count();
  if (existingContacts < 3) {
    const contacts = [
      {
        name: "علی رضایی",
        phone: "09121234567",
        email: "ali.rezaei@example.com",
        subject: "سوال درباره شیرآلات ساختمانی",
        message:
          "سلام، می‌خواستم بدانم آیا شیرآلات برند ایران ناوه در انبار موجود هست؟ قیمت عمده برای ۵۰ عدد شیر توپی DN50 چقدر می‌شود؟ ممنون از راهنمایی شما.",
        isRead: false,
      },
      {
        name: "مریم کریمی",
        phone: "09359876543",
        email: "maryam.karimi@example.com",
        subject: "مشکل در ثبت سفارش",
        message:
          "خانم/آقا سلام. من چند بار سعی کردم سفارشم رو ثبت کنم ولی بعد از پرداخت پیام خطا می‌ده. لطفاً پیگیری کنید. سفارشم برای لوله‌های مانیسمان ۳ اینچ بود.",
        isRead: false,
      },
      {
        name: "حسن محمدپور",
        phone: "09017654321",
        email: null,
        subject: "درخواست نمایندگی",
        message:
          "با سلام و احترام، بنده در شهر اصفهان فعال در حوزه تأسیسات ساختمانی هستم و مایل به اخذ نمایندگی فروش محصولات شما می‌باشم. خواهشمند است شرایط همکاری را اعلام فرمایید.",
        isRead: true,
      },
    ];

    for (const c of contacts) {
      await prisma.contactMessage.create({ data: c });
    }
    created.push(`${contacts.length} پیام تماس`);
  }

  // ── 2. Blog Post + Comments ─────────────────────────────────────────────
  const post = await prisma.blogPost.upsert({
    where: { slug: "راهنمای-انتخاب-لوله-و-اتصالات-ساختمانی" },
    update: {},
    create: {
      title: "راهنمای جامع انتخاب لوله و اتصالات ساختمانی",
      slug: "راهنمای-انتخاب-لوله-و-اتصالات-ساختمانی",
      excerpt:
        "در این مقاله نگاهی جامع به انواع لوله و اتصالات ساختمانی می‌اندازیم و راهنمایی برای انتخاب بهترین گزینه ارائه می‌دهیم.",
      content: `<h2>مقدمه</h2><p>انتخاب صحیح لوله و اتصالات ساختمانی یکی از مهم‌ترین تصمیمات در هر پروژه تأسیساتی است.</p>
<h2>انواع لوله</h2><p>لوله‌های مانیسمان، گالوانیزه، پلیمری و مسی هر کدام کاربردهای خاص خود را دارند.</p>
<h2>نکات مهم</h2><p>همیشه قبل از خرید با یک متخصص مشورت کنید.</p>`,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  const existingComments = await prisma.blogComment.count({ where: { postId: post.id } });
  if (existingComments < 3) {
    const comments = [
      {
        postId: post.id,
        authorName: "رضا احمدی",
        authorEmail: "reza.ahmadi@example.com",
        content:
          "مقاله خیلی مفیدی بود. من همیشه در انتخاب بین لوله مانیسمان و گالوانیزه سردرگم می‌شدم. ممنون از توضیحات کامل.",
        isApproved: true,
      },
      {
        postId: post.id,
        authorName: "نگار صادقی",
        authorEmail: "negar.sadeghi@example.com",
        content:
          "آیا میتوانید بیشتر توضیح بدید که برای سیستم گرمایشی کدام نوع لوله مناسب‌تره؟ لوله پلیمری یا مسی؟",
        isApproved: false,
      },
      {
        postId: post.id,
        authorName: "مهندس جوادی",
        authorEmail: "m.javadi@example.com",
        content:
          "به عنوان یک مهندس تأسیسات، این مقاله رو تأیید می‌کنم. فقط یه نکته اضافه کنم: در مناطق سردسیر حتماً از لوله با ضخامت بیشتر استفاده کنید تا از ترکیدن در زمستان جلوگیری بشه.",
        isApproved: true,
      },
    ];

    for (const c of comments) {
      await prisma.blogComment.create({ data: c });
    }
    created.push(`${comments.length} نظر بلاگ برای پست "${post.title}"`);
  }

  if (created.length === 0) {
    return NextResponse.json({ message: "داده‌های آزمایشی قبلاً ایجاد شده‌اند.", created: [] });
  }

  return NextResponse.json({ message: `داده‌های آزمایشی با موفقیت ایجاد شدند.`, created });
}
