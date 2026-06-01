import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تماس با ما | مارجان",
  description: "برای ارتباط با تیم پشتیبانی فروشگاه مارجان از طریق فرم تماس، تلفن یا ایمیل اقدام کنید.",
  openGraph: {
    title: "تماس با مارجان",
    locale: "fa_IR",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
