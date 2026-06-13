import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const role = (req.auth?.user as { role?: string } | undefined)?.role ?? "";
  const authed = !!req.auth;

  // ── Admin API rate limit ────────────────────────────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    const ip = getClientIp(req as unknown as Request);
    const isAdmin = ADMIN_ROLES.includes(role);
    const [limit, window] = isAdmin ? [2000, 60 * 60_000] : [20, 60 * 60_000];
    const key = isAdmin ? `admin-api-auth:${ip}` : `admin-api-unauth:${ip}`;
    if (isRateLimited(key, limit, window)) {
      return NextResponse.json(
        { error: "تعداد درخواست‌های شما بیش از حد مجاز است. یک ساعت دیگر تلاش کنید." },
        { status: 429 }
      );
    }
  }

  // ── Admin pages & admin API ─────────────────────────────────────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!authed) return NextResponse.redirect(new URL("/", req.url));
    if (!ADMIN_ROLES.includes(role)) return NextResponse.redirect(new URL("/", req.url));
  }

  // ── User dashboard ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!authed) return NextResponse.redirect(new URL("/", req.url));
  }

  // ── Checkout requires auth ──────────────────────────────────────────────────
  if (pathname.startsWith("/checkout")) {
    if (!authed) return NextResponse.redirect(new URL("/", req.url));
  }

  // ── Maintenance mode ────────────────────────────────────────────────────────
  const isPublicPage =
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/checkout") &&
    pathname !== "/maintenance";

  if (isPublicPage) {
    const maintenanceCookie = req.cookies.get("maintenance_mode")?.value;
    if (maintenanceCookie === "true" && !["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  }

  return NextResponse.next();
});

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
