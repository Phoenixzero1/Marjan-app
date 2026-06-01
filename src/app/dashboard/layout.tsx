import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "داشبورد | مارجان",
  description: "مدیریت سفارشات، پروفایل و آدرس‌های شما در فروشگاه مارجان.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
