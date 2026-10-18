import { NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defence for cookie-authenticated routes. State-changing requests must:
 *  1. come from this exact origin (Origin header, plus Sec-Fetch-Site when sent), and
 *  2. carry `X-Requested-With: XMLHttpRequest` — a custom header a cross-site form
 *     cannot set, and a cross-site fetch cannot send without a CORS preflight we never allow.
 * Returns an error response to send back, or null when the request is allowed.
 */
export function rejectCrossSite(request: Request): NextResponse | null {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return null;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return forbidden();

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return forbidden();
  try {
    if (new URL(origin).host !== host) return forbidden();
  } catch {
    return forbidden();
  }

  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") return forbidden();
  return null;
}

function forbidden() {
  return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
}

/** Reads a cookie from a standard Request (handlers take `Request`, not NextRequest). */
export function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export function jsonError(status: number, error: string, extraHeaders?: Record<string, string>) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store", ...extraHeaders } }
  );
}
