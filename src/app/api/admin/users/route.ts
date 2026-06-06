import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  if (!(await requirePermission("MANAGE_USERS")))
    return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const q = searchParams.get("q");
  const role = searchParams.get("role");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }
  if (role) where.role = role;
  if (status) where.status = status;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        role: true, status: true, createdAt: true, lastLoginAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
}

const createSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().default("CUSTOMER"),
  status: z.string().default("ACTIVE"),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const session = await requirePermission("MANAGE_USERS");
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده است" }, { status: 409 });
    }
    if (data.phone) {
      const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing) return NextResponse.json({ error: "این شماره موبایل قبلاً ثبت شده است" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        role: data.role as never,
        status: data.status as never,
        passwordHash,
      },
    });

    audit({ userId: session.user.id, action: "USER_CREATE", entity: "User", entityId: user.id, newValue: { firstName: user.firstName, lastName: user.lastName, role: user.role }, ip: getClientIp(req), ua: req.headers.get("user-agent") });
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  password: z.string().min(6).optional().or(z.literal("")),
});

export async function PATCH(req: NextRequest) {
  const session = await requirePermission("MANAGE_USERS");
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, password, email, phone, role, ...rest } = updateSchema.parse(body);

    // Prevent admins from changing their own role/status (avoids self lock-out)
    if (id === session.user.id && (role || rest.status)) {
      return NextResponse.json({ error: "نمی‌توانید نقش یا وضعیت حساب خودتان را تغییر دهید" }, { status: 400 });
    }

    // Uniqueness checks when email/phone change
    if (email) {
      const e = await prisma.user.findUnique({ where: { email } });
      if (e && e.id !== id) return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده است" }, { status: 409 });
    }
    if (phone) {
      const p = await prisma.user.findUnique({ where: { phone } });
      if (p && p.id !== id) return NextResponse.json({ error: "این شماره موبایل قبلاً ثبت شده است" }, { status: 409 });
    }

    const data: Record<string, unknown> = { ...rest };
    if (email !== undefined) data.email = email || null;
    if (phone !== undefined) data.phone = phone || null;
    if (role) data.role = role;
    if (password) data.passwordHash = await bcrypt.hash(password, 12);

    const before = await prisma.user.findUnique({ where: { id }, select: { role: true, status: true, firstName: true, lastName: true } });
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, status: true },
    });

    const action = role && role !== before?.role ? "USER_ROLE_CHANGE"
      : data.status && data.status !== before?.status ? "USER_STATUS_CHANGE"
      : "USER_UPDATE";
    audit({ userId: session.user.id, action, entity: "User", entityId: id, oldValue: before, newValue: { role: user.role, status: user.status }, ip: getClientIp(req), ua: req.headers.get("user-agent") });
    return NextResponse.json({ success: true, user });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requirePermission("MANAGE_USERS");
  if (!session) return NextResponse.json({ error: "دسترسی ممنوع" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
  if (id === session.user.id) return NextResponse.json({ error: "نمی‌توانید حساب خودتان را حذف کنید" }, { status: 400 });

  const before = await prisma.user.findUnique({ where: { id }, select: { firstName: true, lastName: true, email: true, role: true } });
  const reviewerName = `${before?.firstName ?? ""} ${before?.lastName ?? ""}`.trim() + " (حذف‌شده)";

  // Anonymize all reviews by this user (preserve review content, remove user link)
  await prisma.review.updateMany({
    where: { userId: id },
    data: { userId: null, reviewerName },
  });

  // Users with orders must be soft-deleted (keep order history)
  const orderCount = await prisma.order.count({ where: { userId: id } });
  if (orderCount > 0) {
    await prisma.user.update({ where: { id }, data: { status: "DELETED" as never } });
    audit({ userId: session.user.id, action: "USER_DELETE", entity: "User", entityId: id, oldValue: before, newValue: { softDeleted: true }, ip: getClientIp(req), ua: req.headers.get("user-agent") });
    return NextResponse.json({ success: true, softDeleted: true });
  }

  await prisma.user.delete({ where: { id } });
  audit({ userId: session.user.id, action: "USER_DELETE", entity: "User", entityId: id, oldValue: before, ip: getClientIp(req), ua: req.headers.get("user-agent") });
  return NextResponse.json({ success: true });
}
