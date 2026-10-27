import { NextResponse } from "next/server";
import {
  backendFetch,
  clientIp,
  devFallbackTenant,
  rateLimit,
  readJson,
  resolveTenant,
} from "./backend";
import { getCookie, jsonError, rejectCrossSite } from "./guard";
import {
  ACCESS_COOKIE,
  DEV_ACCESS_TOKEN,
  SESSION_COOKIE,
  cookieOptions,
  devAuthBypass,
  devSession,
  jwtExpiry,
  sealSession,
  unsealSession,
  type SessionBranch,
  type SessionUser,
} from "./session";

/** Hard ceiling on a browser session even if the backend issues longer-lived JWTs. */
const MAX_SESSION_SECONDS = 12 * 60 * 60;
const FIFTEEN_MIN = 15 * 60_000;

type LoginResponse = {
  token?: string;
  tokenType?: string;
  userId?: number | string;
  username?: string;
  email?: string;
  fullName?: string;
  tenantId?: string;
  branchId?: string | null;
  /** `BranchDto[]` since 2026-10; plain codes in older backends */
  branchIds?: unknown[];
  roles?: string[];
  permissions?: string[];
  expiresIn?: number;
};

/** Login `branchIds` → branches; accepts `BranchDto` objects and the older plain codes. Kept small for the cookie. */
function sessionBranches(list: unknown): SessionBranch[] {
  if (!Array.isArray(list)) return [];
  const out: SessionBranch[] = [];
  for (const item of list.slice(0, 50)) {
    if (typeof item === "string" || typeof item === "number") {
      const code = String(item).slice(0, 64);
      out.push({ id: code, code, name: code });
    } else if (item && typeof item === "object") {
      const b = item as { id?: unknown; code?: unknown; name?: unknown };
      const id = b.id != null ? String(b.id).slice(0, 64) : "";
      const code = typeof b.code === "string" && b.code ? b.code.slice(0, 64) : id;
      if (!code) continue;
      const name = typeof b.name === "string" && b.name.trim() ? b.name.trim().slice(0, 80) : code;
      out.push({ id: id || code, code, name });
    }
  }
  return out;
}

export type PublicSessionUser = Omit<SessionUser, "exp"> & { expiresAt: string };

export function toPublicUser(s: SessionUser): PublicSessionUser {
  const { exp, ...rest } = s;
  return { ...rest, expiresAt: new Date(exp * 1000).toISOString() };
}

function str(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length > 0 && v.length <= max ? v : null;
}

async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const data: unknown = await request.json();
    return data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function tooMany(retryAfter: number) {
  return jsonError(429, "Too many attempts. Please wait and try again.", {
    "Retry-After": String(retryAfter),
  });
}

/** 10+ chars and at least 3 of: lowercase, uppercase, digit, symbol. */
export function passwordPolicyError(pw: string): string | null {
  if (pw.length < 10) return "Password must be at least 10 characters.";
  if (pw.length > 128) return "Password is too long.";
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (classes < 3) {
    return "Use at least three of: lowercase, uppercase, numbers, symbols.";
  }
  return null;
}

function expirySeconds(data: LoginResponse): number {
  const now = Math.floor(Date.now() / 1000);
  const fromJwt = data.token ? jwtExpiry(data.token) : null;
  let exp = fromJwt;
  if (!exp && typeof data.expiresIn === "number" && data.expiresIn > 0) {
    // Spring backends commonly return milliseconds; treat very large values as ms.
    exp = now + (data.expiresIn > 10_000_000 ? Math.floor(data.expiresIn / 1000) : data.expiresIn);
  }
  return Math.min(exp ?? now + MAX_SESSION_SECONDS, now + MAX_SESSION_SECONDS);
}

/**
 * Dev bypass only: asks the backend's dev token tool (`POST /auth/token`) for a JWT
 * so BFF calls return real data before any account exists. Falls back to a
 * placeholder the backend rejects.
 */
export async function mintDevToken(session: SessionUser): Promise<string> {
  try {
    const res = await backendFetch("/api/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: session.username,
        tenantId: session.tenantId,
        roles: session.roles,
        permissions: session.permissions,
      }),
    });
    const data = res.ok ? await readJson<LoginResponse>(res) : null;
    if (data?.token) return data.token;
  } catch {
    /* fall through */
  }
  return DEV_ACCESS_TOKEN;
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", cookieOptions(0));
  res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
  return res;
}

/* ------------------------------------------------------------------ */

