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

/**
 * The origin sent to the widget endpoints. Each Vercel preview deployment has its own
 * URL, so previews use their stable branch URL: it goes on the allowed list once.
 */
function widgetOrigin(request: Request): string | null {
  const branchUrl = process.env.VERCEL_ENV === "preview" ? process.env.VERCEL_BRANCH_URL : undefined;
  return branchUrl ? `https://${branchUrl}` : siteOrigin(request);
}

/** This site's public origin (e.g. https://school.vercel.app), from the proxy headers. */
function siteOrigin(request: Request): string | null {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim();
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) return null;
  const proto = (request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", ""))
    .split(",")[0]
    .trim();
  return proto === "https" || proto === "http" ? `${proto}://${host}` : null;
}

async function forward(
  request: Request,
  path: string,
  search: string,
  authHeaders: Record<string, string>,
  maxBodyBytes: number,
  /** Fields set on a JSON object body, replacing whatever the browser sent */
  jsonOverrides?: Record<string, string>
): Promise<NextResponse> {
  const method = request.method.toUpperCase();
  const headers = new Headers(authHeaders);
  for (const h of FORWARD_REQUEST_HEADERS) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("X-Forwarded-For", clientIp(request));

  let body: ArrayBuffer | string | undefined;
  if (method !== "GET" && method !== "DELETE") {
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > maxBodyBytes) return jsonError(413, "Upload is too large.");
    body = await request.arrayBuffer();
    if (body.byteLength > maxBodyBytes) return jsonError(413, "Upload is too large.");

    if (jsonOverrides && headers.get("content-type")?.includes("application/json")) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(new TextDecoder().decode(body));
      } catch {
        return jsonError(400, "Invalid JSON body.");
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return jsonError(400, "Expected a JSON object.");
      }
      body = JSON.stringify({ ...parsed, ...jsonOverrides });
    }
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

    // The widget endpoints only answer websites on the company's allowed list. This app
    // is that website, but browsers omit Origin on same-origin GETs, so send our own.
    const origin = widgetOrigin(request);

    return forward(
      request,
      `public/${path}`,
      new URL(request.url).search,
      { "X-Tenant-ID": tenantId, ...(origin ? { Origin: origin } : {}) },
      maxBodyBytes,
      // Public forms name their school in the body; it is always this site's school,
      // never one chosen by the browser.
      path.startsWith("forms/") ? { tenantId } : undefined
    );
  };
}
