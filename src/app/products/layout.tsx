import type { Metadata } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marjan.ir";

export const metadata: Metadata = {
  title: "محصولات | مارجان",
  description: "مشاهده و خرید بیش از ۱۲,۰۰۰ محصول شیرآلات، لوله، اتصالات و لوازم ساختمانی با بهترین قیمت.",
  keywords: ["شیرآلات", "لوله", "اتصالات", "خرید آنلاین", "مارجان"],
  alternates: { canonical: `${BASE}/products` },
  openGraph: {
    title: "محصولات مارجان — فروشگاه لوازم ساختمانی",
    description: "کامل‌ترین مجموعه شیرآلات، لوله، اتصالات و پمپ‌های صنعتی و ساختمانی.",
    url: `${BASE}/products`,
    siteName: "مارجان",
    locale: "fa_IR",
    type: "website",
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
