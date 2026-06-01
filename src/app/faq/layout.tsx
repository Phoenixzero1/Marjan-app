import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سوالات متداول | مارجان",
  description: "پاسخ به سوالات رایج درباره خرید، ارسال، پرداخت و گارانتی محصولات فروشگاه مارجان.",
  openGraph: {
    title: "سوالات متداول مارجان",
    locale: "fa_IR",
    type: "website",
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
