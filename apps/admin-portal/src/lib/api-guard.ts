import { NextResponse } from "next/server";

/**
 * Shared guards for the ERP's route handlers (`src/app/api/*`).
 *
 * CORS: only origins listed in `ALLOWED_ORIGINS` (comma-separated, e.g. the parent
 * portal's URL) get an `Access-Control-Allow-Origin` echo. Never use `*` — once
 * requests carry a session cookie, a wildcard would let any site read the response.
 */

const DEV_ORIGINS = ["http://localhost:3001", "http://127.0.0.1:3001"];

function allowedOrigins(): string[] {
  const configured = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return process.env.NODE_ENV === "production" ? configured : [...configured, ...DEV_ORIGINS];
}

export function corsHeaders(request: Request, methods = "GET, POST, OPTIONS"): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, X-Requested-With, X-XSRF-TOKEN",
    "Cache-Control": "no-store",
  };
  const origin = request.headers.get("origin");
  if (origin && allowedOrigins().includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

export function preflight(request: Request, methods?: string) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request, methods) });
}

/** Parses a JSON object body; malformed or non-object bodies yield `null` instead of a 500. */
export async function readJsonObject(request: Request): Promise<Record<string, any> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, any>)
      : null;
  } catch {
    return null;
  }
}
