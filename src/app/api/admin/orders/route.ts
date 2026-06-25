import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  if (!(await requirePermission("VIEW_ORDERS"))) {
    return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const status = searchParams.get("status");
  const search = searchParams.get("q");

  const where: Record<string, unknown> = { deletedAt: null };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { phone: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true } } } },
        payment: { select: { status: true, refId: true } },
        address: { select: { city: true, province: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
}

const updateSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "RETURNED", "CANCELLED"]),
  trackingCode: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await requirePermission("EDIT_ORDERS");
  if (!session) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { orderId, status, trackingCode } = parsed.data;

  const before = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, trackingCode: true } });
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...(trackingCode ? { trackingCode } : {}),
      ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    },
  });

  const action = trackingCode && !before?.trackingCode ? "ORDER_TRACKING_UPDATE" : "ORDER_STATUS_CHANGE";
  audit({ userId: session.user.id, action, entity: "Order", entityId: orderId, oldValue: before, newValue: { status, trackingCode }, ip: getClientIp(req), ua: req.headers.get("user-agent") });
  return NextResponse.json({ order });
}
