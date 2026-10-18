/**
 * Signed session cookie — Web Crypto only, so it runs in Edge middleware and Node.
 *
 * Two HttpOnly cookies are issued at login:
 *   kp_at   — the backend JWT, forwarded as `Authorization: Bearer` by the BFF proxy
 *   kp_sess — HMAC-signed profile (roles, permissions, tenant) used by middleware and
 *             server components for routing/UI. Tampering breaks the signature.
 * Neither is readable from JavaScript, so XSS cannot steal the token.
 */

export const ACCESS_COOKIE = "kp_at";
export const SESSION_COOKIE = "kp_sess";

export type SessionUser = {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  tenantId: string;
  branchId: string | null;
  roles: string[];
  permissions: string[];
  /** Expiry, epoch seconds — mirrors the JWT */
  exp: number;
};

/**
 * Local dev only: the real tenant-resolve and login APIs are still called, but a
 * failure (no users are registered on the backend yet) does not block sign-in.
 * Never active in a production build.
 */
export function devAuthBypass(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true"
  );
}

export const DEV_TENANT_ID = "dev-tenant";
export const DEV_TENANT_NAME = "Kinder Pilot (dev)";
/** Stands in for the backend JWT; the backend rejects it, so BFF calls return 401. */
export const DEV_ACCESS_TOKEN = "dev-bypass";

function envList(value: string | undefined, fallback: string[]): string[] {
  const list = (value ?? "")
    .split(",")
    .map((v) => v.trim().toUpperCase())
    .filter(Boolean);
  return list.length ? list : fallback;
}

/** Placeholder user for `devAuthBypass()` when the backend login does not succeed. */
export function devSession(tenantId: string = DEV_TENANT_ID): SessionUser {
  return {
    userId: "dev",
    username: "dev",
    email: "",
    fullName: "Dev User",
    tenantId,
    branchId: null,
    // Pick the role to test with DEV_ROLES / DEV_PERMISSIONS (comma-separated) in .env.local.
    roles: envList(process.env.DEV_ROLES, ["COMPANY_ADMIN"]),
    permissions: envList(process.env.DEV_PERMISSIONS, []),
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
  };
}

const DEV_SECRET ="kp-dev-only-session-secret-change-me-0123456789";

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set (32+ random characters) in production");
  }
  return DEV_SECRET;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

let keyPromise: Promise<CryptoKey> | null = null;
function hmacKey(): Promise<CryptoKey> {
  keyPromise ??= crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return keyPromise;
}

export async function sealSession(session: SessionUser): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(sig))}`;
}

/** Returns the session only if the signature is valid and it has not expired. */
export async function unsealSession(value: string | undefined | null): Promise<SessionUser | null> {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  try {
    // crypto.subtle.verify is constant-time.
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromBase64Url(sig),
      encoder.encode(payload)
    );
    if (!ok) return null;
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as SessionUser;
    if (!session.exp || session.exp * 1000 <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Signed, expiring token for shareable links (e.g. hire invites) — stateless, so
 * it works on any server instance. The signature covers `purpose`, so a token
 * minted for one use (or a session cookie) never verifies as another.
 */
export async function sealToken<T extends object>(purpose: string, data: T, exp: number): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ exp, data })));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(`${purpose}.${payload}`));
  return `${payload}.${toBase64Url(new Uint8Array(sig))}`;
}

/** Token data only if the signature matches `purpose` and it has not expired. */
export async function unsealToken<T>(
  purpose: string,
  value: string | undefined | null
): Promise<{ data: T; exp: number } | null> {
  if (!value || value.length > 4096) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromBase64Url(sig),
      encoder.encode(`${purpose}.${payload}`)
    );
    if (!ok) return null;
    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as {
      exp?: number;
      data?: T;
    };
    if (!parsed.exp || parsed.exp * 1000 <= Date.now() || !parsed.data) return null;
    return { data: parsed.data, exp: parsed.exp };
  } catch {
    return null;
  }
}

/** Reads `exp` from a JWT without verifying it — the backend verifies on every call. */
export function jwtExpiry(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(part))) as { exp?: unknown };
    return typeof claims.exp === "number" ? claims.exp : null;
  } catch {
    return null;
  }
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.max(0, Math.floor(maxAgeSeconds)),
  };
}
