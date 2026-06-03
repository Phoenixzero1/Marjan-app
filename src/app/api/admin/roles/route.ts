import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const ALL_ROLES = ["CUSTOMER", "CONTRACTOR", "CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"];
const ALL_STATUSES = ["ACTIVE", "SUSPENDED", "PENDING_VERIFY", "DELETED"];

async function requireAdmin() {
  const session = await auth();
  return session?.user?.id && ADMIN_ROLES.includes(session.user.role ?? "") ? session : null;
}

export async function GET(req: NextRequest) {
  const adminSession = await requireAdmin();
  if (!adminSession) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const q = searchParams.get("q") ?? "";
  const role = searchParams.get("role") ?? "";
  const status = searchParams.get("status") ?? "";

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role && ALL_ROLES.includes(role)) where.role = role;
  if (status && ALL_STATUSES.includes(status)) where.status = status;

  const [total, users, roleCounts] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        avatarUrl: true,
      },
    }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);

  const roleCountMap: Record<string, number> = {};
  roleCounts.forEach((r) => { roleCountMap[r.role] = r._count._all; });

  return NextResponse.json({
    users,
    total,
    page,
    pages: Math.ceil(total / limit),
    roleCounts: roleCountMap,
    myUserId: adminSession.user.id,
    myRole: adminSession.user.role,
  });
}

const patchSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["CUSTOMER", "CONTRACTOR", "CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING_VERIFY", "DELETED"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const adminSession = await requireAdmin();
  if (!adminSession) return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { userId, role, status } = parsed.data;

  // Only SUPER_ADMIN can promote to ADMIN or SUPER_ADMIN
  if (role && ["ADMIN", "SUPER_ADMIN"].includes(role) && adminSession.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "فقط مدیر ارشد می‌تواند این نقش را اعطا کند" }, { status: 403 });
  }

  // Cannot change own role
  if (role && userId === adminSession.user.id) {
    return NextResponse.json({ error: "نمی‌توانید نقش خودتان را تغییر دهید" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(role ? { role: role as "CUSTOMER" | "CONTRACTOR" | "CONTENT_MANAGER" | "ADMIN" | "SUPER_ADMIN" } : {}),
      ...(status ? { status: status as "ACTIVE" | "SUSPENDED" | "PENDING_VERIFY" | "DELETED" } : {}),
    },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true },
  });

  return NextResponse.json({ success: true, user: updated });
}
