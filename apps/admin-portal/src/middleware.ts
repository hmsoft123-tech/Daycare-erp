import { NextResponse, type NextRequest } from "next/server";
import { resolveTenantSlugFromHost } from "@kinder-pilot/api-client/tenant";
import { ACCESS_COOKIE, SESSION_COOKIE, unsealSession } from "@kinder-pilot/api-client/session";
import { can, routeCapability } from "@/lib/rbac";

const LOGIN_PATH = "/login";

const STATIC_EXT =
  /\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|map|txt|woff|woff2|ttf|eot)$/i;

const MARKETING_PREFIXES = [
  "/",
  "/about",
  "/programs",
  "/contact",
  "/portal",
  "/inquiry",
  "/enroll",
  "/apply",
];

const ADMIN_PREFIXES = [
  "/dashboard",
  "/admissions",
  "/students",
  "/classrooms",
  "/services",
  "/documents",
  "/parents",
  "/attendance",
  "/academics",
  "/courses",
  "/special-programs",
  "/health",
  "/communications",
  "/library",
  "/incidents",
  "/workflows",
  "/billing",
  "/finance",
  "/inventory",
  "/maintenance",
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
 * into `/i/admin/[tenant]/...` (browser URL unchanged). ERP paths require a
 * signed session cookie; otherwise the user is sent to /login?next=….
 *
 * Note: Next.js App Router treats `_folder` as private (no routes), so the
 * blueprint's `_admin/[tenant]` maps to routable `i/admin/[tenant]`.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticOrApi(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/i/admin/") || pathname.startsWith("/i/parents/")) {
    // Internal rewrite targets — reaching them directly would bypass host → tenant
    // resolution (e.g. /i/admin/other-school/... from any domain).
    if (process.env.NODE_ENV === "production") {
      return new NextResponse(null, { status: 404 });
    }
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

  const session = await unsealSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === LOGIN_PATH) {
    if (session) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (isAdminPath(pathname)) {
    // Every ERP screen requires a valid, unexpired, signed session.
    if (!session || !request.cookies.get(ACCESS_COOKIE)?.value) {
      const login = new URL(LOGIN_PATH, request.url);
      login.search = "";
      login.searchParams.set("next", pathname + request.nextUrl.search);
      const res = NextResponse.redirect(login);
      res.cookies.delete(SESSION_COOKIE);
      res.cookies.delete(ACCESS_COOKIE);
      return res;
    }
    const url = request.nextUrl.clone();
    const stripped = pathname.startsWith("/admin")
      ? pathname.replace(/^\/admin/, "") || "/dashboard"
      : pathname;
    // Role gate (lib/rbac.ts): the URL stays, the page is swapped for "access denied".
    const capability = routeCapability(stripped);
    if (!can(session, capability)) {
      url.pathname = `/i/admin/${tenant}/access-denied`;
      url.search = "";
      requestHeaders.set("x-denied-capability", capability);
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
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
