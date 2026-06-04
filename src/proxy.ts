import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"];
const SUPER_ADMIN_ROLES = ["SUPER_ADMIN"];

// Module-level maintenance cache (shared across requests in the same process instance)
let _maintenanceOn = false;
let _maintenanceCachedAt = 0;
const MAINTENANCE_TTL = 30_000; // 30 seconds

async function isMaintenanceOn(req: NextRequest): Promise<boolean> {
  const now = Date.now();
  if (now - _maintenanceCachedAt < MAINTENANCE_TTL) return _maintenanceOn;
  try {
    const res = await fetch(`${req.nextUrl.origin}/api/maintenance-status`, {
      headers: { "x-proxy-internal": "1" },
    });
    if (res.ok) {
      const data = await res.json();
      _maintenanceOn = data.on === true;
      _maintenanceCachedAt = now;
    }
  } catch {
    /* keep cached value */
  }
  return _maintenanceOn;
}

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const { pathname } = req.nextUrl;

  // ── Skip static assets, API routes, maintenance page itself ────────────────
  const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/favicon");
  const isApiMaintenance = pathname === "/api/maintenance-status";
  const isMaintenancePage = pathname === "/maintenance";
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  // ── Admin pages & admin API ─────────────────────────────────────────────────
  if (isAdminPath) {
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
    // Admin passes through regardless of maintenance mode
    return NextResponse.next();
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

  // ── Maintenance mode check (skip for admin, static, API internal, maintenance page) ──
  if (!isStatic && !isApiMaintenance && !isMaintenancePage && !isAdminPath) {
    const userRole = (token?.role as string) ?? "";
    const isSuperAdmin = SUPER_ADMIN_ROLES.includes(userRole);

    if (!isSuperAdmin) {
      const maintenance = await isMaintenanceOn(req);
      if (maintenance) {
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
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
