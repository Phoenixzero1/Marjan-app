import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getAdminUsers(params: { page?: number; limit?: number; q?: string; role?: string; status?: string }) {
  const { page = 1, limit = 20, q, role, status } = params;
  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }
  if (role) where.role = role as Prisma.EnumUserRoleFilter;
  if (status) where.status = status as Prisma.EnumUserStatusFilter;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, status: true, createdAt: true, lastLoginAt: true, _count: { select: { orders: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, nationalCode: true, companyName: true, city: true, postalCode: true, role: true, status: true, createdAt: true, lastLoginAt: true, _count: { select: { orders: true } } },
  });
}

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
}

export async function softDeleteUser(userId: string) {
  const orderCount = await prisma.order.count({ where: { userId, deletedAt: null } });
  if (orderCount > 0) {
    return prisma.user.update({
      where: { id: userId },
      data: { status: "DELETED", email: null, phone: null, passwordHash: null, firstName: "کاربر", lastName: "حذف‌شده" },
    });
  }
  return prisma.user.delete({ where: { id: userId } });
}
