import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Topbar from "@/components/layout/Topbar";
import Navbar from "@/components/layout/Navbar";
import Megamenu from "@/components/layout/Megamenu";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Marjan — فروشگاه لوازم ساختمانی و بهداشتی",
    template: "%s | Marjan",
  },
  description:
    "کامل‌ترین فروشگاه آنلاین شیرآلات، لوله، اتصالات و لوازم ساختمانی. بیش از ۱۲,۰۰۰ محصول از برترین برندها با ارسال سریع سراسری.",
  keywords: ["شیرآلات", "لوله", "اتصالات", "ساختمانی", "تأسیسات", "مارجان"],
  openGraph: {
    siteName: "Marjan",
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <SessionProvider>
          <Topbar />
          <Navbar />
          <Megamenu />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
