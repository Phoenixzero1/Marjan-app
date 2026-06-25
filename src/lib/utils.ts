import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount) + " ت";
}

export function formatPriceFull(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .trim();
}

export function generateOrderNumber(): string {
  const date = new Date();
  const jalali = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `ORD-${jalali}-${random}`;
}

export function generateInvoiceNumber(type: "INV" | "LST" = "INV"): string {
  const date = new Date();
  const jalali = `1404-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${type}-${jalali}-${random}`;
}

export function toPersianDigits(str: string | number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

export function getStatusLabel(status: string): {
  label: string;
  class: string;
} {
  const map: Record<string, { label: string; class: string }> = {
    PENDING: { label: "در انتظار", class: "pill-orange" },
    CONFIRMED: { label: "تأیید شده", class: "pill-blue" },
    PROCESSING: { label: "در حال پردازش", class: "pill-blue" },
    SHIPPED: { label: "ارسال شده", class: "pill-orange" },
    DELIVERED: { label: "تحویل داده شد", class: "pill-green" },
    RETURNED: { label: "مرجوع شد", class: "pill-red" },
    CANCELLED: { label: "لغو شده", class: "pill-red" },
    PAID: { label: "پرداخت شده", class: "pill-green" },
    FAILED: { label: "ناموفق", class: "pill-red" },
    REFUNDED: { label: "بازگشت وجه", class: "pill-orange" },
  };
  return map[status] ?? { label: status, class: "pill-gray" };
}
