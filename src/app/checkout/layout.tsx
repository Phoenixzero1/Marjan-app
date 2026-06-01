import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تکمیل خرید | مارجان",
  description: "تکمیل سفارش و پرداخت امن از طریق درگاه زرین‌پال.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
