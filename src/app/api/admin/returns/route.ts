import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";export async function GET() {
  if (!(await requirePermission("MANAGE_RETURNS"))) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const returns = await prisma.returnRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      order: { select: { orderNumber: true, totalAmount: true, status: true } },
    },
  });

  return NextResponse.json({ returns });
}
