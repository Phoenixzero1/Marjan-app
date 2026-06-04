import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type SuggestionRow = { id: string; name: string; slug: string; price: bigint; categoryName: string | null };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  try {
    // Primary: prefix-match on name (fast with btree/trgm)
    const prefixResults = await prisma.$queryRaw<SuggestionRow[]>`
      SELECT p.id, p.name, p.slug, p.price, c.name AS "categoryName"
      FROM "Product" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      WHERE p."deletedAt" IS NULL
        AND p."status" = 'PUBLISHED'
        AND p.name ILIKE ${q + '%'}
      ORDER BY p."saleCount" DESC
      LIMIT 5
    `;

    // Secondary: trigram similarity (catches typos + middle-word matches)
    const similarResults = await prisma.$queryRaw<SuggestionRow[]>`
      SELECT p.id, p.name, p.slug, p.price, c.name AS "categoryName"
      FROM "Product" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      WHERE p."deletedAt" IS NULL
        AND p."status" = 'PUBLISHED'
        AND p.id NOT IN (${prefixResults.length > 0 ? Prisma.join(prefixResults.map(r => Prisma.sql`${r.id}`)) : Prisma.sql`''`})
        AND similarity(p.name, ${q}) > 0.15
      ORDER BY similarity(p.name, ${q}) DESC, p."saleCount" DESC
      LIMIT ${Math.max(0, 8 - prefixResults.length)}
    `;

    const combined = [...prefixResults, ...similarResults].slice(0, 8);

    return NextResponse.json({
      suggestions: combined.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        price: Number(r.price),
        category: r.categoryName,
      })),
    });
  } catch (err) {
    console.error("Search suggestions error:", err);
    return NextResponse.json({ suggestions: [] });
  }
}
