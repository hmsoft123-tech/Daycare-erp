export type ApiClientConfig = {
  baseUrl?: string;
  getAccessToken?: () => string | null | undefined;
  getTenantId?: () => string | null | undefined;
  getBranchId?: () => string | null | undefined;
};

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
 * Shared Fetch wrapper — injects JWT + multi-tenant headers on every request.
 * Swap baseUrl to real API when backend is ready.
 */
export function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = config.baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);

    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }

    const token = config.getAccessToken?.();
    const tenantId = config.getTenantId?.();
    const branchId = config.getBranchId?.();

    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (tenantId) headers.set("X-Tenant-ID", tenantId);
    if (branchId) headers.set("X-Branch-ID", branchId);

    // TODO: Replace with real API call to `${baseUrl}${path}`
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });

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