/** POST { usernameOrEmail, password } — tenant comes from the Host, never the body. */
export async function loginHandler(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const input = await body(request);
  const usernameOrEmail = str(input.usernameOrEmail, 254);
  const password = typeof input.password === "string" ? input.password : "";
  if (!usernameOrEmail || !password || password.length > 256) {
    return jsonError(400, "Enter your username or email and password.");
  }

  const ip = clientIp(request);
  const wait =
    rateLimit(`login:ip:${ip}`, 20, FIFTEEN_MIN) ||
    rateLimit(`login:user:${usernameOrEmail.toLowerCase()}`, 5, FIFTEEN_MIN);
  if (wait) return tooMany(wait);

  // Dev bypass: the real calls below still run; only their failure is forgiven.
  const devLogin = async (tenantId?: string) => {
    const session = { ...devSession(tenantId), username: usernameOrEmail, fullName: usernameOrEmail };
    return sessionResponse(session, await mintDevToken(session));
  };
  const bypass = devAuthBypass();

  const host = request.headers.get("host");
  const tenant = await resolveTenant(host);
  if (!tenant) {
    const fallback = devFallbackTenant(host);
    return fallback
      ? devLogin(fallback.tenantId)
      : jsonError(404, "This school address is not recognised.");
  }

  let res: Response;
  try {
    res = await backendFetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
      body: JSON.stringify({ tenantId: tenant.tenantId, usernameOrEmail, password }),
    });
  } catch {
    if (bypass) return devLogin(tenant.tenantId);
    return jsonError(502, "Login service is unavailable. Please try again shortly.");
  }

  if (res.status >= 500) {
    if (bypass) return devLogin(tenant.tenantId);
    return jsonError(502, "Login service is unavailable. Please try again shortly.");
  }
  const data = res.ok ? await readJson<LoginResponse>(res) : null;
  // Same message for unknown user / wrong password / locked — no account enumeration.
  if (!data?.token || (data.tenantId && data.tenantId !== tenant.tenantId)) {
    if (bypass) return devLogin(tenant.tenantId);
    return jsonError(401, "Invalid username or password.");
  }
  if (data.tokenType && data.tokenType.toLowerCase() !== "bearer") {
    return jsonError(502, "Unexpected token type from login service.");
  }

  const exp = expirySeconds(data);
  const branches = sessionBranches(data.branchIds);
  const session: SessionUser = {
    userId: String(data.userId ?? ""),
    username: data.username ?? usernameOrEmail,
    email: data.email ?? "",
    fullName: data.fullName ?? data.username ?? usernameOrEmail,
    tenantId: tenant.tenantId,
    branchId: data.branchId ?? null,
    branchIds: branches.map((b) => b.code),
    branches,
    roles: Array.isArray(data.roles) ? data.roles.map(String) : [],
    permissions: Array.isArray(data.permissions) ? data.permissions.map(String) : [],
    exp,
  };

  return sessionResponse(session, data.token);
}

async function sessionResponse(session: SessionUser, token: string) {
  const maxAge = session.exp - Math.floor(Date.now() / 1000);
  const response = NextResponse.json(
    { user: toPublicUser(session) },
    { headers: { "Cache-Control": "no-store" } }
  );
  response.cookies.set(ACCESS_COOKIE, token, cookieOptions(maxAge));
  response.cookies.set(SESSION_COOKIE, await sealSession(session), cookieOptions(maxAge));
  return response;
}

/** POST — clears the session cookies. */
export async function logoutHandler(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  return clearSessionCookies(
    NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  );
}

/** GET — current user from the signed session cookie. */
export async function sessionHandler(request: Request) {
  const session = await unsealSession(getCookie(request, SESSION_COOKIE));
  if (!session || !getCookie(request, ACCESS_COOKIE)) {
    return clearSessionCookies(jsonError(401, "Not signed in"));
  }
  return NextResponse.json(
    { user: toPublicUser(session) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * POST { email } — always answers with the same message so it cannot be used to
 * discover accounts, and never passes the backend's reset token to the browser.
 */
export async function forgotPasswordHandler(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const input = await body(request);
  const email = str(input.email, 254);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError(400, "Enter a valid email address.");
  }

  const ip = clientIp(request);
  const wait =
    rateLimit(`forgot:ip:${ip}`, 10, FIFTEEN_MIN) ||
    rateLimit(`forgot:email:${email.toLowerCase()}`, 3, FIFTEEN_MIN);
  if (wait) return tooMany(wait);

  const tenant = await resolveTenant(request.headers.get("host"));
  if (tenant) {
    try {
      await backendFetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
        body: JSON.stringify({ tenantId: tenant.tenantId, email }),
      });
    } catch {
      /* swallow — response must not reveal anything */
    }
  }

  return NextResponse.json(
    { message: "If an account exists for that email, password reset instructions have been sent." },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/** POST { token, newPassword } */
export async function resetPasswordHandler(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const input = await body(request);
  const token = str(input.token, 512);
  const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";
  if (!token) return jsonError(400, "This reset link is invalid.");
  const policy = passwordPolicyError(newPassword);
  if (policy) return jsonError(400, policy);

  const wait = rateLimit(`reset:ip:${clientIp(request)}`, 10, FIFTEEN_MIN);
  if (wait) return tooMany(wait);

  const tenant = await resolveTenant(request.headers.get("host"));
  if (!tenant) return jsonError(404, "This school address is not recognised.");

  try {
    const res = await backendFetch("/api/v1/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: tenant.tenantId, token, newPassword }),
    });
    if (!res.ok) return jsonError(400, "This reset link is invalid or has expired.");
  } catch {
    return jsonError(502, "Service unavailable. Please try again shortly.");
  }
  return NextResponse.json({ message: "Password updated. You can now sign in." });
}

/** POST { oldPassword, newPassword } — signed-in users; forces a fresh login afterwards. */
export async function changePasswordHandler(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const token = getCookie(request, ACCESS_COOKIE);
  const session = await unsealSession(getCookie(request, SESSION_COOKIE));
  if (!token || !session) return clearSessionCookies(jsonError(401, "Not signed in"));

  const input = await body(request);
  const oldPassword = typeof input.oldPassword === "string" ? input.oldPassword : "";
  const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";
  if (!oldPassword) return jsonError(400, "Enter your current password.");
  if (oldPassword === newPassword) return jsonError(400, "New password must be different.");
  const policy = passwordPolicyError(newPassword);
  if (policy) return jsonError(400, policy);

  const wait = rateLimit(`change:user:${session.tenantId}:${session.userId}`, 5, FIFTEEN_MIN);
  if (wait) return tooMany(wait);

  try {
    const res = await backendFetch("/api/v1/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    if (res.status === 401) return clearSessionCookies(jsonError(401, "Session expired"));
    if (!res.ok) return jsonError(400, "Current password is incorrect.");
  } catch {
    return jsonError(502, "Service unavailable. Please try again shortly.");
  }
  return clearSessionCookies(
    NextResponse.json({ message: "Password changed. Please sign in again." })
  );
}
