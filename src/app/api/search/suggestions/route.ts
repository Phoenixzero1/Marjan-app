export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type SuggestionRow = { id: string; name: string; slug: string; price: bigint; categoryName: string | null };
type CategoryRow = { id: string; name: string; slug: string };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ suggestions: [], categories: [] });

  try {
    const [prefixResults, categories] = await Promise.all([
      // Primary: prefix-match on product name
      prisma.$queryRaw<SuggestionRow[]>`
        SELECT p.id, p.name, p.slug, p.price, c.name AS "categoryName"
        FROM "Product" p
        LEFT JOIN "Category" c ON c.id = p."categoryId"
        WHERE p."deletedAt" IS NULL
          AND p."status" = 'PUBLISHED'
          AND p.name ILIKE ${q + '%'}
        ORDER BY p."saleCount" DESC
        LIMIT 5
      `,
      // Category name search
      prisma.$queryRaw<CategoryRow[]>`
        SELECT id, name, slug FROM "Category"
        WHERE name ILIKE ${'%' + q + '%'}
        ORDER BY name
        LIMIT 4
      `,
    ]);

    // Secondary: trigram for products not already in prefix results
    const similarResults = await prisma.$queryRaw<SuggestionRow[]>`
      SELECT p.id, p.name, p.slug, p.price, c.name AS "categoryName"
      FROM "Product" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      WHERE p."deletedAt" IS NULL
        AND p."status" = 'PUBLISHED'
        AND p.id NOT IN (${prefixResults.length > 0 ? Prisma.join(prefixResults.map(r => Prisma.sql`${r.id}`)) : Prisma.sql`''`})
        AND similarity(p.name, ${q}) > 0.15
      ORDER BY similarity(p.name, ${q}) DESC, p."saleCount" DESC
      LIMIT ${Math.max(0, 6 - prefixResults.length)}
    `;

    const combined = [...prefixResults, ...similarResults].slice(0, 6);

    return NextResponse.json({
      suggestions: combined.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        price: Number(r.price),
        category: r.categoryName,
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
    });
  } catch (err) {
    console.error("Search suggestions error:", err);
    return NextResponse.json({ suggestions: [], categories: [] });
  }
}
