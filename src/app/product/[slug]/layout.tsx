import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Script from "next/script";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marjan.ir";

async function getProduct(slug: string) {
  try {
    return await prisma.product.findFirst({
      where: { slug, status: "PUBLISHED", deletedAt: null },
      include: {
        images: { where: { isPrimary: true }, take: 1, select: { url: true, altText: true } },
        brand: { select: { name: true } },
        category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } },
        reviews: { where: { isApproved: true }, select: { rating: true, title: true, content: true, createdAt: true, reviewerName: true, user: { select: { firstName: true, lastName: true } } }, take: 5 },
      },
    });
  } catch { return null; }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = params;
  const p = await getProduct(slug);
  if (!p) return { title: "محصول یافت نشد | مارجان" };

  const img = p.images[0]?.url ?? undefined;
  const desc = p.shortDesc ?? p.description?.slice(0, 160) ?? `${p.name} — مارجان`;
  const url = `${BASE}/product/${p.slug}`;

  return {
    title: `${p.name} | مارجان`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: p.name,
      description: desc,
      url,
      siteName: "مارجان",
      locale: "fa_IR",
      type: "website",
      images: img ? [{ url: img, alt: p.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description: desc,
      images: img ? [img] : [],
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const { slug } = params;
  const p = await getProduct(slug);
  if (!p) return <>{children}</>;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: BASE },
      { "@type": "ListItem", position: 2, name: "محصولات", item: `${BASE}/products` },
      ...(p.category?.parent ? [{ "@type": "ListItem", position: 3, name: p.category.parent.name, item: `${BASE}/category/${p.category.parent.slug}` }] : []),
      ...(p.category ? [{ "@type": "ListItem", position: p.category.parent ? 4 : 3, name: p.category.name, item: `${BASE}/category/${p.category.slug}` }] : []),
      { "@type": "ListItem", position: p.category ? (p.category.parent ? 5 : 4) : 3, name: p.name, item: `${BASE}/product/${p.slug}` },
    ],
  };

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDesc ?? p.description ?? undefined,
    sku: p.sku ?? undefined,
    brand: p.brand ? { "@type": "Brand", name: p.brand.name } : undefined,
    image: p.images[0]?.url ? [`${p.images[0].url}`] : undefined,
    url: `${BASE}/product/${p.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: p.price,
      availability: p.stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${BASE}/product/${p.slug}`,
    },
  };

  const avgRating = p.reviews.length > 0
    ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
    : 0;

  if (p.reviews.length > 0 && avgRating > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(1),
      reviewCount: p.reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
    productSchema.review = p.reviews.map((r) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      name: r.title ?? p.name,
      reviewBody: r.content ?? undefined,
      datePublished: r.createdAt.toISOString().split("T")[0],
      author: { "@type": "Person", name: r.reviewerName ?? (r.user ? `${r.user.firstName} ${r.user.lastName}` : "کاربر") },
    }));
  }

  return (
    <>
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}
