"use client";

import { useMemo } from "react";
import { createApiClient } from "@kinder-pilot/api-client";
import { useTenantStore } from "@/lib/tenant-store";

function redirectToLogin() {
  if (typeof window === "undefined") return;
  // Dev bypass has no backend JWT, so BFF calls 401 — stay on the page instead of looping via /login.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true"
  ) {
    return;
  }
  useTenantStore.getState().clearUserSession();
  const next = window.location.pathname + window.location.search;
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

/**
 * Browser client for the authenticated BFF (`/api/bff/*` → KinderPilot `/api/v1/*`).
 * The JWT lives in an HttpOnly cookie the proxy attaches — no tokens in JS.
 * Usage: `api.get<Inquiry[]>("/admissions/inquiries")`
 */
export function useApiClient() {
  const tenantId = useTenantStore((s) => s.tenantId);
  const branchId = useTenantStore((s) => s.currentBranchId);

  return useMemo(
    () =>
      createApiClient({
        baseUrl: "/api/bff",
        getTenantId: () => tenantId,
        getBranchId: () => branchId,
        onUnauthorized: redirectToLogin,
      }),
    [tenantId, branchId]
  );
}

/** Unauthenticated client for public forms / enrollment links (`/api/public/*`). */
export const publicApi = createApiClient({ baseUrl: "/api/public" });
