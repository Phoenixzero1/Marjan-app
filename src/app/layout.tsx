import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Topbar from "@/components/layout/Topbar";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import Megamenu from "@/components/layout/Megamenu";
import Footer from "@/components/layout/Footer";
import EmergencyBanner from "@/components/layout/EmergencyBanner";
import { getSiteSettings } from "@/lib/settings";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body>
        <SessionProvider>
          {/* Liquid glass SVG filter — edge refraction via fractal noise displacement */}
          <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden focusable="false">
            <defs>
              <filter id="lg-edge" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
                <feTurbulence type="fractalNoise" baseFrequency="0.85 0.35" numOctaves="2" seed="4" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>

          {/* Fixed header — always visible on scroll */}
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, willChange: "transform" }}>
            <EmergencyBanner />
            <Topbar />
            <NavbarWrapper />
            <Megamenu />
          </div>
          {/* Spacer pushes content below the fixed header (topbar≈32 + navbar≈84 + megabar≈46) */}
          <div id="header-spacer" style={{ height: 162 }} />
          <div style={{ minHeight: "calc(100vh - 162px)", display: "flex", flexDirection: "column" }}>
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
