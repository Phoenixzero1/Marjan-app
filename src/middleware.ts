import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"];

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const { pathname } = req.nextUrl;

  // ── Admin API rate limit ──────────────────────────────────────────────────
  // Authenticated admins: 2000 req/hour (panel polling + normal usage)
  // Unauthenticated probes: 20 req/hour (security)
  if (pathname.startsWith("/api/admin")) {
    const ip = getClientIp(req as unknown as Request);
    const isAdmin = ADMIN_ROLES.includes((token as { role?: string } | null)?.role ?? "");
    const [limit, window] = isAdmin ? [2000, 60 * 60_000] : [20, 60 * 60_000];
    const key = isAdmin ? `admin-api-auth:${ip}` : `admin-api-unauth:${ip}`;
    if (isRateLimited(key, limit, window)) {
      return NextResponse.json({ error: "تعداد درخواست‌های شما بیش از حد مجاز است. یک ساعت دیگر تلاش کنید." }, { status: 429 });
    }
  }

  // ── Admin pages & admin API ─────────────────────────────────────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    if (!ADMIN_ROLES.includes((token as { role?: string }).role ?? "")) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // ── User dashboard ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // ── Checkout requires auth ──────────────────────────────────────────────────
  if (pathname.startsWith("/checkout")) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // ── Maintenance mode — read cookie set by admin toggle ─────────────────────
  const isPublicPage =
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/checkout") &&
    pathname !== "/maintenance";

  if (isPublicPage) {
    const maintenanceCookie = req.cookies.get("maintenance_mode")?.value;
    if (maintenanceCookie === "true") {
      const role = (token as { role?: string } | null)?.role ?? "";
      if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
        const url = req.nextUrl.clone();
        url.pathname = "/maintenance";
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/checkout/:path*",
    "/api/admin/:path*",
    "/",
    "/products/:path*",
    "/product/:path*",
    "/category/:path*",
    "/blog/:path*",
    "/about",
    "/contact",
    "/faq",
    "/invoice",
  ],
};
