import { readCookie } from "./security";

export type ApiClientConfig = {
  baseUrl?: string;
  /**
   * Bearer token getter — only for server-to-server calls. In the browser, auth
   * rides on the HttpOnly session cookie (`credentials: "include"`); never keep
   * tokens in localStorage, where any XSS can read them.
   */
  getAccessToken?: () => string | null | undefined;
  getTenantId?: () => string | null | undefined;
  getBranchId?: () => string | null | undefined;
  /** Called on 401 / 419 so the app can clear state and redirect to login. */
  onUnauthorized?: () => void;
  /** Abort requests that take longer than this (default 20s). */
  timeoutMs?: number;
};

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
/** Laravel Sanctum sets this readable cookie; echo it back as a header to pass CSRF checks. */
const XSRF_COOKIE = "XSRF-TOKEN";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Shared Fetch wrapper — cookie session + CSRF + multi-tenant headers on every request.
 * `X-Tenant-ID` / `X-Branch-ID` are hints only: the API must derive tenant and branch
 * access from the authenticated user, never trust these headers alone.
 */
export function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = (config.baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
  const timeoutMs = config.timeoutMs ?? 20_000;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    // Only relative API paths — an absolute URL would send cookies/headers to another host.
    if (!path.startsWith("/") || path.startsWith("//")) {
      throw new ApiError(`Refusing non-relative API path: ${path}`, 0);
    }

    const headers = new Headers(init.headers);
    const method = (init.method ?? "GET").toUpperCase();

    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("Accept", "application/json");
    headers.set("X-Requested-With", "XMLHttpRequest");

    const token = config.getAccessToken?.();
    const tenantId = config.getTenantId?.();
    const branchId = config.getBranchId?.();

    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (tenantId) headers.set("X-Tenant-ID", tenantId);
    if (branchId) headers.set("X-Branch-ID", branchId);

    if (MUTATING.has(method)) {
      const xsrf = readCookie(XSRF_COOKIE);
      if (xsrf) headers.set("X-XSRF-TOKEN", xsrf);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    if (init.signal) init.signal.addEventListener("abort", () => controller.abort(), { once: true });

    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        credentials: "include",
        ...init,
        method,
        headers,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 401 || res.status === 419) {
      config.onUnauthorized?.();
    }

    if (!res.ok) {
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = undefined;
      }
      throw new ApiError(`API ${res.status}: ${path}`, res.status, body);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "GET" }),
    post: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: "POST", body: body ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: "PUT", body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "DELETE" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

export * from "./tenant";
export * from "./security";
