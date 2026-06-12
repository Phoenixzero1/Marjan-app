import type { Metadata } from "next";
import Script from "next/script";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marjan.ir";

async function getCategory(slug: string) {
  try {
    return await prisma.category.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      select: {
        name: true, slug: true, description: true, imageUrl: true,
        parent: { select: { name: true, slug: true } },
      },
    });
  } catch { return null; }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return { title: "دسته‌بندی | مارجان" };

  const url = `${BASE}/category/${slug}`;
  const desc = cat.description ?? `خرید ${cat.name} از مارجان — بهترین قیمت و کیفیت`;
  return {
    title: `${cat.name} | مارجان`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: cat.name,
      description: desc,
      url,
      siteName: "مارجان",
      locale: "fa_IR",
      type: "website",
      images: cat.imageUrl ? [{ url: cat.imageUrl, alt: cat.name }] : [],
    },
  };
}

export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return <>{children}</>;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: BASE },
      { "@type": "ListItem", position: 2, name: "محصولات", item: `${BASE}/products` },
      ...(cat.parent ? [{ "@type": "ListItem", position: 3, name: cat.parent.name, item: `${BASE}/category/${cat.parent.slug}` }] : []),
      { "@type": "ListItem", position: cat.parent ? 4 : 3, name: cat.name, item: `${BASE}/category/${slug}` },
    ],
  };

  return (
    <>
      <Script id="category-breadcrumb-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}
