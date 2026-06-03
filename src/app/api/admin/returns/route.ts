import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"];

async function requireAdmin() {
  const session = await auth();
  return session?.user?.id && ADMIN_ROLES.includes(session.user.role ?? "") ? session : null;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const returns = await prisma.returnRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      order: { select: { orderNumber: true, totalAmount: true, status: true } },
    },
  });

  return NextResponse.json({ returns });
}
