import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Topbar from "@/components/layout/Topbar";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import Megamenu from "@/components/layout/Megamenu";
import Footer from "@/components/layout/Footer";
import EmergencyBanner from "@/components/layout/EmergencyBanner";
import { getSiteSettings } from "@/lib/settings";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const name = s.site_name || "Marjan";
  return {
    title: {
      default: `${name} — فروشگاه لوازم ساختمانی و بهداشتی`,
      template: `%s | ${name}`,
    },
    description:
      s.seo_default_desc ||
      "کامل‌ترین فروشگاه آنلاین شیرآلات، لوله، اتصالات و لوازم ساختمانی. بیش از ۱۲,۰۰۰ محصول از برترین برندها با ارسال سریع سراسری.",
    keywords: s.seo_keywords
      ? s.seo_keywords.split(",").map((k) => k.trim())
      : ["شیرآلات", "لوله", "اتصالات", "ساختمانی", "تأسیسات"],
    openGraph: {
      siteName: name,
      locale: "fa_IR",
      type: "website",
      ...(s.og_title && { title: s.og_title }),
      ...(s.og_desc && { description: s.og_desc }),
      ...(s.og_image && { images: [s.og_image] }),
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSiteSettings();

  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth" className={cn("font-sans", geist.variable)}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body>
        <SessionProvider>
          {/* These scroll normally and disappear on scroll */}
          <EmergencyBanner />
          <Topbar />
          <NavbarWrapper />
          {/* Megamenu — manages its own fixed/relative pin via scroll detection.
              Sticky is avoided: sticky + z-index promotes to isolated compositing layer
              which breaks backdropFilter inside (samples empty layer, not slider).
              The negative margin keeps page content starting at y=84 (under the navbar). */}
          <div style={{ position: "sticky", top: 0, width: "100%", zIndex: 50 }}>
            <Megamenu />
          </div>
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <main className="site-main" style={{ flex: 1, paddingTop: "52px" }}>{children}</main>
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
