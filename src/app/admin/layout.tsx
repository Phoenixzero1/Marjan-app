import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پنل مدیریت | مارجان",
  description: "پنل مدیریت فروشگاه مارجان.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
