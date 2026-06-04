import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lightweight endpoint called by proxy.ts to check maintenance mode.
// Uses a short-lived module cache to reduce DB hits.
let cached: { on: boolean; message: string; estimated: string } | null = null;
let cachedAt = 0;
const TTL = 30_000;

export async function GET() {
  const now = Date.now();
  if (cached && now - cachedAt < TTL) {
    return NextResponse.json(cached);
  }

  try {
    const rows = await prisma.siteSettings.findMany({
      where: { key: { in: ["maintenance_mode", "maintenance_message", "maintenance_estimated"] } },
      select: { key: true, value: true },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    cached = {
      on: map.maintenance_mode === "true",
      message: map.maintenance_message ?? "در حال به‌روزرسانی هستیم. به زودی برمی‌گردیم.",
      estimated: map.maintenance_estimated ?? "",
    };
    cachedAt = now;
    return NextResponse.json(cached);
  } catch {
    return NextResponse.json({ on: false, message: "", estimated: "" });
  }
}

// Called by admin when toggling maintenance mode to clear cache
export async function DELETE() {
  cached = null;
  cachedAt = 0;
  return NextResponse.json({ cleared: true });
}
