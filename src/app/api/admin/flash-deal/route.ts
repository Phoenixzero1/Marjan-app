import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

const KEY = "marjan_time_config";

const DEFAULT = {
  isActive: false,
  title: "مرجان تایم",
  endTime: null as string | null,
  productIds: [] as string[],
  discountPct: 20,
};

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const row = await prisma.siteSettings.findUnique({ where: { key: KEY } });
    if (!row) return NextResponse.json(DEFAULT);
    return NextResponse.json(JSON.parse(row.value));
  } catch {
    return NextResponse.json(DEFAULT);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    await prisma.siteSettings.upsert({
      where: { key: KEY },
      create: { key: KEY, value: JSON.stringify(body), group: "homepage" },
      update: { value: JSON.stringify(body) },
    });
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
