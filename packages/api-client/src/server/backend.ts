import {
  customDomainSlug,
  resolveTenantSlugFromHost,
  tenantSubdomainFromHostname,
} from "../tenant";
import { DEV_TENANT_ID, DEV_TENANT_NAME, devAuthBypass } from "./session";
import { traceBackend } from "./trace";

/**
 * Server-only access to the KinderPilot backend. `API_BASE_URL` is deliberately
 * not `NEXT_PUBLIC_` — the browser only ever talks to this app's own /api routes.
 */
export function apiBaseUrl(): string {
  const raw = process.env.API_BASE_URL?.trim().replace(/\/$/, "");
  if (!raw) throw new Error("API_BASE_URL is not configured");
  if (
    process.env.NODE_ENV === "production" &&
    !raw.startsWith("https://") &&
    process.env.ALLOW_INSECURE_API_HTTP !== "true"
  ) {
    // Passwords and JWTs would cross the network in clear text.
    throw new Error("API_BASE_URL must use https:// in production");
  }
  return raw;
}

const TIMEOUT_MS = 30_000;

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  const url = `${apiBaseUrl()}${path}`;
  const method = (init.method ?? "GET").toUpperCase();
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
      redirect: "manual",
      signal: init.signal ?? AbortSignal.timeout(TIMEOUT_MS),
    });
    await traceBackend({ method, url, headers, body: init.body, response, startedAt });
    return response;
  } catch (error) {
    await traceBackend({ method, url, headers, body: init.body, response: null, startedAt, error });
    throw error;
  }
}

export async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Tenant resolution: Host → subdomain → GET /public/tenant/resolve    */
/* ------------------------------------------------------------------ */

export type ResolvedTenant = {
  tenantId: string;
  companyName: string;
  subdomain: string;
  status: string;
  active: boolean;
};

type CacheEntry = { value: ResolvedTenant | null; expires: number };
const tenantCache = new Map<string, CacheEntry>();
const HIT_TTL = 5 * 60_000;
const MISS_TTL = 30_000;

/**
 * Subdomain used to look the tenant up: a custom domain or a tenant subdomain in
 * the Host wins (`schoola.kinderpilot.com`, dev `schoola.localhost`); otherwise
 * `TENANT_SUBDOMAIN` pins one school for hosts that cannot carry a subdomain —
 * plain localhost or a `*.vercel.app` preview. Leave it unset where real
 * tenant domains are in use.
 */
export function tenantSubdomainFromHost(host: string | null): string | null {
  return explicitSubdomain(host) ?? (host ? resolveTenantSlugFromHost(host) : null);
}

function explicitSubdomain(host: string | null): string | null {
  const fromHost = host ? customDomainSlug(host) ?? tenantSubdomainFromHostname(host) : null;
  return fromHost || process.env.TENANT_SUBDOMAIN?.trim().toLowerCase() || null;
}

/**
 * Dev bypass only: stands in when the backend has no tenant for this host, so
 * http://schoola.localhost:3000 signs in (and mints dev tokens) as tenant
 * "schoola". Plain localhost falls back to `DEV_TENANT_ID`.
 */
export function devFallbackTenant(host: string | null): ResolvedTenant | null {
  if (!devAuthBypass()) return null;
  const sub = explicitSubdomain(host);
  return {
    tenantId: sub ?? DEV_TENANT_ID,
    companyName: sub ? `${sub} (dev)` : DEV_TENANT_NAME,
    subdomain: sub ?? "",
    status: "DEV",
    active: true,
  };
}

/**
 * Tenant is always derived server-side from the Host header — never from the
 * request body — so a user cannot log in or act against another school's tenant.
 */
export async function resolveTenant(host: string | null): Promise<ResolvedTenant | null> {
  const subdomain = tenantSubdomainFromHost(host);
  if (!subdomain || !/^[a-z0-9-]{1,63}$/i.test(subdomain)) return null;

  const cached = tenantCache.get(subdomain);
  if (cached && cached.expires > Date.now()) return cached.value;

  let value: ResolvedTenant | null = null;
  try {
    const res = await backendFetch(
      `/api/v1/public/tenant/resolve?subdomain=${encodeURIComponent(subdomain)}`
    );
    if (res.ok) {
      const data = await readJson<ResolvedTenant>(res);
      if (data?.tenantId && data.active !== false) value = data;
    } else if (res.status >= 500) {
      return null; // don't cache backend outages
    }
  } catch {
    return null;
  }

  tenantCache.set(subdomain, { value, expires: Date.now() + (value ? HIT_TTL : MISS_TTL) });
  return value;
}

/* ------------------------------------------------------------------ */
/* Rate limiting (per server instance — the backend must also limit)   */
/* ------------------------------------------------------------------ */

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Fixed-window limiter. Returns seconds to wait, or 0 when allowed. */
export function rateLimit(key: string, limit: number, windowMs: number): number {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return 0;
  }
  bucket.count += 1;
  return bucket.count > limit ? Math.ceil((bucket.resetAt - now) / 1000) : 0;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
