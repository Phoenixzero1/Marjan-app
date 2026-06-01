import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "دسته‌بندی | مارجان",
    template: "%s | مارجان",
  },
  openGraph: {
    siteName: "مارجان",
    locale: "fa_IR",
    type: "website",
  },
};

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
