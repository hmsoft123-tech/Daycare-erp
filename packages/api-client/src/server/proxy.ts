import { NextResponse } from "next/server";
import { apiBaseUrl, clientIp, devFallbackTenant, rateLimit, resolveTenant } from "./backend";
import { clearSessionCookies, mintDevToken } from "./auth";
import { getCookie, jsonError, rejectCrossSite } from "./guard";
import { traceBackend } from "./trace";
import {
  ACCESS_COOKIE,
  DEV_ACCESS_TOKEN,
  cookieOptions,
  SESSION_COOKIE,
  devAuthBypass,
  unsealSession,
} from "./session";

type RouteContext = { params: Promise<{ path?: string[] }> };

type ProxyOptions = {
  /**
   * Allowed backend paths, relative to `/api/v1/` (e.g. /^admissions(\/|$)/).
   * Anything not listed is refused, so dev-only or platform endpoints
   * (auth/token, companies/register, tenants/{id}/…) can never be reached from the browser.
   */
  allow: RegExp[];
  /** Max request body in bytes (default 15 MB, enough for document uploads). */
  maxBodyBytes?: number;
};

const FORWARD_REQUEST_HEADERS = ["content-type", "accept", "accept-language"];
const FORWARD_RESPONSE_HEADERS = ["content-type", "content-disposition", "content-length"];
const METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

/** Validates path segments and joins them; rejects traversal / encoded separators. */
function buildPath(segments: string[] | undefined): string | null {
  if (!segments?.length) return null;
  for (const s of segments) {
    if (!s || s === "." || s === ".." || /[\\/%?#\s]/.test(s) || s.length > 200) return null;
  }
  return segments.join("/");
}

async function forward(
  request: Request,
  path: string,
  search: string,
  authHeaders: Record<string, string>,
  maxBodyBytes: number
): Promise<NextResponse> {
  const method = request.method.toUpperCase();
  const headers = new Headers(authHeaders);
  for (const h of FORWARD_REQUEST_HEADERS) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("X-Forwarded-For", clientIp(request));

  let body: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "DELETE") {
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > maxBodyBytes) return jsonError(413, "Upload is too large.");
    body = await request.arrayBuffer();
    if (body.byteLength > maxBodyBytes) return jsonError(413, "Upload is too large.");
  }

  let upstream: Response;
  const url = `${apiBaseUrl()}/api/v1/${path}${search}`;
  const startedAt = Date.now();
  try {
    upstream = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    await traceBackend({ method, url, headers, body, response: null, startedAt, error });
    return jsonError(502, "The server is unavailable. Please try again shortly.");
  }
  await traceBackend({ method, url, headers, body, response: upstream, startedAt });

  if (upstream.status >= 300 && upstream.status < 400) {
    return jsonError(502, "Unexpected redirect from server.");
  }

  const out = new Headers({ "Cache-Control": "no-store" });
  for (const h of FORWARD_RESPONSE_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  // Backend Set-Cookie / CORS / server headers are intentionally dropped.
  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

/**
 * Authenticated BFF proxy: /api/bff/<path> → {API_BASE_URL}/api/v1/<path>
 * with the JWT from the HttpOnly cookie. The browser never sees the token.
 */
export function createBffProxy({ allow, maxBodyBytes = 15 * 1024 * 1024 }: ProxyOptions) {
  return async function handler(request: Request, context: RouteContext) {
    if (!METHODS.has(request.method.toUpperCase())) return jsonError(405, "Method not allowed");

    const blocked = rejectCrossSite(request);
    if (blocked) return blocked;

    const path = buildPath((await context.params).path);
    if (!path || !allow.some((re) => re.test(path))) return jsonError(404, "Not found");

    let token = getCookie(request, ACCESS_COOKIE);
    const session = await unsealSession(getCookie(request, SESSION_COOKIE));
    if (!token || !session) return clearSessionCookies(jsonError(401, "Not signed in"));

    // Dev bypass session still holding the placeholder: get a working dev JWT now.
    const upgradeToken = devAuthBypass() && token === DEV_ACCESS_TOKEN;
    if (upgradeToken) token = await mintDevToken(session);

    const wait = rateLimit(`bff:${session.tenantId}:${session.userId}`, 600, 60_000);
    if (wait) return jsonError(429, "Too many requests.", { "Retry-After": String(wait) });

    const res = await forward(
      request,
      path,
      new URL(request.url).search,
      { Authorization: `Bearer ${token}`, "X-Tenant-ID": session.tenantId },
      maxBodyBytes
    );
    if (upgradeToken && token !== DEV_ACCESS_TOKEN) {
      res.cookies.set(
        ACCESS_COOKIE,
        token,
        cookieOptions(session.exp - Math.floor(Date.now() / 1000))
      );
    }
    // Dev bypass sessions may carry no real JWT, so a 401 must not sign them out.
    return res.status === 401 && !devAuthBypass() ? clearSessionCookies(res) : res;
  };
}

/**
 * Unauthenticated proxy for public website forms / enrollment links:
 * /api/public/<path> → {API_BASE_URL}/api/v1/public/<path>. No cookies or tokens
 * are forwarded; tighter per-IP rate limit to slow spam and token guessing.
 */
export function createPublicProxy({ allow, maxBodyBytes = 15 * 1024 * 1024 }: ProxyOptions) {
  return async function handler(request: Request, context: RouteContext) {
    if (!METHODS.has(request.method.toUpperCase())) return jsonError(405, "Method not allowed");

    const blocked = rejectCrossSite(request);
    if (blocked) return blocked;

    const path = buildPath((await context.params).path);
    if (!path || !allow.some((re) => re.test(path))) return jsonError(404, "Not found");

    const wait = rateLimit(`public:${clientIp(request)}`, 30, 60_000);
    if (wait) return jsonError(429, "Too many requests.", { "Retry-After": String(wait) });

    const host = request.headers.get("host");
    const tenantId = ((await resolveTenant(host)) ?? devFallbackTenant(host))?.tenantId;
    if (!tenantId) return jsonError(404, "This school address is not recognised.");

    return forward(
      request,
      `public/${path}`,
      new URL(request.url).search,
      { "X-Tenant-ID": tenantId },
      maxBodyBytes
    );
  };
}
