export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const status = searchParams.get("status") ?? undefined;
  const limit = 20;

  const where = status ? { status } : {};
  const [requests, total] = await prisma.$transaction([
    prisma.orgRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.orgRequest.count({ where }),
  ]);

  return NextResponse.json({ requests, total, page, limit });
}

export async function PATCH(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  try {
    const { id, status, adminNote } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const updated = await prisma.orgRequest.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(adminNote !== undefined ? { adminNote } : {}),
      },
    });
    return NextResponse.json({ ok: true, request: updated });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
