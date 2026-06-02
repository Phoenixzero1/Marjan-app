// Simple in-memory rate limiter (per IP / per key)
// NOTE: resets on server restart and does not share state across multiple instances.
// For multi-server / serverless production: replace with @upstash/ratelimit + Redis.

import { NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Purge expired entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Returns true if this key has exceeded its quota (request should be blocked).
 * @param key      Unique string, e.g. "login:192.168.1.1" or "otp:09121234567"
 * @param max      Maximum allowed hits inside the window
 * @param windowMs Time window in milliseconds (default 60 s)
 */
export function isRateLimited(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = store.get(key);

  if (!record || record.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  record.count++;
  return record.count > max;
}

/** Extract the real client IP from x-forwarded-for or fall back to "unknown". */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

/** Ready-made 429 NextResponse with a Persian error message. */
export function limitExceeded(message = "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید."): NextResponse {
  return NextResponse.json({ error: message }, { status: 429 });
}
