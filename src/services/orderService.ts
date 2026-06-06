import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getAdminOrders(params: { page?: number; limit?: number; status?: string; q?: string }) {
  const { page = 1, limit = 20, status, q } = params;
  const where: Prisma.OrderWhereInput = { deletedAt: null };
  if (status) where.status = status as Prisma.EnumOrderStatusFilter;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { user: { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } },
    ];
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true } } } },
        payment: { select: { status: true, refId: true } },
        address: { select: { city: true, province: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getUserOrders(userId: string, params: { page?: number; limit?: number }) {
  const { page = 1, limit = 10 } = params;
  const where: Prisma.OrderWhereInput = { userId, deletedAt: null };

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      include: {
        items: { include: { product: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } } } },
        payment: { select: { status: true, amount: true, paidAt: true } },
        address: { select: { fullName: true, city: true, province: true, address: true, postalCode: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getOrderById(id: string, userId?: string) {
  return prisma.order.findFirst({
    where: { id, ...(userId ? { userId } : {}), deletedAt: null },
    include: {
      items: { include: { product: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } } } },
      payment: true,
      address: true,
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      returns: true,
    },
  });
}

export async function updateOrderStatus(orderId: string, status: string, trackingCode?: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "RETURNED" | "CANCELLED",
      ...(trackingCode ? { trackingCode } : {}),
      ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    },
  });
}
