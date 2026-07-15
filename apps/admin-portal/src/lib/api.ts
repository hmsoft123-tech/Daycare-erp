"use client";

import { useMemo } from "react";
import { createApiClient } from "@kinder-pilot/api-client";
import { useTenantStore } from "@/lib/tenant-store";

/**
 * Browser API client bound to current tenant/branch session headers.
 */
export function useApiClient() {
  const tenantId = useTenantStore((s) => s.tenantId);
  const branchId = useTenantStore((s) => s.currentBranchId);

  return useMemo(
    () =>
      createApiClient({
        getAccessToken: () =>
          typeof window !== "undefined" ? window.localStorage.getItem("kp_access_token") : null,
        getTenantId: () => tenantId,
        getBranchId: () => branchId,
      }),
    [tenantId, branchId]
  );
}
