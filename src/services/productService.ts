import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ProductListParams {
  page?: number;
  limit?: number;
  categoryId?: string | null;
  brandId?: string | null;
  search?: string;
  sort?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  status?: string;
}

export async function getProducts(params: ProductListParams) {
  const { page = 1, limit = 12, categoryId, brandId, search = "", sort = "createdAt_desc", minPrice, maxPrice, status = "PUBLISHED" } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = { deletedAt: null, status: status as Prisma.EnumProductStatusFilter };
  if (categoryId) where.categoryId = categoryId;
  if (brandId) where.brandId = brandId;
  if (minPrice != null) where.price = { ...((where.price as object) ?? {}), gte: minPrice };
  if (maxPrice != null) where.price = { ...((where.price as object) ?? {}), lte: maxPrice };

  const [sortField, sortDir] = sort.split("_");
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sortField === "price" ? { price: (sortDir as Prisma.SortOrder) ?? "asc" } :
    sortField === "saleCount" ? { saleCount: "desc" } :
    { createdAt: "desc" };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where, orderBy, skip, take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        brand: { select: { name: true } },
        sizes: { take: 6 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      brand: true,
      category: { include: { parent: { select: { name: true, slug: true } } } },
      sizes: true,
      specs: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getRelatedProducts(categoryId: string | null, excludeId: string, limit = 4) {
  if (!categoryId) return [];
  return prisma.product.findMany({
    where: { categoryId, id: { not: excludeId }, status: "PUBLISHED", deletedAt: null },
    take: limit,
    orderBy: { saleCount: "desc" },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      brand: { select: { name: true } },
      sizes: { take: 4 },
    },
  });
}

export async function getAdminProducts(params: { page?: number; limit?: number; q?: string; status?: string; categoryId?: string }) {
  const { page = 1, limit = 20, q, status, categoryId } = params;
  const where: Prisma.ProductWhereInput = { deletedAt: null };
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }];
  if (status) where.status = status as Prisma.EnumProductStatusFilter;
  if (categoryId) where.categoryId = categoryId;

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit,
      select: { id: true, name: true, sku: true, price: true, stockQty: true, status: true, category: { select: { name: true } }, brand: { select: { name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
