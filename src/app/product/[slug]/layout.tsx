import type { Metadata } from "next";

// Dynamic title is handled client-side via document.title in the page.
// This provides the base metadata for the route group.
export const metadata: Metadata = {
  title: {
    default: "محصول | مارجان",
    template: "%s | مارجان",
  },
  openGraph: {
    siteName: "مارجان",
    locale: "fa_IR",
    type: "website",
  },
};

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
