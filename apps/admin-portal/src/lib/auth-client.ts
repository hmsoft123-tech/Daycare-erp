"use client";

/** POSTs to this app's /api/auth/* and /api/hr/* routes with the header the CSRF guard requires. */
export async function authPost<T = { message?: string }>(
  path: `/api/auth/${string}` | `/api/hr/${string}`,
  body?: Record<string, unknown>
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify(body ?? {}),
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      return { ok: false, status: res.status, error: data.error ?? "Something went wrong." };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, status: 0, error: "Network error. Check your connection." };
  }
}

/**
 * Only same-site relative paths are allowed as post-login redirects —
 * blocks open redirects like `?next=//evil.com` or `?next=https://evil.com`.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  if (next.startsWith("/api/") || next.startsWith("/login")) return fallback;
  return next;
}

export async function logout(): Promise<void> {
  await authPost("/api/auth/logout");
  window.location.assign("/login");
}
