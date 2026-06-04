import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"];

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const { pathname } = req.nextUrl;

  // ── Admin pages & admin API ─────────────────────────────────────────────────
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin")
  ) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    if (!ADMIN_ROLES.includes((token.role as string) ?? "")) {
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

  // ── Maintenance mode — check cookie set by admin toggle ────────────────────
  // We read from a plain response header cookie instead of fetching the DB,
  // to avoid any latency or self-referencing issues in the Edge runtime.
  const isPublicPage =
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/checkout") &&
    pathname !== "/maintenance";

  if (isPublicPage) {
    const maintenanceCookie = req.cookies.get("maintenance_mode")?.value;
    if (maintenanceCookie === "true") {
      const role = (token?.role as string) ?? "";
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
    // Public pages for maintenance check (no API routes)
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
