import { NextResponse, type NextRequest } from "next/server";
import { resolveTenantSlugFromHost } from "@kinder-pilot/api-client/tenant";

const STATIC_EXT =
  /\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|map|txt|woff|woff2|ttf|eot)$/i;

const PUBLIC_PATHS = ["/login"];

function isStaticOrApi(pathname: string): boolean {
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) return true;
  if (pathname === "/favicon.ico") return true;
  return STATIC_EXT.test(pathname);
}

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Parent portal edge routing:
 * 1. Resolve tenant from host
 * 2. Auth gate via kp_parent_session cookie
 * 3. Rewrite into /i/parents/[tenant]/...
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isStaticOrApi(pathname) || pathname.startsWith("/i/parents/")) {
    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? "";
  const tenant =
    resolveTenantSlugFromHost(host) ??
    process.env.NEXT_PUBLIC_DEFAULT_TENANT ??
    "kinder-pilot";

  const headers = new Headers(request.headers);
  headers.set("x-tenant-slug", tenant);

  const session = request.cookies.get("kp_parent_session")?.value;
  const authed = session === "1";

  // Unauthenticated users → /login (visible URL)
  if (!authed && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated on login/root → /home
  if (authed && (pathname === "/" || pathname === "/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  const path = pathname === "/" ? "/home" : pathname;
  url.pathname = `/i/parents/${tenant}${path}`;

  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
