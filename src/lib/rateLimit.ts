// Simple in-memory rate limiter (per IP, per route key)
// For multi-server production: replace with Redis-based solution (e.g. upstash/ratelimit)

interface Record {
  count: number;
  resetAt: number;
}

const store = new Map<string, Record>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Returns true if the request should be blocked (rate limited).
 * @param key  unique key (e.g. "register:192.168.1.1")
 * @param max  max requests per window
 * @param windowMs  window size in ms (default 60s)
 */
export function isRateLimited(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = store.get(key);

  if (!record || record.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  record.count++;
  if (record.count > max) return true;
  return false;
}

export function getClientIp(req: Request): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
