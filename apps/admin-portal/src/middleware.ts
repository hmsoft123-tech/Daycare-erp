import { NextResponse, type NextRequest } from "next/server";
import { resolveTenantSlugFromHost } from "@kinder-pilot/api-client/tenant";

const STATIC_EXT =
  /\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|map|txt|woff|woff2|ttf|eot)$/i;

const MARKETING_PREFIXES = ["/", "/about", "/programs", "/contact", "/portal", "/inquiry"];

const ADMIN_PREFIXES = [
  "/dashboard",
  "/admissions",
  "/students",
  "/parents",
  "/attendance",
  "/billing",
  "/inventory",
  "/hr",
  "/therapy",
  "/reports",
  "/settings",
  "/design",
  "/admin",
];

function isStaticOrApi(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/static")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/favicon.ico") return true;
  if (STATIC_EXT.test(pathname)) return true;
  return false;
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isMarketingPath(pathname: string): boolean {
  return MARKETING_PREFIXES.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`))
  );
}

/**
 * Edge middleware — custom domain / wildcard subdomain → invisible rewrite
 * into `/i/admin/[tenant]/...` (browser URL unchanged).
 *
 * Note: Next.js App Router treats `_folder` as private (no routes), so the
 * blueprint's `_admin/[tenant]` maps to routable `i/admin/[tenant]`.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticOrApi(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/i/admin/") || pathname.startsWith("/i/parents/")) {
    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? "";
  const tenant =
    resolveTenantSlugFromHost(host) ??
    request.nextUrl.searchParams.get("tenant") ??
    process.env.NEXT_PUBLIC_DEFAULT_TENANT ??
    "kinder-pilot";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", tenant);

  if (isAdminPath(pathname)) {
    const url = request.nextUrl.clone();
    const stripped = pathname.startsWith("/admin")
      ? pathname.replace(/^\/admin/, "") || "/dashboard"
      : pathname;
    url.pathname = `/i/admin/${tenant}${stripped}`;
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  if (isMarketingPath(pathname)) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
