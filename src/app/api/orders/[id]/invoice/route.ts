import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });

  const { id } = params;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: {
        include: {
          product: { select: { name: true, sku: true } },
        },
      },
      payment: { select: { refId: true, paidAt: true, status: true } },
      address: true,
      user: { select: { firstName: true, lastName: true, phone: true, email: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });

  // Build HTML invoice and return as PDF-printable HTML page
  // (react-pdf doesn't support Farsi fonts well; using HTML+CSS for now
  //  and the user can print-to-PDF from the browser)
  const siteName = "مارجان";

  const orderDate = new Date(order.createdAt).toLocaleDateString("fa-IR", {
    year: "numeric", month: "long", day: "numeric",
  });

  const formatPrice = (n: number) =>
    n.toLocaleString("fa-IR") + " تومان";

  const itemsHtml = order.items.map((item, i) => `
    <tr style="border-bottom:1px solid #e5e7eb;${i % 2 === 0 ? "" : "background:#f9fafb"}">
      <td style="padding:10px 14px;font-weight:700">${item.product.name}${item.sizeLabel ? ` (${item.sizeLabel})` : ""}</td>
      <td style="padding:10px 14px;text-align:center;direction:ltr">${item.product.sku ?? "—"}</td>
      <td style="padding:10px 14px;text-align:center">${item.quantity.toLocaleString("fa-IR")}</td>
      <td style="padding:10px 14px;text-align:left">${formatPrice(item.unitPrice)}</td>
      <td style="padding:10px 14px;text-align:left;font-weight:700">${formatPrice(item.totalPrice)}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
  body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; padding: 2rem; }
  @media print {
    body { padding: 0; }
    button { display: none !important; }
  }
  .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; border-bottom: 3px solid #1e3a8a; padding-bottom: 1rem; }
  .brand { font-size: 28px; font-weight: 900; color: #1e3a8a; }
  .brand span { color: #f59e0b; }
  .invoice-title { font-size: 20px; font-weight: 900; color: #1e3a8a; margin-bottom: 4px; }
  .meta { color: #64748b; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  thead th { background: #1e3a8a; color: #fff; padding: 10px 14px; font-size: 12px; font-weight: 700; text-align: right; }
  .totals-row { display: flex; justify-content: flex-end; }
  .totals { width: 280px; }
  .totals tr td { padding: 6px 14px; font-size: 13px; }
  .totals tr:last-child td { font-weight: 900; font-size: 14px; border-top: 2px solid #1e3a8a; padding-top: 10px; color: #1e3a8a; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
  .info-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
  .info-box h4 { font-size: 12px; font-weight: 900; color: #1e3a8a; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .info-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
  .info-row span:first-child { color: #64748b; }
  .footer { margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; text-align: center; color: #94a3b8; font-size: 11px; }
  .print-btn { position: fixed; top: 20px; left: 20px; background: #1e3a8a; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-family: inherit; font-weight: 700; cursor: pointer; }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">🖨️ چاپ / PDF</button>

<div class="invoice-header">
  <div>
    <div class="brand">${siteName}<span>.</span></div>
    <div class="meta">فروشگاه لوازم ساختمانی و تأسیساتی</div>
  </div>
  <div style="text-align:left">
    <div class="invoice-title">فاکتور رسمی</div>
    <div class="meta">شماره سفارش: <strong>${order.orderNumber}</strong></div>
    <div class="meta">تاریخ: <strong>${orderDate}</strong></div>
    ${order.payment?.refId ? `<div class="meta">کد پیگیری پرداخت: <strong style="direction:ltr;display:inline-block">${order.payment.refId}</strong></div>` : ""}
  </div>
</div>

<div class="info-grid">
  <div class="info-box">
    <h4>🛍️ اطلاعات خریدار</h4>
    <div class="info-row"><span>نام:</span><span>${order.user.firstName} ${order.user.lastName}</span></div>
    ${order.user.phone ? `<div class="info-row"><span>موبایل:</span><span style="direction:ltr">${order.user.phone}</span></div>` : ""}
    ${order.user.email ? `<div class="info-row"><span>ایمیل:</span><span style="direction:ltr">${order.user.email}</span></div>` : ""}
  </div>
  <div class="info-box">
    <h4>📦 آدرس ارسال</h4>
    ${order.address ? `
      <div class="info-row"><span>گیرنده:</span><span>${order.address.fullName}</span></div>
      <div class="info-row"><span>موبایل:</span><span style="direction:ltr">${order.address.phone}</span></div>
      <div style="font-size:12px;line-height:1.7;margin-top:4px">${order.address.province}، ${order.address.city}، ${order.address.address}</div>
      <div class="info-row" style="margin-top:4px"><span>کد پستی:</span><span>${order.address.postalCode}</span></div>
    ` : "<div style='color:#94a3b8;font-size:12px'>آدرس ثبت نشده</div>"}
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="text-align:right">نام محصول</th>
      <th style="text-align:center">کد محصول</th>
      <th style="text-align:center">تعداد</th>
      <th style="text-align:left">قیمت واحد</th>
      <th style="text-align:left">جمع</th>
    </tr>
  </thead>
  <tbody>${itemsHtml}</tbody>
</table>

<div class="totals-row">
  <table class="totals">
    <tbody>
      <tr><td>جمع اقلام:</td><td style="text-align:left">${formatPrice(order.subtotal)}</td></tr>
      ${order.discountAmount > 0 ? `<tr><td>تخفیف${order.couponCode ? ` (${order.couponCode})` : ""}:</td><td style="text-align:left;color:#16a34a">-${formatPrice(order.discountAmount)}</td></tr>` : ""}
      ${order.shippingCost > 0 ? `<tr><td>هزینه ارسال:</td><td style="text-align:left">${formatPrice(order.shippingCost)}</td></tr>` : ""}
      ${order.taxAmount > 0 ? `<tr><td>مالیات (۹٪):</td><td style="text-align:left">${formatPrice(order.taxAmount)}</td></tr>` : ""}
      <tr><td>مبلغ کل قابل پرداخت:</td><td style="text-align:left">${formatPrice(order.totalAmount)}</td></tr>
    </tbody>
  </table>
</div>

<div class="footer">
  این فاکتور به‌صورت الکترونیکی صادر شده و معتبر است &mdash; ${siteName} &copy; ۱۴۰۴
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="invoice-${order.orderNumber}.html"`,
    },
  });
}
