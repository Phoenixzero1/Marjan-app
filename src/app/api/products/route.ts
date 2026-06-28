import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/** Load active flash deal config once per request to annotate matching products */
async function getActiveFlashDeal(): Promise<{ productIds: Set<string>; discountPct: number; endTime: string } | null> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { key: "marjan_time_config" } });
    if (!row) return null;
    const cfg = JSON.parse(row.value) as {
      isActive: boolean; endTime: string | null;
      productIds: string[]; discountPct: number;
    };
    if (!cfg.isActive || !cfg.endTime || !cfg.productIds?.length) return null;
    if (new Date(cfg.endTime) < new Date()) return null;
    return { productIds: new Set(cfg.productIds), discountPct: cfg.discountPct, endTime: cfg.endTime };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "12");

    // Load flash deal config once — used to annotate products at the end
    const flashDeal = await getActiveFlashDeal();
    const categoryId = searchParams.get("categoryId");
    const brandId = searchParams.get("brandId");
    const search = searchParams.get("q")?.trim() ?? "";
    const sort = searchParams.get("sort") ?? "createdAt_desc";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const status = searchParams.get("status") ?? "PUBLISHED";
    const skip = (page - 1) * limit;

    if (search.length > 0) {
      // Full-text search with ranking, with trigram fallback for typo tolerance
      type SearchRow = {
        id: string; name: string; sku: string | null; price: bigint;
        comparePrice: bigint | null; stockQty: number; status: string;
        isFeatured: boolean; isNew: boolean; tags: string[];
        createdAt: Date; saleCount: number; slug: string;
        categoryId: string | null; brandId: string | null;
      };

      const filterClauses: Prisma.Sql[] = [
        Prisma.sql`p."deletedAt" IS NULL`,
        Prisma.sql`p."status" = ${status}`,
      ];
      if (categoryId) filterClauses.push(Prisma.sql`p."categoryId" = ${categoryId}`);
      if (brandId) filterClauses.push(Prisma.sql`p."brandId" = ${brandId}`);
      if (minPrice) filterClauses.push(Prisma.sql`p."price" >= ${parseInt(minPrice)}`);
      if (maxPrice) filterClauses.push(Prisma.sql`p."price" <= ${parseInt(maxPrice)}`);

      const filterSql = Prisma.join(filterClauses, " AND ");

      // Try full-text search first, fall back to trigram if no results
      const ftsQuery = Prisma.sql`
        SELECT p.id, p.name, p.sku, p.price, p."comparePrice", p."stockQty",
               p.status, p."isFeatured", p."isNew", p.tags, p."createdAt",
               p."saleCount", p.slug, p."categoryId", p."brandId",
               ts_rank(
                 to_tsvector('simple', p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.sku, '')),
                 plainto_tsquery('simple', ${search})
               ) AS rank
        FROM "Product" p
        WHERE ${filterSql}
          AND to_tsvector('simple', p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.sku, ''))
              @@ plainto_tsquery('simple', ${search})
        ORDER BY rank DESC
        LIMIT ${limit + skip}
      `;

      const trgmQuery = Prisma.sql`
        SELECT p.id, p.name, p.sku, p.price, p."comparePrice", p."stockQty",
               p.status, p."isFeatured", p."isNew", p.tags, p."createdAt",
               p."saleCount", p.slug, p."categoryId", p."brandId",
               similarity(p.name, ${search}) AS rank
        FROM "Product" p
        WHERE ${filterSql}
          AND (similarity(p.name, ${search}) > 0.1
               OR p.name ILIKE ${'%' + search + '%'})
        ORDER BY rank DESC
        LIMIT ${limit + skip}
      `;

      let rows = await prisma.$queryRaw<(SearchRow & { rank: number })[]>(ftsQuery);

      if (rows.length === 0) {
        rows = await prisma.$queryRaw<(SearchRow & { rank: number })[]>(trgmQuery);
      }

      const total = rows.length;
      const pageRows = rows.slice(skip, skip + limit);

      // Fetch related data for result rows
      const ids = pageRows.map((r) => r.id);
      const [images, brands, categories, sizes] = await Promise.all([
        prisma.productImage.findMany({ where: { productId: { in: ids }, isPrimary: true }, take: ids.length }),
        prisma.brand.findMany({ where: { id: { in: pageRows.map(r => r.brandId).filter(Boolean) as string[] } }, select: { id: true, name: true, slug: true } }),
        prisma.category.findMany({ where: { id: { in: pageRows.map(r => r.categoryId).filter(Boolean) as string[] } }, select: { id: true, name: true, slug: true } }),
        prisma.productSize.findMany({ where: { productId: { in: ids } } }),
      ]);

      const imgMap = Object.fromEntries(images.map(i => [i.productId, i]));
      const brandMap = Object.fromEntries(brands.map(b => [b.id, b]));
      const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
      const sizeMap: Record<string, typeof sizes> = {};
      for (const s of sizes) { (sizeMap[s.productId] ??= []).push(s); }

      const products = pageRows.map((r) => ({
        ...r,
        price: Number(r.price),
        comparePrice: r.comparePrice !== null ? Number(r.comparePrice) : null,
        images: imgMap[r.id] ? [imgMap[r.id]] : [],
        brand: r.brandId ? brandMap[r.brandId] ?? null : null,
        category: r.categoryId ? catMap[r.categoryId] ?? null : null,
        sizes: sizeMap[r.id] ?? [],
        marjanTime: flashDeal?.productIds.has(r.id)
          ? { discountPct: flashDeal.discountPct, endTime: flashDeal.endTime }
          : undefined,
      }));

      return NextResponse.json({
        products,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      });
    }

    // No search — use Prisma ORM (faster for browsing)
    const where: Record<string, unknown> = { status, deletedAt: null };
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, number>).gte = parseInt(minPrice);
      if (maxPrice) (where.price as Record<string, number>).lte = parseInt(maxPrice);
    }

    const [sortField, sortDir] = sort.split("_");
    const orderBy: Record<string, string> = {};
    orderBy[sortField === "price" ? "price" : "createdAt"] =
      sortDir === "asc" ? "asc" : "desc";
    if (sort === "saleCount_desc") orderBy.saleCount = "desc";

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          brand: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
          sizes: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    const annotated = products.map((p) => ({
      ...p,
      marjanTime: flashDeal?.productIds.has(p.id)
        ? { discountPct: flashDeal.discountPct, endTime: flashDeal.endTime }
        : undefined,
    }));

    return NextResponse.json({
      products: annotated,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
