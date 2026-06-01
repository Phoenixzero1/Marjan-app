import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "محصولات | مارجان",
  description: "مشاهده و خرید بیش از ۱۲,۰۰۰ محصول شیرآلات، لوله، اتصالات و لوازم ساختمانی با بهترین قیمت.",
  keywords: ["شیرآلات", "لوله", "اتصالات", "خرید آنلاین", "مارجان"],
  openGraph: {
    title: "محصولات مارجان — فروشگاه لوازم ساختمانی",
    description: "کامل‌ترین مجموعه شیرآلات، لوله، اتصالات و پمپ‌های صنعتی و ساختمانی.",
    locale: "fa_IR",
    type: "website",
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
