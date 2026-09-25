"use client";

import { useMemo } from "react";
import { createApiClient } from "@kinder-pilot/api-client";
import { useTenantStore } from "@/lib/tenant-store";

/**
 * Browser API client bound to current tenant/branch session headers.
 * Auth is the HttpOnly session cookie set by the API — no tokens in JS storage.
 */
export function useApiClient() {
  const tenantId = useTenantStore((s) => s.tenantId);
  const branchId = useTenantStore((s) => s.currentBranchId);

  return useMemo(
    () =>
      createApiClient({
        getTenantId: () => tenantId,
        getBranchId: () => branchId,
        onUnauthorized: () => {
          useTenantStore.getState().resetSession();
        },
      }),
    [tenantId, branchId]
  );
}
