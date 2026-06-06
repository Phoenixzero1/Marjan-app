import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/shop/ProductCard";

export const revalidate = 3600;

async function getBrand(slug: string) {
  return prisma.brand.findUnique({
    where: { slug, isActive: true },
    include: {
      products: {
        where: { status: "PUBLISHED", deletedAt: null },
        orderBy: { saleCount: "desc" },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          brand: { select: { name: true } },
          sizes: { take: 6 },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const brand = await getBrand(slug);
  if (!brand) return { title: "برند یافت نشد" };
  return {
    title: `${brand.name} | مارجان`,
    description: brand.description ?? `محصولات برند ${brand.name} در فروشگاه مارجان`,
  };
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const brand = await getBrand(slug);
  if (!brand) notFound();

  return (
    <div style={{ fontFamily: "Vazirmatn" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1280, margin: "auto", padding: ".75rem 2rem", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)", fontWeight: 700 }}>
          <Link href="/" style={{ color: "var(--primary)" }}>خانه</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <Link href="/products" style={{ color: "var(--primary)" }}>محصولات</Link>
          <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
          <span>{brand.name}</span>
        </div>
      </div>

      {/* Brand Hero */}
      <div style={{ background: "linear-gradient(135deg,var(--primary-dark),var(--primary-mid))", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 1280, margin: "auto", display: "flex", alignItems: "center", gap: 24 }}>
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt={brand.name} style={{ width: 80, height: 60, objectFit: "contain", background: "#fff", borderRadius: 10, padding: 8 }} />
          ) : (
            <div style={{ width: 72, height: 60, background: "rgba(255,255,255,.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-building-factory" style={{ fontSize: 32, color: "rgba(255,255,255,.7)" }} />
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: 0 }}>{brand.name}</h1>
            {brand.country && <p style={{ fontSize: 13, color: "rgba(255,255,255,.65)", margin: "4px 0 0" }}>{brand.country}</p>}
            {brand.description && <p style={{ fontSize: 13, color: "rgba(255,255,255,.7)", margin: "8px 0 0", maxWidth: 500 }}>{brand.description}</p>}
          </div>
          <div style={{ marginRight: "auto", textAlign: "center" }}>
            <strong style={{ display: "block", fontSize: 28, fontWeight: 900, color: "var(--accent)" }}>{brand.products.length}</strong>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>محصول</span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div style={{ maxWidth: 1280, margin: "3rem auto", padding: "0 2rem" }}>
        {brand.products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text3)", background: "#fff", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
            <i className="ti ti-package" style={{ fontSize: 48, display: "block", marginBottom: 12 }} />
            <p>محصولی برای این برند در حال حاضر موجود نیست.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {brand.products.map(p => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                price={p.price}
                comparePrice={p.comparePrice}
                brand={p.brand}
                images={p.images}
                sizes={p.sizes.map(s => ({ ...s, price: s.price ?? null }))}
                isNew={p.isNew}
                isFeatured={p.isFeatured}
                stockQty={p.stockQty}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
